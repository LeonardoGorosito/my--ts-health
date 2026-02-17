import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'

export default async function vaccineRoutes(app: FastifyInstance) {
  
  const vaccineSchema = z.object({
    name: z.string().min(2, 'Nombre requerido'),
    date: z.string(), // El frontend envía "date"
    nextDueDate: z.string().optional(),
    petId: z.string()
  })

  // 1. AGREGAR VACUNA (POST /vaccines)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const data = vaccineSchema.parse(req.body)
      
      const pet = await prisma.pet.findUnique({
        where: { id: data.petId, ownerId: req.user.sub }
      })
      if (!pet) return reply.status(403).send({ message: 'No autorizado' })

      // CORRECCIÓN AQUÍ: Usamos 'dateApplied' que es lo que pide tu base de datos
      const vaccine = await prisma.vaccination.create({
        data: {
          name: data.name,
          dateApplied: new Date(data.date), // <--- CAMBIO CLAVE
          nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
          petId: data.petId
        }
      })

      return reply.status(201).send(vaccine)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al guardar vacuna' })
    }
  })

  // 2. BORRAR VACUNA (DELETE /vaccines/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const vaccine = await prisma.vaccination.findUnique({
      where: { id },
      include: { pet: true }
    })

    if (!vaccine || vaccine.pet.ownerId !== req.user.sub) {
      return reply.status(404).send({ message: 'No encontrado' })
    }

    await prisma.vaccination.delete({ where: { id } })
    return reply.send({ message: 'Vacuna eliminada' })
  })
}