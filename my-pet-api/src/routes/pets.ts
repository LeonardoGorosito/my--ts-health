import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js' 
import { authenticate } from '../hooks/authenticate.js'
import { requireActive, requirePetSlot } from '../lib/subscription.js'
import cloudinary from '../lib/cloudinary.js'
import { destroyCloudinaryUrl } from '../lib/cloudinary-assets.js'
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
  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const pets = await prisma.pet.findMany({
        where: { ownerId: req.user.sub },
        orderBy: { createdAt: 'desc' },
        include: {
          vaccinations: true,
          dewormings: true
        }
      })
      return reply.send(pets)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al obtener las mascotas' })
    }
  })

  // 2. CREAR (POST /pets)
  app.post('/', { preHandler: [authenticate, requirePetSlot] }, async (req, reply) => {
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
    try {
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
      return reply.send(pet)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al obtener la mascota' })
    }
  })

  // 4. EDITAR (PUT /pets/:id)
  app.put('/:id', { preHandler: [authenticate, requireActive] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    
    const existingPet = await prisma.pet.findUnique({ where: { id, ownerId: req.user.sub } })
    if (!existingPet) {
      const parts = req.parts()
      for await (const part of parts) { await (part as any).toBuffer?.() } 
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
          await (part as any).toBuffer?.() 
        }
      } else {
        if (['isCastrated', 'showPhonePublicly', 'showAddressPublicly'].includes(part.fieldname)) {
          data[part.fieldname] = (part.value === 'true')
        } else {
          data[part.fieldname] = part.value
        }
      }
    }

    try {
      if (data.birthDate) data.birthDate = new Date(data.birthDate)

      const { phone, address, ...petData } = data

      if (phone !== undefined || address !== undefined) {
        await prisma.user.update({
          where: { id: req.user.sub },
          data: {
            ...(phone !== undefined && { phone }),
            ...(address !== undefined && { address })
          }
        })
      }

      const updatedPet = await prisma.pet.update({
        where: { id },
        data: { ...petData }
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

    // Borramos de Cloudinary las fotos y todos los archivos adjuntos de la mascota.
    // (Los registros de la base se borran en cascada con la mascota.)
    const attachments = await prisma.attachment.findMany({ where: { petId: id }, select: { url: true } })
    await Promise.all([
      destroyCloudinaryUrl(pet.profileImageUrl),
      destroyCloudinaryUrl(pet.bannerImageUrl),
      ...attachments.map((a) => destroyCloudinaryUrl(a.url)),
    ])

    await prisma.pet.delete({
      where: { id }
    })

    return reply.send({ message: 'Mascota, imágenes y archivos eliminados correctamente' })
  })

  // =========================================================================
  // 6. PLACA PÚBLICA (GET /pets/public/:id) - ¡SIN AUTH Y ADENTRO DE LA FUNCIÓN!
  // =========================================================================
  app.get('/public/:id', async (req, reply) => {
    try {
      const { id } = req.params as { id: string }

      const pet = await prisma.pet.findUnique({
        where: { id },
        include: {
          owner: { select: { name: true, email: true, phone: true, address: true } }
        }
      })

      if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })

      // Solo devolvemos lo que la placa necesita (nada de ownerId, fechas internas, etc.)
      // El teléfono se muestra si el dueño lo habilitó, o mientras la mascota esté perdida
      // (al activar el modo perdida el dueño acepta mostrarlo: es la forma más rápida de contacto)
      const showPhone = pet.showPhonePublicly || pet.isLost
      return reply.send({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        specialNeeds: pet.specialNeeds,
        profileImageUrl: pet.profileImageUrl,
        bannerImageUrl: pet.bannerImageUrl,
        isLost: pet.isLost,
        lostSince: pet.lostSince,
        lostMessage: pet.lostMessage,
        owner: {
          name: pet.owner.name,
          email: pet.owner.email,
          phone: showPhone ? pet.owner.phone : null,
          address: pet.showAddressPublicly ? pet.owner.address : null
        }
      })
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({ message: 'Error al obtener la mascota pública' })
    }
  })

  // =========================================================================
  // 7. MODO PERDIDA (PUT /pets/:id/lost) - Activa o desactiva el aviso en la placa QR
  // =========================================================================
  const lostSchema = z.object({
    isLost: z.boolean(),
    lostMessage: z.string().trim().max(500, 'Máximo 500 caracteres').optional()
  })

  app.put('/:id/lost', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = lostSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    }
    const { isLost, lostMessage } = parsed.data

    const pet = await prisma.pet.findUnique({ where: { id, ownerId: req.user.sub } })
    if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })

    const updated = await prisma.pet.update({
      where: { id },
      data: isLost
        // Si ya estaba perdida conservamos la fecha original; solo se actualiza el mensaje
        ? { isLost: true, lostSince: pet.lostSince ?? new Date(), lostMessage: lostMessage || null }
        : { isLost: false, lostSince: null, lostMessage: null }
    })
    return reply.send(updated)
  })

} // <--- ESTA ES LA LLAVE QUE CIERRA LA FUNCIÓN PRINCIPAL (petRoutes)