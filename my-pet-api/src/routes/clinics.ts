import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { destroyCloudinaryUrl } from '../lib/cloudinary-assets.js'
import {
  CAN, guardClinic, findClinicPatient, readMultipart,
  uploadLicensePhoto, destroyLicensePhoto, uploadPublicFile,
} from '../lib/clinic.js'

// ==========================================================
// CLÍNICAS VETERINARIAS (/clinics) — etapa 1
// Alta con matrícula, equipo, clientes, pacientes e historia clínica.
// Todas las rutas de una clínica llevan su id: /clinics/:clinicId/...
// ==========================================================

const DAY_MS = 24 * 60 * 60 * 1000
const TRIAL_DAYS = 30
const INVITE_DAYS = 7

// Texto opcional: vacío = null
const optText = (max = 500) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null))
// Fecha "AAAA-MM-DD" opcional (se guarda a medianoche UTC, como el resto de la app)
const optDate = z.string().optional().nullable().transform((v) => (v ? new Date(v) : null))
const optNumber = (min: number, max: number) =>
  z.union([z.number(), z.string()]).optional().nullable()
    .transform((v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(',', '.'))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), { message: `Valor fuera de rango (${min} a ${max})` })

const SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'FERRET', 'REPTILE', 'FISH', 'HORSE', 'OTHER'] as const

const clinicSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre de la veterinaria').max(100),
  address: z.string().trim().min(3, 'Ingresá la dirección').max(200),
  city: z.string().trim().min(2, 'Ingresá la ciudad').max(80),
  province: z.string().trim().min(2, 'Ingresá la provincia').max(80),
  phone: z.string().trim().min(6, 'Ingresá un teléfono').max(30),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')).transform((v) => v || null),
})

const licenseSchema = z.object({
  licenseNumber: z.string().trim().min(2, 'Ingresá el número de matrícula').max(30),
  licenseIssuer: z.string().trim().min(2, 'Indicá el colegio o la provincia de la matrícula').max(100),
})

const clientSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre').max(60),
  lastname: z.string().trim().min(2, 'Ingresá el apellido').max(60),
  dni: optText(20),
  phone: optText(30),
  email: z.string().trim().email('Email inválido').optional().nullable().or(z.literal('')).transform((v) => v || null),
  address: optText(200),
  notes: optText(1000),
})

const patientSchema = z.object({
  clientId: z.string(),
  name: z.string().trim().min(1, 'Ingresá el nombre').max(60),
  species: z.enum(SPECIES, { message: 'Elegí una especie' }),
  breed: optText(80),
  sex: z.enum(['Macho', 'Hembra']).optional().nullable(),
  birthDate: optDate,
  coat: optText(120),
  microchip: optText(40),
  isCastrated: z.boolean().default(false),
  weightKg: optNumber(0.01, 1500),
  alerts: optText(500),
  deceased: z.boolean().optional(),
})

const recordSchema = z.object({
  date: z.string().min(1, 'Falta la fecha'),
  type: z.enum(['CONSULTATION', 'CONTROL', 'EMERGENCY', 'SURGERY', 'OTHER']).default('CONSULTATION'),
  reason: z.string().trim().min(2, 'Ingresá el motivo de consulta').max(300),
  anamnesis: optText(5000),
  weightKg: optNumber(0.01, 1500),
  temperatureC: optNumber(25, 46),
  heartRate: optNumber(1, 500),
  respiratoryRate: optNumber(1, 300),
  mucous: optText(60),
  capillaryRefill: optText(30),
  hydration: optText(60),
  bodyCondition: optNumber(1, 9),
  physicalExam: optText(5000),
  presumptiveDx: optText(1000),
  finalDx: optText(1000),
  treatment: optText(5000),
  nextControl: optDate,
})

const preventiveSchema = z.object({
  kind: z.enum(['VACCINE', 'DEWORMING']),
  name: z.string().trim().min(2, 'Ingresá el producto').max(100),
  lot: optText(40),
  route: z.enum(['INTERNA', 'EXTERNA']).optional().nullable(),
  dateApplied: z.string().min(1, 'Falta la fecha'),
  nextDueDate: optDate,
})

