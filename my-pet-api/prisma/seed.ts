import { PrismaClient, Species } from '@prisma/client'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'leogorosito.lg@gmail.com' // Cambialo por tu mail real si querés

  // La contraseña sale del entorno: la base es compartida con producción y no queremos un ADMIN con clave fija.
  // Uso: SEED_ADMIN_PASSWORD='algo-seguro' npm run seed
  const plainPassword = process.env.SEED_ADMIN_PASSWORD
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error('Definí SEED_ADMIN_PASSWORD (mínimo 8 caracteres) para correr el seed')
  }
  const pass = await bcrypt.hash(plainPassword, 10)

  // 1. Creamos tu usuario (el dueño)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    // Si ya existe, solo nos aseguramos de que pueda loguearse (verificado). No pisamos su contraseña.
    update: { isVerified: true },
    create: { 
      email: adminEmail, 
      passwordHash: pass, 
      name: 'Leo', 
      lastname: 'Dev', 
      role: 'ADMIN',
      isVerified: true
    }
  })

  console.log('✅ Usuario administrador creado')

  // 2. Creamos un par de mascotas de prueba para ver el dashboard (solo si todavía no tiene ninguna,
  //    así correr el seed dos veces no duplica mascotas)
  const existingPets = await prisma.pet.count({ where: { ownerId: user.id } })
  if (existingPets > 0) {
    console.log('🐾 El usuario ya tiene mascotas, no se crean nuevas')
    return
  }

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