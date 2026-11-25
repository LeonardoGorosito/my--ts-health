import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { getSubscription } from '../lib/subscription.js'
import { licensePhotoUrl } from '../lib/clinic.js'

// ==========================================================
// ADMINISTRACIÓN (solo role ADMIN)
// Mientras no haya un medio de pago conectado, los planes se asignan a mano desde acá
// (ej: alguien pagó por transferencia). Cuando se conecte el proveedor, su webhook
// va a hacer lo mismo que PUT /admin/plan.
// ==========================================================

async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if ((req.user as { role?: string }).role !== 'ADMIN') {
    return reply.code(403).send({ message: 'Solo para administradores' })
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

const planSchema = z.object({
  email: z.string().email('Email inválido'),
  plan: z.enum(['STANDARD', 'PRO']).nullable(), // null = quitar el plan
  months: z.number().int().min(1).max(24).default(1),
})

export default async function adminRoutes(app: FastifyInstance) {
  // Ver el estado de un usuario por email
  app.get('/user', { preHandler: [authenticate, requireAdmin] }, async (req, reply) => {
    const { email } = req.query as { email?: string }
    if (!email) return reply.code(400).send({ message: 'Falta el email' })
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      select: { id: true, name: true, lastname: true, email: true, isVerified: true, createdAt: true, _count: { select: { pets: true } } },
    })
    if (!user) return reply.code(404).send({ message: 'No existe un usuario con ese email' })
    return { ...user, subscription: await getSubscription(user.id) }
  })

  // Asignar (o quitar) un plan. Si ya tiene el mismo plan vigente, se suman los meses.
  app.put('/plan', { preHandler: [authenticate, requireAdmin] }, async (req, reply) => {
    const parsed = planSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    const { email, plan, months } = parsed.data

    const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } } })
    if (!user) return reply.code(404).send({ message: 'No existe un usuario con ese email' })

    const now = new Date()
    let data: { plan: 'STANDARD' | 'PRO' | null; planExpiresAt: Date | null }
    if (!plan) {
      data = { plan: null, planExpiresAt: null }
    } else {
      const base = user.plan === plan && user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now
      data = { plan, planExpiresAt: new Date(base.getTime() + months * 30 * DAY_MS) }
    }

    await prisma.user.update({ where: { id: user.id }, data })
    req.log.info({ admin: req.user.sub, target: user.id, ...data }, 'Plan actualizado por admin')
    return { email: user.email, subscription: await getSubscription(user.id) }
  })

  // ---------------------------------------------------------------
  // MATRÍCULAS DE VETERINARIOS (GET /admin/licenses?status=PENDING)
  // Devuelve una URL firmada y temporal para ver la foto del carnet.
  // ---------------------------------------------------------------
  app.get('/licenses', { preHandler: [authenticate, requireAdmin] }, async (req) => {
    const { status } = req.query as { status?: string }
    const licenseStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = status === 'APPROVED' || status === 'REJECTED' ? status : 'PENDING'
    const where = { licenseStatus }
    const members = await prisma.clinicMember.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        user: { select: { name: true, lastname: true, email: true } },
        clinic: { select: { name: true, city: true, province: true, phone: true } },
      },
    })
    return members.map((m) => ({
      id: m.id, role: m.role, createdAt: m.createdAt,
      licenseNumber: m.licenseNumber, licenseIssuer: m.licenseIssuer, licenseStatus: m.licenseStatus, licenseNote: m.licenseNote,
      photoUrl: licensePhotoUrl(m.licensePhotoId),
      user: m.user, clinic: m.clinic,
    }))
  })

  const reviewSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    note: z.string().trim().max(300).optional(),
  })

  app.put('/licenses/:memberId', { preHandler: [authenticate, requireAdmin] }, async (req, reply) => {
    const { memberId } = req.params as { memberId: string }
    const parsed = reviewSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ message: 'Datos inválidos' })
    if (parsed.data.status === 'REJECTED' && !parsed.data.note) {
      return reply.code(400).send({ message: 'Escribí el motivo del rechazo: lo va a ver el veterinario' })
    }
    const { count } = await prisma.clinicMember.updateMany({
      where: { id: memberId, licenseNumber: { not: null } },
      data: { licenseStatus: parsed.data.status, licenseNote: parsed.data.status === 'REJECTED' ? parsed.data.note : null, licenseReviewedAt: new Date() },
    })
    if (count === 0) return reply.code(404).send({ message: 'Matrícula no encontrada' })
    return { message: parsed.data.status === 'APPROVED' ? 'Matrícula aprobada' : 'Matrícula rechazada' }
  })
}
