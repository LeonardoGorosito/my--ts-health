import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { guardPet } from '../lib/access.js'

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
      
      // Verificar acceso a la mascota (dueño o familiar) y plan del dueño
      if (!(await guardPet(reply, data.petId, req.user.sub, { requirePlan: true }))) return

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

    if (!record) return reply.status(404).send({ message: 'Registro no encontrado' })
    if (!(await guardPet(reply, record.petId, req.user.sub))) return

    await prisma.medicalRecord.delete({ where: { id } })
    return reply.send({ message: 'Registro eliminado' })
  })

  // EDITAR (PUT /:id) — mismo esquema que el alta, sin petId
  app.put('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = medicalRecordSchema.omit({ petId: true }).safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    }
    const data = parsed.data

    const existing = await prisma.medicalRecord.findUnique({ where: { id }, include: { pet: true } })
    if (!existing) return reply.status(404).send({ message: 'No encontrado' })
    if (!(await guardPet(reply, existing.petId, req.user.sub, { requirePlan: true }))) return

    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        ...(data.date ? { date: new Date(data.date) } : {})
      }
    })
    return reply.send(updated)
  })
}