const firstError = (e: z.ZodError) => e.issues[0]?.message ?? 'Datos inválidos'
const newToken = () => randomBytes(24).toString('base64url')
const toInt = (v: number | null) => (v === null ? null : Math.round(v))

export default async function clinicRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------
  // MIS CLÍNICAS (GET /clinics/mine)
  // ---------------------------------------------------------------
  app.get('/mine', { preHandler: [authenticate] }, async (req) => {
    const memberships = await prisma.clinicMember.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'asc' },
      include: { clinic: true },
    })
    return memberships.map((m) => ({
      memberId: m.id,
      role: m.role,
      licenseNumber: m.licenseNumber,
      licenseIssuer: m.licenseIssuer,
      licenseStatus: m.licenseStatus,
      licenseNote: m.licenseNote,
      clinic: m.clinic,
    }))
  })

  // ---------------------------------------------------------------
  // REGISTRAR UNA VETERINARIA (POST /clinics) — multipart:
  // datos de la clínica + matrícula de quien la registra + foto del carnet (+ logo opcional)
  // ---------------------------------------------------------------
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const { fields, files } = await readMultipart(req.parts())
    const clinic = clinicSchema.safeParse(fields)
    if (!clinic.success) return reply.status(400).send({ message: firstError(clinic.error) })
    const license = licenseSchema.safeParse(fields)
    if (!license.success) return reply.status(400).send({ message: firstError(license.error) })
    if (!files.licensePhoto) return reply.status(400).send({ message: 'Subí una foto de tu carnet de matrícula' })

    const already = await prisma.clinicMember.count({ where: { userId: req.user.sub, role: 'OWNER' } })
    if (already > 0) return reply.status(409).send({ message: 'Ya registraste una veterinaria con esta cuenta' })

    const licensePhotoId = await uploadLicensePhoto(files.licensePhoto)
    const logoUrl = files.logo ? (await uploadPublicFile(files.logo, 'clinic-logos')).secure_url : null

    const created = await prisma.clinic.create({
      data: {
        ...clinic.data,
        logoUrl,
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * DAY_MS),
        members: {
          create: {
            userId: req.user.sub,
            role: 'OWNER',
            ...license.data,
            licensePhotoId,
            licenseStatus: 'PENDING',
          },
        },
      },
    })
    return reply.status(201).send(created)
  })

  // EDITAR DATOS DE LA CLÍNICA (PUT /clinics/:clinicId) — multipart (logo opcional)
  app.put('/:clinicId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    const { fields, files } = await readMultipart(req.parts())
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.manageClinic))) return
    const parsed = clinicSchema.safeParse(fields)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })

    const current = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } })
    let logoUrl = current.logoUrl
    if (files.logo) {
      logoUrl = (await uploadPublicFile(files.logo, 'clinic-logos')).secure_url
      await destroyCloudinaryUrl(current.logoUrl)
    }
    return prisma.clinic.update({ where: { id: clinicId }, data: { ...parsed.data, logoUrl } })
  })

  // VOLVER A ENVIAR MI MATRÍCULA (PUT /clinics/:clinicId/me/license) — multipart
  app.put('/:clinicId/me/license', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    const { fields, files } = await readMultipart(req.parts())
    const member = await guardClinic(reply, clinicId, req.user.sub, CAN.clinical)
    if (!member) return
    const parsed = licenseSchema.safeParse(fields)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    if (!files.licensePhoto && !member.licensePhotoId) return reply.status(400).send({ message: 'Subí una foto de tu carnet de matrícula' })

    let licensePhotoId = member.licensePhotoId
    if (files.licensePhoto) {
      licensePhotoId = await uploadLicensePhoto(files.licensePhoto)
      await destroyLicensePhoto(member.licensePhotoId)
    }
    await prisma.clinicMember.update({
      where: { id: member.id },
      data: { ...parsed.data, licensePhotoId, licenseStatus: 'PENDING', licenseNote: null, licenseReviewedAt: null },
    })
    return { message: 'Matrícula enviada a revisión' }
  })

  // ---------------------------------------------------------------
  // EQUIPO
  // ---------------------------------------------------------------
  app.get('/:clinicId/team', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    const me = await guardClinic(reply, clinicId, req.user.sub)
    if (!me) return
    const [members, invites] = await Promise.all([
      prisma.clinicMember.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, lastname: true, email: true } } },
      }),
      me.role === 'OWNER'
        ? prisma.clinicInvite.findMany({
            where: { clinicId, revokedAt: null, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])
    return {
      members: members.map((m) => ({
        id: m.id, role: m.role, user: m.user,
        licenseNumber: m.licenseNumber, licenseIssuer: m.licenseIssuer, licenseStatus: m.licenseStatus,
      })),
      invites,
    }
  })

  app.post('/:clinicId/invites', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    const { role } = (req.body ?? {}) as { role?: string }
    if (role !== 'VET' && role !== 'STAFF') return reply.status(400).send({ message: 'Rol inválido' })
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.manageClinic))) return
    const invite = await prisma.clinicInvite.create({
      data: { clinicId, role, token: newToken(), expiresAt: new Date(Date.now() + INVITE_DAYS * DAY_MS) },
    })
    return reply.status(201).send(invite)
  })

  app.delete('/:clinicId/invites/:inviteId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, inviteId } = req.params as { clinicId: string; inviteId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.manageClinic))) return
    const { count } = await prisma.clinicInvite.updateMany({ where: { id: inviteId, clinicId }, data: { revokedAt: new Date() } })
    if (count === 0) return reply.status(404).send({ message: 'Invitación no encontrada' })
    return { message: 'Invitación revocada' }
  })

  // Quitar a alguien del equipo (el OWNER no se puede quitar a sí mismo)
  app.delete('/:clinicId/members/:memberId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, memberId } = req.params as { clinicId: string; memberId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.manageClinic))) return
    const member = await prisma.clinicMember.findFirst({ where: { id: memberId, clinicId } })
    if (!member) return reply.status(404).send({ message: 'No encontrado' })
    if (member.role === 'OWNER') return reply.status(400).send({ message: 'No podés quitar a quien administra la clínica' })
    await destroyLicensePhoto(member.licensePhotoId)
    await prisma.clinicMember.delete({ where: { id: member.id } })
    return { message: 'Quitado del equipo' }
  })

  // INVITACIÓN AL EQUIPO: ver (sin login) y aceptar (con login; si es VET, con matrícula)
  app.get('/invites/:token', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { token } = req.params as { token: string }
    const invite = await prisma.clinicInvite.findUnique({ where: { token }, include: { clinic: { select: { name: true, city: true, logoUrl: true } } } })
    if (!invite) return reply.status(404).send({ message: 'La invitación no existe' })
    if (invite.revokedAt || invite.usedAt || invite.expiresAt <= new Date()) {
      return reply.status(410).send({ message: 'Esta invitación ya se usó o venció. Pedí una nueva a la clínica.' })
    }
    return { role: invite.role, clinic: invite.clinic, expiresAt: invite.expiresAt }
  })

  app.post('/invites/:token/accept', { preHandler: [authenticate] }, async (req, reply) => {
    const { token } = req.params as { token: string }
    const { fields, files } = req.isMultipart() ? await readMultipart(req.parts()) : { fields: {} as Record<string, string>, files: {} as Record<string, never> }
    const invite = await prisma.clinicInvite.findUnique({ where: { token } })
    if (!invite) return reply.status(404).send({ message: 'La invitación no existe' })
    if (invite.revokedAt || invite.usedAt || invite.expiresAt <= new Date()) {
      return reply.status(410).send({ message: 'Esta invitación ya se usó o venció. Pedí una nueva a la clínica.' })
    }
    const already = await prisma.clinicMember.findUnique({ where: { clinicId_userId: { clinicId: invite.clinicId, userId: req.user.sub } } })
    if (already) return { clinicId: invite.clinicId }

    let license = {}
    if (invite.role === 'VET') {
      const parsed = licenseSchema.safeParse(fields)
      if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
      if (!('licensePhoto' in files)) return reply.status(400).send({ message: 'Subí una foto de tu carnet de matrícula' })
      license = { ...parsed.data, licensePhotoId: await uploadLicensePhoto(files.licensePhoto), licenseStatus: 'PENDING' as const }
    }

    const claimed = await prisma.clinicInvite.updateMany({ where: { id: invite.id, usedAt: null }, data: { usedAt: new Date(), usedById: req.user.sub } })
    if (claimed.count === 0) return reply.status(410).send({ message: 'Esta invitación ya se usó.' })
    await prisma.clinicMember.create({ data: { clinicId: invite.clinicId, userId: req.user.sub, role: invite.role, ...license } })
    return reply.status(201).send({ clinicId: invite.clinicId })
  })

  // ---------------------------------------------------------------
  // INICIO DE LA CLÍNICA (GET /clinics/:clinicId/home)
  // ---------------------------------------------------------------
  app.get('/:clinicId/home', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const [patients, clients, recent] = await Promise.all([
      prisma.clinicPatient.count({ where: { clinicId, deceasedAt: null } }),
      prisma.clinicClient.count({ where: { clinicId } }),
      prisma.clinicalRecord.findMany({
        where: { clinicId },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 40,
        select: {
          date: true, reason: true, type: true,
          patient: { select: { id: true, name: true, species: true, sex: true, client: { select: { name: true, lastname: true } } } },
        },
      }),
    ])
    // Últimos pacientes atendidos (uno por paciente)
    const seen = new Set<string>()
    const recentPatients = recent.filter((r) => !seen.has(r.patient.id) && seen.add(r.patient.id)).slice(0, 8)
    return { counts: { patients, clients }, recentPatients }
  })

  // BUSCAR (GET /clinics/:clinicId/search?q=) — pacientes por nombre o microchip, y por datos del dueño
  app.get('/:clinicId/search', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    const q = ((req.query as { q?: string }).q ?? '').trim()
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    if (q.length < 2) return { patients: [], clients: [] }
    const like = { contains: q, mode: 'insensitive' as const }
    const clientMatch = { OR: [{ name: like }, { lastname: like }, { phone: like }, { dni: like }, { email: like }] }
    const [patients, clients] = await Promise.all([
      prisma.clinicPatient.findMany({
        where: { clinicId, OR: [{ name: like }, { microchip: like }, { client: clientMatch }] },
        orderBy: { name: 'asc' },
        take: 20,
        include: { client: { select: { id: true, name: true, lastname: true, phone: true } } },
      }),
      prisma.clinicClient.findMany({ where: { clinicId, ...clientMatch }, orderBy: { lastname: 'asc' }, take: 10 }),
    ])
    return { patients, clients }
  })

  // ---------------------------------------------------------------
  // CLIENTES
  // ---------------------------------------------------------------
  app.get('/:clinicId/clients', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    return prisma.clinicClient.findMany({
      where: { clinicId },
      orderBy: [{ lastname: 'asc' }, { name: 'asc' }],
      include: { patients: { select: { id: true, name: true, species: true, deceasedAt: true } } },
    })
  })

  app.post('/:clinicId/clients', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const parsed = clientSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const client = await prisma.clinicClient.create({ data: { ...parsed.data, clinicId } })
    return reply.status(201).send(client)
  })

  app.get('/:clinicId/clients/:clientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, clientId } = req.params as { clinicId: string; clientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const client = await prisma.clinicClient.findFirst({
      where: { id: clientId, clinicId },
      include: { patients: { orderBy: { name: 'asc' } } },
    })
    if (!client) return reply.status(404).send({ message: 'Cliente no encontrado' })
    return client
  })

  app.put('/:clinicId/clients/:clientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, clientId } = req.params as { clinicId: string; clientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const parsed = clientSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const { count } = await prisma.clinicClient.updateMany({ where: { id: clientId, clinicId }, data: parsed.data })
    if (count === 0) return reply.status(404).send({ message: 'Cliente no encontrado' })
    return prisma.clinicClient.findUniqueOrThrow({ where: { id: clientId } })
  })

  app.delete('/:clinicId/clients/:clientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, clientId } = req.params as { clinicId: string; clientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.deleteRecords))) return
    const client = await prisma.clinicClient.findFirst({
      where: { id: clientId, clinicId },
      include: { patients: { select: { attachments: { select: { url: true } } } } },
    })
    if (!client) return reply.status(404).send({ message: 'Cliente no encontrado' })
    await Promise.all(client.patients.flatMap((p) => p.attachments.map((a) => destroyCloudinaryUrl(a.url))))
    await prisma.clinicClient.delete({ where: { id: client.id } })
    return { message: 'Cliente eliminado' }
  })

  // ---------------------------------------------------------------
  // PACIENTES
  // ---------------------------------------------------------------
  app.post('/:clinicId/patients', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId } = req.params as { clinicId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const parsed = patientSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const { deceased, ...data } = parsed.data
    const client = await prisma.clinicClient.findFirst({ where: { id: data.clientId, clinicId } })
    if (!client) return reply.status(400).send({ message: 'El cliente no es de esta clínica' })
    const patient = await prisma.clinicPatient.create({
      data: { ...data, clinicId, deceasedAt: deceased ? new Date() : null },
    })
    return reply.status(201).send(patient)
  })

  app.get('/:clinicId/patients/:patientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const patient = await prisma.clinicPatient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        client: true,
        records: {
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          include: { author: { select: { role: true, licenseNumber: true, user: { select: { name: true, lastname: true } } } } },
        },
        preventives: { orderBy: { dateApplied: 'desc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!patient) return reply.status(404).send({ message: 'Paciente no encontrado' })
    return patient
  })

  app.put('/:clinicId/patients/:patientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub))) return
    const existing = await findClinicPatient(reply, clinicId, patientId)
    if (!existing) return
    const parsed = patientSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const { deceased, ...data } = parsed.data
    const client = await prisma.clinicClient.findFirst({ where: { id: data.clientId, clinicId } })
    if (!client) return reply.status(400).send({ message: 'El cliente no es de esta clínica' })
    return prisma.clinicPatient.update({
      where: { id: patientId },
      data: {
        ...data,
        // Fallecido: conservamos la fecha original si ya estaba marcado
        deceasedAt: deceased ? existing.deceasedAt ?? new Date() : null,
      },
    })
  })

  app.delete('/:clinicId/patients/:patientId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.deleteRecords))) return
    if (!(await findClinicPatient(reply, clinicId, patientId))) return
    const files = await prisma.clinicAttachment.findMany({ where: { patientId }, select: { url: true } })
    await Promise.all(files.map((f) => destroyCloudinaryUrl(f.url)))
    await prisma.clinicPatient.delete({ where: { id: patientId } })
    return { message: 'Paciente eliminado' }
  })

  // ---------------------------------------------------------------
  // HISTORIA CLÍNICA (consultas)
  // ---------------------------------------------------------------
  app.post('/:clinicId/patients/:patientId/records', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    const member = await guardClinic(reply, clinicId, req.user.sub, CAN.clinical)
    if (!member) return
    if (!(await findClinicPatient(reply, clinicId, patientId))) return
    const parsed = recordSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const d = parsed.data
    const record = await prisma.clinicalRecord.create({
      data: {
        ...d,
        date: new Date(d.date),
        heartRate: toInt(d.heartRate),
        respiratoryRate: toInt(d.respiratoryRate),
        bodyCondition: toInt(d.bodyCondition),
        clinicId, patientId, authorId: member.id,
      },
    })
    // El peso de la consulta pasa a ser el peso actual del paciente
    if (d.weightKg !== null) await prisma.clinicPatient.update({ where: { id: patientId }, data: { weightKg: d.weightKg } })
    return reply.status(201).send(record)
  })

  app.put('/:clinicId/records/:recordId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, recordId } = req.params as { clinicId: string; recordId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.clinical))) return
    const existing = await prisma.clinicalRecord.findFirst({ where: { id: recordId, clinicId } })
    if (!existing) return reply.status(404).send({ message: 'Consulta no encontrada' })
    const parsed = recordSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const d = parsed.data
    return prisma.clinicalRecord.update({
      where: { id: recordId },
      data: { ...d, date: new Date(d.date), heartRate: toInt(d.heartRate), respiratoryRate: toInt(d.respiratoryRate), bodyCondition: toInt(d.bodyCondition) },
    })
  })

  app.delete('/:clinicId/records/:recordId', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, recordId } = req.params as { clinicId: string; recordId: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.deleteRecords))) return
    const { count } = await prisma.clinicalRecord.deleteMany({ where: { id: recordId, clinicId } })
    if (count === 0) return reply.status(404).send({ message: 'Consulta no encontrada' })
    return { message: 'Consulta eliminada' }
  })

  // ---------------------------------------------------------------
  // VACUNAS Y DESPARASITACIONES
  // ---------------------------------------------------------------
  app.post('/:clinicId/patients/:patientId/preventives', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    const member = await guardClinic(reply, clinicId, req.user.sub, CAN.clinical)
    if (!member) return
    if (!(await findClinicPatient(reply, clinicId, patientId))) return
    const parsed = preventiveSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const d = parsed.data
    const created = await prisma.clinicPreventive.create({
      data: { ...d, route: d.kind === 'DEWORMING' ? d.route ?? null : null, dateApplied: new Date(d.dateApplied), clinicId, patientId, authorId: member.id },
    })
    return reply.status(201).send(created)
  })

  app.put('/:clinicId/preventives/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, id } = req.params as { clinicId: string; id: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.clinical))) return
    const parsed = preventiveSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: firstError(parsed.error) })
    const d = parsed.data
    const { count } = await prisma.clinicPreventive.updateMany({
      where: { id, clinicId },
      data: { ...d, route: d.kind === 'DEWORMING' ? d.route ?? null : null, dateApplied: new Date(d.dateApplied) },
    })
    if (count === 0) return reply.status(404).send({ message: 'Registro no encontrado' })
    return { message: 'Actualizado' }
  })

  app.delete('/:clinicId/preventives/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, id } = req.params as { clinicId: string; id: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.deleteRecords))) return
    const { count } = await prisma.clinicPreventive.deleteMany({ where: { id, clinicId } })
    if (count === 0) return reply.status(404).send({ message: 'Registro no encontrado' })
    return { message: 'Eliminado' }
  })

  // ---------------------------------------------------------------
  // ESTUDIOS ADJUNTOS (multipart: file)
  // ---------------------------------------------------------------
  app.post('/:clinicId/patients/:patientId/attachments', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, patientId } = req.params as { clinicId: string; patientId: string }
    // Leemos el archivo primero (hay que consumir el cuerpo aunque después se rechace)
    const { files } = await readMultipart(req.parts())
    const member = await guardClinic(reply, clinicId, req.user.sub, CAN.clinical)
    if (!member) return
    if (!(await findClinicPatient(reply, clinicId, patientId))) return
    const file = files.file
    if (!file) return reply.status(400).send({ message: 'No se envió ningún archivo' })
    const uploaded = await uploadPublicFile(file, 'clinic-attachments')
    const created = await prisma.clinicAttachment.create({
      data: { clinicId, patientId, name: file.filename, url: uploaded.secure_url, fileType: uploaded.format || 'file', uploadedById: member.id },
    })
    return reply.status(201).send(created)
  })

  app.delete('/:clinicId/attachments/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { clinicId, id } = req.params as { clinicId: string; id: string }
    if (!(await guardClinic(reply, clinicId, req.user.sub, CAN.deleteRecords))) return
    const attachment = await prisma.clinicAttachment.findFirst({ where: { id, clinicId } })
    if (!attachment) return reply.status(404).send({ message: 'Archivo no encontrado' })
    await destroyCloudinaryUrl(attachment.url)
    await prisma.clinicAttachment.delete({ where: { id } })
    return { message: 'Eliminado' }
  })
}
