import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { requireActive } from '../lib/subscription.js'

// ==========================================================
// HISTORIAL DE PESO (/weights)
// Cada alta, edición o baja actualiza Pet.weight con el registro más reciente,
// que es el "peso actual" que muestra el perfil.
// ==========================================================

const weightSchema = z.object({
  weightKg: z.number().positive('El peso tiene que ser mayor a 0').max(150, 'Revisá el peso: máximo 150 kg'),
  date: z.string().min(1, 'Falta la fecha'),
  note: z.string().trim().max(120).optional(),
  petId: z.string(),
})

// Peso con hasta 2 decimales, sin ceros de más ("4.5", no "4.50")
const formatKg = (kg: number) => String(Math.round(kg * 100) / 100)

async function syncCurrentWeight(petId: string) {
  const latest = await prisma.weightRecord.findFirst({
    where: { petId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  // Sin registros dejamos el peso que la mascota ya tenía cargado a mano
  if (latest) await prisma.pet.update({ where: { id: petId }, data: { weight: formatKg(latest.weightKg) } })
}

export default async function weightRoutes(app: FastifyInstance) {
  // 1. REGISTRAR PESO (POST /weights)
  app.post('/', { preHandler: [authenticate, requireActive] }, async (req, reply) => {
    const parsed = weightSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    const data = parsed.data

    const pet = await prisma.pet.findUnique({ where: { id: data.petId, ownerId: req.user.sub } })
    if (!pet) return reply.status(403).send({ message: 'No autorizado' })

    const record = await prisma.weightRecord.create({
      data: { weightKg: data.weightKg, date: new Date(data.date), note: data.note || null, petId: data.petId },
    })
    await syncCurrentWeight(data.petId)
    return reply.status(201).send(record)
  })

  // 2. EDITAR (PUT /weights/:id)
  app.put('/:id', { preHandler: [authenticate, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = weightSchema.omit({ petId: true }).safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    const data = parsed.data

    const existing = await prisma.weightRecord.findUnique({ where: { id }, include: { pet: true } })
    if (!existing || existing.pet.ownerId !== req.user.sub) return reply.status(404).send({ message: 'No encontrado' })

    const record = await prisma.weightRecord.update({
      where: { id },
      data: { weightKg: data.weightKg, date: new Date(data.date), note: data.note || null },
    })
    await syncCurrentWeight(existing.petId)
    return reply.send(record)
  })

  // 3. BORRAR (DELETE /weights/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await prisma.weightRecord.findUnique({ where: { id }, include: { pet: true } })
    if (!existing || existing.pet.ownerId !== req.user.sub) return reply.status(404).send({ message: 'No encontrado' })

    await prisma.weightRecord.delete({ where: { id } })
    await syncCurrentWeight(existing.petId)
    return reply.send({ message: 'Registro eliminado' })
  })
}
