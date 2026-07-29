import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js' 

export default async function publicRoutes(app: FastifyInstance) {
  app.get('/pets/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: {
        vaccinations: true,
        dewormings: true,
        medicalHistory: {
          orderBy: { date: 'desc' }
        },
        owner: {
          select: {
            name: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!pet) {
      return reply.status(404).send({ message: 'Mascota no encontrada' })
    }

    const { owner, ...petData } = pet
    const publicOwner = {
      name: owner.name,
      ...(petData.showPhonePublicly ? { phone: owner.phone } : {}),
      ...(petData.showAddressPublicly ? { address: owner.address } : {})
    }

    return {
      ...petData,
      owner: publicOwner
    }
  })
}
