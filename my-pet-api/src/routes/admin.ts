import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { getSubscription } from '../lib/subscription.js'

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
}
