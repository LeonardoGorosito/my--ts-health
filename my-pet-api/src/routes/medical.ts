import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'

export default async function medicalRoutes(app: FastifyInstance) {
  
  // Esquema para validar datos
  const medicalRecordSchema = z.object({
    title: z.string().min(3, 'El título es muy corto'),
    description: z.string().min(3, 'La descripción es obligatoria'),
    date: z.string().optional(), // Fecha del evento (puede ser pasada)
    petId: z.string()
  })

  // 1. AGREGAR REGISTRO MÉDICO (POST /medical)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const data = medicalRecordSchema.parse(req.body)
      
      // Verificar que la mascota sea del usuario
      const pet = await prisma.pet.findUnique({
        where: { id: data.petId, ownerId: req.user.sub }
      })

      if (!pet) return reply.status(403).send({ message: 'No tienes permiso sobre esta mascota' })

      const record = await prisma.medicalRecord.create({
        data: {
          title: data.title,
          description: data.description,
          date: data.date ? new Date(data.date) : new Date(),
          petId: data.petId
        }
      })

      return reply.status(201).send(record)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al guardar el registro' })
    }
  })

  // 2. BORRAR REGISTRO (DELETE /medical/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Verificar que el registro pertenezca a una mascota del usuario
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: { pet: true }
    })

    if (!record || record.pet.ownerId !== req.user.sub) {
      return reply.status(404).send({ message: 'Registro no encontrado o sin permiso' })
    }

    await prisma.medicalRecord.delete({ where: { id } })
    return reply.send({ message: 'Registro eliminado' })
  })
}