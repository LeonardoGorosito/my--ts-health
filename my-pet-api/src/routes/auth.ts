import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import crypto from 'crypto' 
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
import { resend, MAIL_FROM } from '../lib/mailer.js'

const registerSchema = z.object({
  name: z.string().min(2),
  lastname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const loginSchema = z.object({ 
    email: z.string().email(), 
    password: z.string().min(4) 
})

export default async function auth(app: FastifyInstance) {
    
    app.post('/register', async (req, reply) => { 
        try {
            const body = registerSchema.parse(req.body)
            const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
            
            if (existingUser) {
                return reply.code(409).send({ message: 'El correo electrónico ya está registrado.' })
            }

            const passwordHash = await bcrypt.hash(body.password, 10) 

            const newUser = await prisma.user.create({
                data: {
                    name: body.name,
                    lastname: body.lastname,
                    email: body.email,
                    passwordHash: passwordHash,
                    role: 'USER', // Usamos USER que sí existe en tu schema
                }
            })

            const token = app.jwt.sign({ sub: newUser.id, role: newUser.role, email: newUser.email })
            return { token }
        } catch (error) {
            return reply.code(400).send({ message: 'Error en el registro' })
        }
    })

    app.post('/login', async (req, reply) => { 
        const body = loginSchema.parse(req.body)
        console.log("🔍 Intentando login para:", body.email) // LOG 1

        const user = await prisma.user.findUnique({ where: { email: body.email } })
        
        if (!user) {
        console.log("❌ Usuario NO encontrado en la DB") // LOG 2
        return reply.code(401).send({ message: 'Credenciales inválidas' })
        }       
        
        console.log("✅ Usuario encontrado, verificando contraseña...") // LOG 3
        const ok = await bcrypt.compare(body.password, user.passwordHash!)        
        
        if (!ok) {
        console.log("❌ Contraseña INCORRECTA") // LOG 4
        return reply.code(401).send({ message: 'Credenciales inválidas' })
        }

        console.log("🚀 Login exitoso para:", user.name)
        const token = app.jwt.sign({ sub: user.id, role: user.role, email: user.email })
        return { token }   
 })

    app.get('/me', { preHandler: [authenticate] }, async (req: any) => { 
        const me = await prisma.user.findUnique({ 
            where: { id: req.user.sub }, 
            select: { id: true, email: true, name: true, role: true } 
        })
        return me
    })
}