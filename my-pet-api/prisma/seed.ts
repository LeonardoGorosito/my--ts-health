import { PrismaClient, Species } from '@prisma/client'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'leogorosito.lg@gmail.com' // Cambialo por tu mail real si querés
  const pass = await bcrypt.hash('1234', 10)

  // 1. Creamos tu usuario (el dueño)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { 
      email: adminEmail, 
      passwordHash: pass, 
      name: 'Leo', 
      lastname: 'Dev', 
      role: 'ADMIN' 
    }
  })

  console.log('✅ Usuario administrador creado')

  // 2. Creamos un par de mascotas de prueba para ver el dashboard
  // Podés agregar a tu gatita ciega acá para probar los campos especiales
  await prisma.pet.create({
    data: {
      name: 'Mochi',
      species: Species.CAT,
      breed: 'Común europeo',
      gender: 'Hembra',
      isCastrated: true,
      specialNeeds: 'Baja visión / Ciega',
      ownerId: user.id
    }
  })

  await prisma.pet.create({
    data: {
      name: 'Rocco',
      species: Species.DOG,
      breed: 'Labrador',
      gender: 'Macho',
      isCastrated: true,
      ownerId: user.id
    }
  })

  console.log('🐾 Mascotas iniciales creadas')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })