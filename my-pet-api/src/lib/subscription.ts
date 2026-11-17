import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.js'

// ==========================================================
// SUSCRIPCIONES
// - Al registrarse: 30 días de prueba con todo lo de Pro, sin tarjeta.
// - Plan pago (STANDARD | PRO) vigente hasta planExpiresAt.
// - Sin prueba ni plan vigente: solo lectura (la placa QR y el modo perdida siguen andando).
// - Los ADMIN siempre tienen Pro.
// ==========================================================

export const TRIAL_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type Tier = 'TRIAL' | 'STANDARD' | 'PRO' | 'EXPIRED'

export type Limits = {
  maxPets: number | null // null = ilimitadas
  reminders: boolean
  attachments: boolean
  readOnly: boolean
}

const PRO_LIMITS: Limits = { maxPets: null, reminders: true, attachments: true, readOnly: false }
const STANDARD_LIMITS: Limits = { maxPets: 2, reminders: false, attachments: false, readOnly: false }
const EXPIRED_LIMITS: Limits = { maxPets: 0, reminders: false, attachments: false, readOnly: true }

export const trialEndFromNow = () => new Date(Date.now() + TRIAL_DAYS * DAY_MS)

type SubscriptionFields = {
  role: 'USER' | 'ADMIN'
  plan: 'STANDARD' | 'PRO' | null
  planExpiresAt: Date | null
  trialEndsAt: Date | null
}

export const subscriptionSelect = { role: true, plan: true, planExpiresAt: true, trialEndsAt: true } as const

export function computeTier(u: SubscriptionFields, now = new Date()): Tier {
  if (u.role === 'ADMIN') return 'PRO'
  if (u.plan && u.planExpiresAt && u.planExpiresAt > now) return u.plan
  if (u.trialEndsAt && u.trialEndsAt > now) return 'TRIAL'
  return 'EXPIRED'
}

export function limitsFor(tier: Tier): Limits {
  if (tier === 'PRO' || tier === 'TRIAL') return PRO_LIMITS
  if (tier === 'STANDARD') return STANDARD_LIMITS
  return EXPIRED_LIMITS
}

// Estado completo de la suscripción. Usuarios creados antes de las suscripciones
// (trialEndsAt vacío) reciben sus 30 días de prueba la primera vez que se consulta.
export async function getSubscription(userId: string) {
  let u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: subscriptionSelect })
  if (!u.trialEndsAt) {
    u = await prisma.user.update({ where: { id: userId }, data: { trialEndsAt: trialEndFromNow() }, select: subscriptionSelect })
  }
  const now = new Date()
  const tier = computeTier(u, now)
  return {
    tier,
    plan: u.plan,
    planExpiresAt: u.planExpiresAt,
    trialEndsAt: u.trialEndsAt,
    trialDaysLeft: tier === 'TRIAL' && u.trialEndsAt ? Math.ceil((u.trialEndsAt.getTime() - now.getTime()) / DAY_MS) : 0,
    limits: limitsFor(tier),
  }
}

// ---------- preHandlers para las rutas (van DESPUÉS de authenticate) ----------

// Bloquea crear/editar cuando la cuenta está en solo lectura
export async function requireActive(req: FastifyRequest, reply: FastifyReply) {
  const sub = await getSubscription(req.user.sub)
  if (sub.limits.readOnly) {
    return reply.code(402).send({
      code: 'SUBSCRIPTION_EXPIRED',
      message: 'Tu prueba gratis terminó. Elegí un plan para seguir editando.',
    })
  }
}

// Bloquea funciones que no incluye el plan (ej: archivos adjuntos en Standard)
export function requireFeature(feature: 'attachments' | 'reminders') {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const sub = await getSubscription(req.user.sub)
    if (!sub.limits[feature]) {
      return reply.code(402).send({
        code: 'PLAN_REQUIRED',
        feature,
        message: 'Esta función está incluida en el plan Pro.',
      })
    }
  }
}

// Límite de mascotas del plan (para POST /pets)
export async function requirePetSlot(req: FastifyRequest, reply: FastifyReply) {
  const sub = await getSubscription(req.user.sub)
  if (sub.limits.readOnly) {
    return reply.code(402).send({ code: 'SUBSCRIPTION_EXPIRED', message: 'Tu prueba gratis terminó. Elegí un plan para seguir editando.' })
  }
  if (sub.limits.maxPets !== null) {
    const count = await prisma.pet.count({ where: { ownerId: req.user.sub } })
    if (count >= sub.limits.maxPets) {
      return reply.code(402).send({
        code: 'PET_LIMIT',
        message: `Tu plan permite hasta ${sub.limits.maxPets} mascotas. Pasate a Pro para agregar más.`,
      })
    }
  }
}
