import { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { guardPet } from '../lib/access.js'

// ==========================================================
// COMPARTIR MASCOTAS (/shares)  — ver modelos PetMember y ShareLink
// - El dueño genera links: FAMILY (invitación de un solo uso) o VET (ficha de solo lectura).
// - Los dos vencen a los 7 días y se pueden revocar.
// - Familiares: ven y cargan registros; el acceso depende del plan del dueño.
// ==========================================================

const LINK_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const newToken = () => randomBytes(24).toString('base64url')

// Link utilizable: no revocado, no vencido y (si es invitación) no usado
const usableLink = () => ({ revokedAt: null, usedAt: null, expiresAt: { gt: new Date() } })

const userPublic = { select: { name: true, lastname: true } } as const

export default async function shareRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------
  // DUEÑO: estado de lo compartido (GET /shares/pet/:petId)
  // ---------------------------------------------------------------
  app.get('/pet/:petId', { preHandler: [authenticate] }, async (req, reply) => {
    const { petId } = req.params as { petId: string }
    if (!(await guardPet(reply, petId, req.user.sub, { ownerOnly: true }))) return

    const [members, links] = await Promise.all([
      prisma.petMember.findMany({
        where: { petId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, lastname: true, email: true } } },
      }),
      prisma.shareLink.findMany({
        where: { petId, ...usableLink() },
        orderBy: { createdAt: 'desc' },
        select: { id: true, kind: true, token: true, createdAt: true, expiresAt: true },
      }),
    ])
    return reply.send({
      members: members.map((m) => ({ id: m.id, createdAt: m.createdAt, user: m.user })),
      invites: links.filter((l) => l.kind === 'FAMILY'),
      vetLinks: links.filter((l) => l.kind === 'VET'),
    })
  })

  // ---------------------------------------------------------------
  // DUEÑO: crear un link (POST /shares/pet/:petId/links  { kind })
  // ---------------------------------------------------------------
  app.post('/pet/:petId/links', { preHandler: [authenticate] }, async (req, reply) => {
    const { petId } = req.params as { petId: string }
    const { kind } = (req.body ?? {}) as { kind?: string }
    if (kind !== 'FAMILY' && kind !== 'VET') return reply.status(400).send({ message: 'Tipo de link inválido' })
    if (!(await guardPet(reply, petId, req.user.sub, { ownerOnly: true, requirePlan: true }))) return

    // Evitamos acumular links: máximo 10 activos por mascota
    const active = await prisma.shareLink.count({ where: { petId, ...usableLink() } })
    if (active >= 10) {
      return reply.status(429).send({ message: 'Tenés demasiados links activos. Revocá alguno antes de crear otro.' })
    }

    const link = await prisma.shareLink.create({
      data: { petId, kind, token: newToken(), expiresAt: new Date(Date.now() + LINK_DAYS * DAY_MS) },
      select: { id: true, kind: true, token: true, createdAt: true, expiresAt: true },
    })
    return reply.status(201).send(link)
  })

  // DUEÑO: revocar un link (DELETE /shares/links/:id)
  app.delete('/links/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const link = await prisma.shareLink.findUnique({ where: { id } })
    if (!link) return reply.status(404).send({ message: 'Link no encontrado' })
    if (!(await guardPet(reply, link.petId, req.user.sub, { ownerOnly: true }))) return
    await prisma.shareLink.update({ where: { id }, data: { revokedAt: new Date() } })
    return reply.send({ message: 'Link revocado' })
  })

  // Quitar un familiar (DELETE /shares/members/:id)
  // El dueño quita a cualquiera; un familiar puede quitarse a sí mismo ("dejar de ver").
  app.delete('/members/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const member = await prisma.petMember.findUnique({ where: { id }, include: { pet: { select: { ownerId: true } } } })
    if (!member || (member.userId !== req.user.sub && member.pet.ownerId !== req.user.sub)) {
      return reply.status(404).send({ message: 'Acceso no encontrado' })
    }
    await prisma.petMember.delete({ where: { id } })
    return reply.send({ message: 'Acceso quitado' })
  })

  // Familiar: dejar de ver una mascota compartida (DELETE /shares/pet/:petId/me)
  app.delete('/pet/:petId/me', { preHandler: [authenticate] }, async (req, reply) => {
    const { petId } = req.params as { petId: string }
    const { count } = await prisma.petMember.deleteMany({ where: { petId, userId: req.user.sub } })
    if (count === 0) return reply.status(404).send({ message: 'No tenés acceso compartido a esta mascota' })
    return reply.send({ message: 'Dejaste de ver la mascota' })
  })

  // ---------------------------------------------------------------
  // INVITACIÓN: ver de qué se trata (GET /shares/invite/:token) — sin login,
  // para mostrar "Fulano te invitó a cuidar a Halu" antes de iniciar sesión.
  // ---------------------------------------------------------------
  app.get('/invite/:token', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { token } = req.params as { token: string }
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { pet: { select: { id: true, name: true, species: true, profileImageUrl: true, owner: userPublic } } },
    })
    if (!link || link.kind !== 'FAMILY') return reply.status(404).send({ message: 'La invitación no existe' })
    if (link.revokedAt || link.usedAt || link.expiresAt <= new Date()) {
      return reply.status(410).send({ message: 'Esta invitación ya se usó o venció. Pedile a quien te la mandó que genere otra.' })
    }
    return reply.send({
      pet: { id: link.pet.id, name: link.pet.name, species: link.pet.species, profileImageUrl: link.pet.profileImageUrl },
      owner: link.pet.owner,
      expiresAt: link.expiresAt,
    })
  })

  // INVITACIÓN: aceptar (POST /shares/invite/:token/accept)
  app.post('/invite/:token/accept', { preHandler: [authenticate] }, async (req, reply) => {
    const { token } = req.params as { token: string }
    const userId = req.user.sub
    const link = await prisma.shareLink.findUnique({ where: { token }, include: { pet: { select: { ownerId: true } } } })
    if (!link || link.kind !== 'FAMILY') return reply.status(404).send({ message: 'La invitación no existe' })
    if (link.pet.ownerId === userId) return reply.status(400).send({ message: 'Esta mascota ya es tuya' })

    const already = await prisma.petMember.findUnique({ where: { petId_userId: { petId: link.petId, userId } } })
    if (already) return reply.send({ petId: link.petId })

    if (link.revokedAt || link.usedAt || link.expiresAt <= new Date()) {
      return reply.status(410).send({ message: 'Esta invitación ya se usó o venció. Pedile a quien te la mandó que genere otra.' })
    }

    // Marcamos el link como usado solo si nadie lo usó en el medio (un solo uso)
    const claimed = await prisma.shareLink.updateMany({
      where: { id: link.id, usedAt: null },
      data: { usedAt: new Date(), usedById: userId },
    })
    if (claimed.count === 0) {
      return reply.status(410).send({ message: 'Esta invitación ya se usó. Pedile a quien te la mandó que genere otra.' })
    }
    await prisma.petMember.create({ data: { petId: link.petId, userId } })
    return reply.status(201).send({ petId: link.petId })
  })

  // ---------------------------------------------------------------
  // VETERINARIO: ficha de solo lectura sin cuenta (GET /shares/vet/:token)
  // ---------------------------------------------------------------
  app.get('/vet/:token', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { token } = req.params as { token: string }
    const link = await prisma.shareLink.findUnique({ where: { token } })
    if (!link || link.kind !== 'VET') return reply.status(404).send({ message: 'El link no existe' })
    if (link.revokedAt || link.expiresAt <= new Date()) {
      return reply.status(410).send({ message: 'Este link venció o fue revocado. Pedile a la familia que te mande uno nuevo.' })
    }

    const pet = await prisma.pet.findUnique({
      where: { id: link.petId },
      select: {
        id: true, name: true, species: true, breed: true, gender: true, birthDate: true, weight: true,
        isCastrated: true, specialNeeds: true, profileImageUrl: true,
        owner: { select: { name: true, lastname: true, email: true, phone: true } },
        vaccinations: { select: { id: true, name: true, dateApplied: true, nextDueDate: true } },
        dewormings: { select: { id: true, name: true, type: true, dateApplied: true, nextDueDate: true } },
        medicalHistory: { select: { id: true, date: true, title: true, description: true } },
        weights: { select: { id: true, date: true, weightKg: true, note: true } },
        treatments: { select: { id: true, name: true, dose: true, frequencyHours: true, startDate: true, endDate: true, notes: true } },
        // Solo nombres y fechas: los archivos no se exponen por este link
        attachments: { select: { id: true, name: true, createdAt: true } },
      },
    })
    if (!pet) return reply.status(404).send({ message: 'El link no existe' })
    return reply.send({ pet, expiresAt: link.expiresAt })
  })
}
