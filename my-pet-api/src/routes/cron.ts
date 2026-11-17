import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { ENV } from '../env.js'
import { resend, MAIL_FROM, isDev } from '../lib/mailer.js'
import { computeTier, limitsFor, subscriptionSelect } from '../lib/subscription.js'

// ==========================================================
// RECORDATORIOS DE VENCIMIENTOS (GET /cron/reminders)
// Lo llama el Cron de Vercel una vez por día (ver vercel.json).
// Manda UN email por usuario con las vacunas/desparasitaciones que vencen
// en los próximos días y marca cada una como avisada (reminderSentAt).
// ==========================================================

const DAYS_AHEAD = 7    // avisar lo que vence en los próximos 7 días
const DAYS_BEHIND = 30  // y lo vencido hace poco que nunca se avisó (evita mandar historial viejo)
const DAY_MS = 24 * 60 * 60 * 1000

type Item = {
  kind: 'vaccine' | 'deworming'
  id: string
  name: string
  nextDueDate: Date
  pet: { id: string; name: string; ownerId: string }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// FRONTEND_URL puede traer varias URLs separadas por coma: usamos la primera para los links
const appUrl = ENV.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '')

const describeDue = (date: Date, now: Date) => {
  const days = Math.ceil((date.getTime() - now.getTime()) / DAY_MS)
  if (days < 0) return `venció hace ${-days} día${days === -1 ? '' : 's'}`
  if (days === 0) return 'vence hoy'
  if (days === 1) return 'vence mañana'
  return `vence en ${days} días`
}

const buildEmail = (userName: string, items: Item[], now: Date) => {
  const rows = items
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
    .map((i) => {
      const label = i.kind === 'vaccine' ? 'Vacuna' : 'Desparasitación'
      const date = i.nextDueDate.toLocaleDateString('es-AR', { timeZone: 'UTC' })
      return `<li style="margin-bottom:8px">
        <strong>${escapeHtml(i.pet.name)}</strong>: ${label} <em>${escapeHtml(i.name)}</em>
        — ${describeDue(i.nextDueDate, now)} (${date}).
        <a href="${appUrl}/app/pets/${i.pet.id}">Ver ficha</a>
      </li>`
    })
    .join('')

  return {
    subject: items.length === 1
      ? `Recordatorio: ${items[0].pet.name} tiene una dosis próxima`
      : `Recordatorio: ${items.length} dosis próximas de tus mascotas`,
    html: `<h2>¡Hola ${escapeHtml(userName)}!</h2>
      <p>Estas son las próximas dosis de tus mascotas:</p>
      <ul>${rows}</ul>
      <p style="color:#888;font-size:12px">Podés desactivar estos recordatorios en Configuración: ${appUrl}/configuracion</p>`,
  }
}

export default async function cronRoutes(app: FastifyInstance) {
  app.get('/cron/reminders', async (req, reply) => {
    // Vercel Cron manda "Authorization: Bearer <CRON_SECRET>". Sin secreto configurado, no se ejecuta.
    const secret = process.env.CRON_SECRET
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      return reply.code(401).send({ message: 'No autorizado' })
    }

    const now = new Date()
    const where = {
      reminderSentAt: null,
      nextDueDate: { gte: new Date(now.getTime() - DAYS_BEHIND * DAY_MS), lte: new Date(now.getTime() + DAYS_AHEAD * DAY_MS) },
      pet: { owner: { isVerified: true, emailReminders: true } },
    }
    const petSelect = { select: { id: true, name: true, ownerId: true } }

    const [vaccines, dewormings] = await Promise.all([
      prisma.vaccination.findMany({ where, select: { id: true, name: true, nextDueDate: true, pet: petSelect } }),
      prisma.deworming.findMany({ where, select: { id: true, name: true, nextDueDate: true, pet: petSelect } }),
    ])

    // Agrupamos por dueño
    const byOwner = new Map<string, Item[]>()
    const push = (kind: Item['kind']) => (r: { id: string; name: string; nextDueDate: Date | null; pet: Item['pet'] }) => {
      if (!r.nextDueDate) return
      const list = byOwner.get(r.pet.ownerId) ?? []
      list.push({ kind, id: r.id, name: r.name, nextDueDate: r.nextDueDate, pet: r.pet })
      byOwner.set(r.pet.ownerId, list)
    }
    vaccines.forEach(push('vaccine'))
    dewormings.forEach(push('deworming'))

    // Los recordatorios son de Pro (y de la prueba gratis): filtramos por plan vigente
    const owners = (await prisma.user.findMany({
      where: { id: { in: [...byOwner.keys()] } },
      select: { id: true, name: true, email: true, ...subscriptionSelect },
    })).filter((o) => limitsFor(computeTier(o, now)).reminders)

    let sent = 0
    let failed = 0
    for (const owner of owners) {
      const items = byOwner.get(owner.id)!
      const { subject, html } = buildEmail(owner.name, items, now)

      if (isDev) {
        console.log(`\n📬 [DEV] Recordatorio para ${owner.email} — ${subject}`)
        items.forEach((i) => console.log(`   • ${i.pet.name}: ${i.name} (${describeDue(i.nextDueDate, now)})`))
      }

      const { error } = await resend.emails.send({ from: MAIL_FROM, to: owner.email, subject, html })
      if (error) {
        // No lo marcamos como avisado: se reintenta en la próxima corrida
        failed++
        req.log.warn({ owner: owner.id, error: error.message }, 'No se pudo enviar el recordatorio')
        continue
      }

      const ids = (kind: Item['kind']) => items.filter((i) => i.kind === kind).map((i) => i.id)
      await Promise.all([
        prisma.vaccination.updateMany({ where: { id: { in: ids('vaccine') } }, data: { reminderSentAt: now } }),
        prisma.deworming.updateMany({ where: { id: { in: ids('deworming') } }, data: { reminderSentAt: now } }),
      ])
      sent++
    }

    return { users: owners.length, sent, failed }
  })
}
