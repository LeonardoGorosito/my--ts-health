import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { destroyCloudinaryUrl } from '../lib/cloudinary-assets.js'

export default async function attachmentRoutes(app: FastifyInstance) {

  // La subida de archivos se hace por POST /upload (routes/upload.ts), que verifica dueño y plan.

  // BORRAR ARCHIVO (DELETE /attachments/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Verificar permisos
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { pet: true }
    })

    if (!attachment || attachment.pet.ownerId !== req.user.sub) {
      return reply.status(404).send({ message: 'Archivo no encontrado' })
    }

    // Borrar de Cloudinary
    await destroyCloudinaryUrl(attachment.url)

    // Borrar de la DB
    await prisma.attachment.delete({ where: { id } })

    return reply.send({ message: 'Eliminado' })
  })
}