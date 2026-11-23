import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { guardPet } from '../lib/access.js'
import { sameDate } from '../lib/dates.js'

export default async function dewormingRoutes(app: FastifyInstance) {
  
  const dewormingSchema = z.object({
    name: z.string().min(2, 'Nombre requerido'),
    date: z.string(), 
    nextDueDate: z.string().optional(),
    type: z.enum(['INTERNA', 'EXTERNA']), // Validamos que sea uno de estos dos
    petId: z.string()
  })

  // 1. AGREGAR (POST /dewormings)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const data = dewormingSchema.parse(req.body)
      
      if (!(await guardPet(reply, data.petId, req.user.sub, { requirePlan: true }))) return

      const deworming = await prisma.deworming.create({
        data: {
          name: data.name,
          dateApplied: new Date(data.date),
          nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
          type: data.type,
          petId: data.petId
        }
      })

      return reply.status(201).send(deworming)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al guardar' })
    }
  })

  // 2. BORRAR (DELETE /dewormings/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const record = await prisma.deworming.findUnique({
      where: { id },
      include: { pet: true }
    })

    if (!record) return reply.status(404).send({ message: 'No encontrado' })
    if (!(await guardPet(reply, record.petId, req.user.sub))) return

    await prisma.deworming.delete({ where: { id } })
    return reply.send({ message: 'Eliminado correctamente' })
  })

  // EDITAR (PUT /:id) — mismo esquema que el alta, sin petId
  app.put('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = dewormingSchema.omit({ petId: true }).safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    }
    const data = parsed.data

    const existing = await prisma.deworming.findUnique({ where: { id }, include: { pet: true } })
    if (!existing) return reply.status(404).send({ message: 'No encontrado' })
    if (!(await guardPet(reply, existing.petId, req.user.sub, { requirePlan: true }))) return

    const updated = await prisma.deworming.update({
      where: { id },
      data: {
        name: data.name,
        dateApplied: new Date(data.date),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        type: data.type,
        // Si cambió la próxima dosis, el recordatorio vuelve a quedar pendiente
        ...(sameDate(existing.nextDueDate, data.nextDueDate) ? {} : { reminderSentAt: null })
      }
    })
    return reply.send(updated)
  })
}