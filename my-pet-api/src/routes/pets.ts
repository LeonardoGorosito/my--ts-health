import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'

export default async function petRoutes(app: FastifyInstance) {
  // Aplicamos el middleware de autenticación a todas las rutas de este archivo
  app.addHook('preHandler', authenticate)

  // GET /pets -> Solo trae las mascotas del usuario logueado
  app.get('/', async (req: any, reply) => {
    const pets = await prisma.pet.findMany({
      where: { 
        ownerId: req.user.sub // <--- EL SECRETO: Filtra por el ID del token
      },
      orderBy: { createdAt: 'desc' }
    })
    return pets
  })

  // POST /pets -> Crea una mascota ligada al usuario logueado
  app.post('/', async (req: any, reply) => {
    const { name, species, breed, gender, birthDate, isCastrated, specialNeeds } = req.body
    
    const newPet = await prisma.pet.create({
      data: {
        name,
        species,
        breed,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        isCastrated,
        specialNeeds,
        ownerId: req.user.sub // <--- Se liga automáticamente al que creó la sesión
      }
    })
    return newPet
  })
}