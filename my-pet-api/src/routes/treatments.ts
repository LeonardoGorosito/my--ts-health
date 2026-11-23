import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { requireActive } from '../lib/subscription.js'

// ==========================================================
// MEDICACIÓN Y TRATAMIENTOS (/treatments)
// endDate vacío = tratamiento continuo (sin fecha de fin)
// ==========================================================

const treatmentSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá el nombre del medicamento').max(80),
    dose: z.string().trim().max(60).optional(),
    frequencyHours: z.number().int().min(1, 'Frecuencia inválida').max(24 * 31, 'Frecuencia inválida'),
    startDate: z.string().min(1, 'Falta la fecha de inicio'),
    endDate: z.string().optional(), // vacío = continuo
    notes: z.string().trim().max(200).optional(),
    petId: z.string(),
  })
  .refine((d) => !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: 'La fecha de fin no puede ser anterior al inicio',
    path: ['endDate'],
  })

const toData = (d: z.infer<typeof treatmentSchema>) => ({
  name: d.name,
  dose: d.dose || null,
  frequencyHours: d.frequencyHours,
  startDate: new Date(d.startDate),
  endDate: d.endDate ? new Date(d.endDate) : null,
  notes: d.notes || null,
})

async function findOwned(id: string, userId: string) {
  const t = await prisma.treatment.findUnique({ where: { id }, include: { pet: true } })
  return t && t.pet.ownerId === userId ? t : null
}

export default async function treatmentRoutes(app: FastifyInstance) {
  // 1. AGREGAR (POST /treatments)
  app.post('/', { preHandler: [authenticate, requireActive] }, async (req, reply) => {
    const parsed = treatmentSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })

    const pet = await prisma.pet.findUnique({ where: { id: parsed.data.petId, ownerId: req.user.sub } })
    if (!pet) return reply.status(403).send({ message: 'No autorizado' })

    const treatment = await prisma.treatment.create({ data: { ...toData(parsed.data), petId: pet.id } })
    return reply.status(201).send(treatment)
  })

  // 2. EDITAR (PUT /treatments/:id) — también sirve para "finalizar hoy" (endDate = hoy)
  app.put('/:id', { preHandler: [authenticate, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await findOwned(id, req.user.sub)
    if (!existing) return reply.status(404).send({ message: 'No encontrado' })

    const parsed = treatmentSchema.safeParse({ ...(req.body as object), petId: existing.petId })
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })

    const treatment = await prisma.treatment.update({ where: { id }, data: toData(parsed.data) })
    return reply.send(treatment)
  })

  // 3. BORRAR (DELETE /treatments/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!(await findOwned(id, req.user.sub))) return reply.status(404).send({ message: 'No encontrado' })
    await prisma.treatment.delete({ where: { id } })
    return reply.send({ message: 'Tratamiento eliminado' })
  })
}
