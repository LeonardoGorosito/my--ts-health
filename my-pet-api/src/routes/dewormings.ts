import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'

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
      
      const pet = await prisma.pet.findUnique({
        where: { id: data.petId, ownerId: req.user.sub }
      })
      if (!pet) return reply.status(403).send({ message: 'No autorizado' })

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

    if (!record || record.pet.ownerId !== req.user.sub) {
      return reply.status(404).send({ message: 'No encontrado' })
    }

    await prisma.deworming.delete({ where: { id } })
    return reply.send({ message: 'Eliminado correctamente' })
  })
}