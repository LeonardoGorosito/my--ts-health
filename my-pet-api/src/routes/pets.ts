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
  // AHORA se llama DENTRO del bucle para no bloquear el stream
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
      // Siempre borramos el archivo temporal, incluso si falla
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  }

  // 1. LISTAR (GET /pets)
  app.get('/', { preHandler: [authenticate] }, async (req) => {
    return await prisma.pet.findMany({
      where: { ownerId: req.user.sub },
      orderBy: { createdAt: 'desc' }
    })
  })

  // 2. CREAR (POST /pets)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const parts = req.parts()
    const data: any = {}
    
    // Usamos un ID temporal para el nombre de la imagen porque aun no existe la mascota
    const tempId = req.user.sub.slice(0, 8)

    // IMPORTANTE: Procesamos los archivos DENTRO del loop
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'profileImage') {
          // Subimos inmediatamente (await) para liberar el stream
          data.profileImageUrl = await uploadToCloudinary(part, 'profiles', tempId)
        } else if (part.fieldname === 'bannerImage') {
          data.bannerImageUrl = await uploadToCloudinary(part, 'banners', tempId)
        } else {
          await part.toBuffer() // Consumir y descartar otros archivos
        }
      } else {
        // Campos de texto
        data[part.fieldname] = part.value
      }
    }

    // Convertir booleanos y fechas
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
        // AGREGAR ESTA LÍNEA:
        dewormings: { orderBy: { dateApplied: 'desc' } } 
      }
    })

    if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })
    return pet
  })

  // 4. EDITAR (PUT /pets/:id) - AQUÍ ESTABA EL PROBLEMA
  app.put('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    
    // Verificar primero que la mascota exista y sea del usuario
    const existingPet = await prisma.pet.findUnique({ where: { id, ownerId: req.user.sub } })
    if (!existingPet) {
      // Si no existe, tenemos que consumir el multipart igual para no dejar colgado el request
      const parts = req.parts()
      for await (const part of parts) { await part.toBuffer() } 
      return reply.status(404).send({ message: 'Mascota no encontrada' })
    }

    const parts = req.parts()
    const data: any = {}

    // Procesamos el stream
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'profileImage') {
          // ¡AWAIT AQUÍ! Subimos la imagen ya mismo
          data.profileImageUrl = await uploadToCloudinary(part, 'profiles', id)
        } else if (part.fieldname === 'bannerImage') {
          data.bannerImageUrl = await uploadToCloudinary(part, 'banners', id)
        } else {
          await part.toBuffer() // Descartar basura
        }
      } else {
        // Campos de texto
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

  // 5. ELIMINAR (DELETE /pets/:id) - CON LIMPIEZA DE CLOUDINARY
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // 1. Primero buscamos la mascota para tener las URLs de las imágenes
    const pet = await prisma.pet.findFirst({
      where: { id, ownerId: req.user.sub }
    })

    if (!pet) {
      return reply.status(404).send({ message: 'No se pudo eliminar (no encontrada o sin permisos)' })
    }

    // 2. Función auxiliar para extraer el Public ID de Cloudinary y borrar
    const deleteImageFromCloudinary = async (url: string) => {
      try {
        // La URL es tipo: https://res.cloudinary.com/.../pet-health/profiles/abcd.jpg
        // Necesitamos el Public ID: "pet-health/profiles/abcd"
        
        // Dividimos la URL por las barras "/"
        const parts = url.split('/')
        // Agarramos el nombre del archivo (ej: abcd.jpg)
        const filenameWithExt = parts.pop() 
        // Agarramos la carpeta (ej: profiles)
        const folder = parts.pop() 
        // Agarramos la carpeta padre (ej: pet-health)
        const parentFolder = parts.pop()

        if (filenameWithExt && folder && parentFolder) {
            // Le sacamos la extensión (.jpg, .png) al nombre
            const filename = filenameWithExt.split('.')[0]
            const publicId = `${parentFolder}/${folder}/${filename}`
            
            // Llamamos a la API de Cloudinary para destruir la imagen
            await cloudinary.uploader.destroy(publicId)
        }
      } catch (error) {
        console.error('Error borrando imagen de Cloudinary:', error)
        // No frenamos el proceso si falla esto, seguimos borrando la mascota
      }
    }

    // 3. Ejecutamos el borrado de imágenes si existen
    if (pet.profileImageUrl) {
        await deleteImageFromCloudinary(pet.profileImageUrl)
    }
    if (pet.bannerImageUrl) {
        await deleteImageFromCloudinary(pet.bannerImageUrl)
    }

    // 4. Finalmente borramos la mascota de la Base de Datos
    await prisma.pet.delete({
      where: { id }
    })

    return reply.send({ message: 'Mascota y sus imágenes eliminadas correctamenonte' })
  })
}