import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js' 
import { authenticate } from '../hooks/authenticate.js'
import cloudinary from '../lib/cloudinary.js'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export default async function petRoutes(app: FastifyInstance) {

  // Función auxiliar para subir a Cloudinary
  const uploadToCloudinary = async (file: any, folder: string, idPrefix: string) => {
    const tempFilePath = path.join(os.tmpdir(), file.filename)
    await pipeline(file.file, fs.createWriteStream(tempFilePath))
    
    try {
      const result = await cloudinary.uploader.upload(tempFilePath, {
        folder: `pet-health/${folder}`,
        public_id: `${idPrefix}_${Date.now()}`,
        overwrite: true,
      })
      return result.secure_url
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  }

  // 1. LISTAR (GET /pets)
  app.get('/', { preHandler: [authenticate] }, async (req) => {
    return await prisma.pet.findMany({
      where: { ownerId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        vaccinations: true,
        dewormings: true
      }
    })
  })

  // 2. CREAR (POST /pets)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const parts = req.parts()
    const data: any = {}
    
    const tempId = req.user.sub.slice(0, 8)

    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'profileImage') {
          data.profileImageUrl = await uploadToCloudinary(part, 'profiles', tempId)
        } else if (part.fieldname === 'bannerImage') {
          data.bannerImageUrl = await uploadToCloudinary(part, 'banners', tempId)
        } else {
          await part.toBuffer() 
        }
      } else {
        data[part.fieldname] = part.value
      }
    }

    const isCastrated = data.isCastrated === 'true'
    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined

    try {
      const pet = await prisma.pet.create({
        data: {
          name: data.name,
          species: data.species,
          breed: data.breed,
          gender: data.gender,
          weight: data.weight,
          isCastrated: isCastrated,
          specialNeeds: data.specialNeeds,
          profileImageUrl: data.profileImageUrl,
          bannerImageUrl: data.bannerImageUrl,
          birthDate,
          ownerId: req.user.sub
        }
      })
      return reply.status(201).send(pet)
    } catch (e) {
      req.log.error(e)
      return reply.status(500).send({ message: 'Error al crear la mascota' })
    }
  })

  // 3. VER PERFIL (GET /pets/:id)
  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    
    const pet = await prisma.pet.findFirst({
      where: { id, ownerId: req.user.sub },
      include: {
        vaccinations: true,
        medicalHistory: { orderBy: { date: 'desc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        dewormings: { orderBy: { dateApplied: 'desc' } } 
      }
    })

    if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })
    return pet
  })

  // 4. EDITAR (PUT /pets/:id)
  app.put('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    
    const existingPet = await prisma.pet.findUnique({ where: { id, ownerId: req.user.sub } })
    if (!existingPet) {
      const parts = req.parts()
      for await (const part of parts) { await part.toBuffer() } 
      return reply.status(404).send({ message: 'Mascota no encontrada' })
    }

    const parts = req.parts()
    const data: any = {}

    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'profileImage') {
          data.profileImageUrl = await uploadToCloudinary(part, 'profiles', id)
        } else if (part.fieldname === 'bannerImage') {
          data.bannerImageUrl = await uploadToCloudinary(part, 'banners', id)
        } else {
          await part.toBuffer() 
        }
      } else {
        if (part.fieldname === 'isCastrated') data[part.fieldname] = (part.value === 'true')
        else data[part.fieldname] = part.value
      }
    }

    try {
      if (data.birthDate) data.birthDate = new Date(data.birthDate)

      const updatedPet = await prisma.pet.update({
        where: { id },
        data: { ...data }
      })
      return reply.send(updatedPet)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al actualizar la mascota' })
    }
  })

  // 5. ELIMINAR (DELETE /pets/:id)
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const pet = await prisma.pet.findFirst({
      where: { id, ownerId: req.user.sub }
    })

    if (!pet) {
      return reply.status(404).send({ message: 'No se pudo eliminar (no encontrada o sin permisos)' })
    }

    const deleteImageFromCloudinary = async (url: string) => {
      try {
        const parts = url.split('/')
        const filenameWithExt = parts.pop() 
        const folder = parts.pop() 
        const parentFolder = parts.pop()

        if (filenameWithExt && folder && parentFolder) {
            const filename = filenameWithExt.split('.')[0]
            const publicId = `${parentFolder}/${folder}/${filename}`
            await cloudinary.uploader.destroy(publicId)
        }
      } catch (error) {
        console.error('Error borrando imagen de Cloudinary:', error)
      }
    }

    if (pet.profileImageUrl) {
        await deleteImageFromCloudinary(pet.profileImageUrl)
    }
    if (pet.bannerImageUrl) {
        await deleteImageFromCloudinary(pet.bannerImageUrl)
    }

    await prisma.pet.delete({
      where: { id }
    })

    return reply.send({ message: 'Mascota y sus imágenes eliminadas correctamente' })
  })

  // =========================================================================
  // 6. PLACA PÚBLICA (GET /pets/public/:id) - ¡SIN AUTH Y ADENTRO DE LA FUNCIÓN!
  // =========================================================================
  app.get('/public/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })
    return pet
  })

} // <--- ESTA ES LA LLAVE QUE CIERRA LA FUNCIÓN PRINCIPAL (petRoutes)