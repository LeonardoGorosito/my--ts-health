import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { guardPet } from '../lib/access.js'

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

export default async function treatmentRoutes(app: FastifyInstance) {
  // 1. AGREGAR (POST /treatments)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = treatmentSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })

    if (!(await guardPet(reply, parsed.data.petId, req.user.sub, { requirePlan: true }))) return

    const treatment = await prisma.treatment.create({ data: { ...toData(parsed.data), petId: parsed.data.petId } })
    return reply.status(201).send(treatment)
  })

  // 2. EDITAR (PUT /treatments/:id) — también sirve para "finalizar hoy" (endDate = hoy)
  app.put('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await prisma.treatment.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'No encontrado' })
    if (!(await guardPet(reply, existing.petId, req.user.sub, { requirePlan: true }))) return

    const parsed = treatmentSchema.safeParse({ ...(req.body as object), petId: existing.petId })
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })

    const treatment = await prisma.treatment.update({ where: { id }, data: toData(parsed.data) })
    return reply.send(treatment)
  })

  // 3. BORRAR (DELETE /treatments/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await prisma.treatment.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'No encontrado' })
    if (!(await guardPet(reply, existing.petId, req.user.sub))) return
    await prisma.treatment.delete({ where: { id } })
    return reply.send({ message: 'Tratamiento eliminado' })
  })
}
