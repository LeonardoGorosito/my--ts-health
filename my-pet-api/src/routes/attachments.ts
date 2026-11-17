import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import cloudinary from '../lib/cloudinary.js'

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
    if (attachment.url) {
      try {
         // Lógica para extraer el Public ID de la URL
         const parts = attachment.url.split('/')
         const filename = parts.pop()?.split('.')[0]
         const folder = parts.pop()
         const parentFolder = parts.pop()
         
         if (filename && folder) {
             const publicId = parentFolder 
                ? `${parentFolder}/${folder}/${filename}` // ej: pet-health/files/archivo
                : `${folder}/${filename}`
             
             // Intentamos borrar (probamos como imagen y como raw/pdf)
             await cloudinary.uploader.destroy(publicId)
             await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
         }
      } catch (e) {
        console.error('Error borrando de Cloudinary', e)
      }
    }

    // Borrar de la DB
    await prisma.attachment.delete({ where: { id } })

    return reply.send({ message: 'Eliminado' })
  })
}