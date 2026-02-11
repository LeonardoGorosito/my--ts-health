import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js' 
import { authenticate } from '../hooks/authenticate.js' // <--- Importamos el hook

export default async function petRoutes(app: FastifyInstance) {

  const createPetBody = z.object({
    name: z.string(),
    species: z.enum(['CAT', 'DOG']),
    breed: z.string().optional(),
    gender: z.string().optional(),
    birthDate: z.string().optional(),
    isCastrated: z.boolean().default(false),
    specialNeeds: z.string().optional(),
  })

  const paramsSchema = z.object({ id: z.string() })

  // 1. LISTAR MASCOTAS (GET /pets)
  app.get('/', {
    preHandler: [authenticate] 
  }, async (req) => {
    // Usamos req.user.sub porque en el JWT guardamos el ID ahí
    const pets = await prisma.pet.findMany({
      where: { ownerId: req.user.sub },
      orderBy: { createdAt: 'desc' }
    })
    return pets
  })

  // 2. CREAR MASCOTA (POST /pets)
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const data = createPetBody.parse(req.body)
    
    // Convertir fecha si viene
    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined

    try {
      const pet = await prisma.pet.create({
        data: {
          ...data,
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

  // 3. VER PERFIL COMPLETO (GET /pets/:id) -> ¡ESTE ES EL NUEVO!
  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = paramsSchema.parse(req.params)
    
    const pet = await prisma.pet.findFirst({
      where: { 
        id,
        ownerId: req.user.sub // Seguridad: solo el dueño puede verla
      },
      include: {
        vaccinations: true,
        medicalHistory: {
          orderBy: { date: 'desc' }
        },
        attachments: { 
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!pet) return reply.status(404).send({ message: 'Mascota no encontrada' })

    return pet
  })
}