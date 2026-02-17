import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import cloudinary from '../lib/cloudinary.js'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export default async function attachmentRoutes(app: FastifyInstance) {

  // Función auxiliar (igual que en pets.ts)
  const uploadToCloudinary = async (file: any, folder: string) => {
    const tempFilePath = path.join(os.tmpdir(), file.filename)
    await pipeline(file.file, fs.createWriteStream(tempFilePath))
    
    try {
      const result = await cloudinary.uploader.upload(tempFilePath, {
        folder: `pet-health/${folder}`,
        resource_type: 'auto', // Auto para detectar si es PDF, Imagen o Video
      })
      return result
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  }

  // 1. SUBIR ARCHIVO (POST /attachments)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const parts = req.parts()
    let petId = ''
    let uploadedFile: any = null

    // Procesamos el multipart
    for await (const part of parts) {
      if (part.type === 'file') {
        // Subimos el archivo a Cloudinary (carpeta 'files')
        uploadedFile = await uploadToCloudinary(part, 'files')
      } else {
        // Capturamos el petId que viene como texto
        if (part.fieldname === 'petId') {
          petId = part.value as string
        }
      }
    }

    if (!petId || !uploadedFile) {
      return reply.status(400).send({ message: 'Falta el archivo o el ID de la mascota' })
    }

    // Guardamos en la base de datos
    try {
      const attachment = await prisma.attachment.create({
        data: {
          name: uploadedFile.original_filename || 'Archivo sin nombre',
          url: uploadedFile.secure_url,
          type: uploadedFile.format || 'file',
          petId: petId
        }
      })
      return reply.status(201).send(attachment)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al guardar el archivo' })
    }
  })

  // 2. BORRAR ARCHIVO (DELETE /attachments/:id)
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