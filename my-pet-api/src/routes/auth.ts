import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
// IMPORTANTE: Asegurate de tener tu resend configurado en este archivo
import { resend, MAIL_FROM } from '../lib/mailer.js'

// --- HELPER PARA CÓDIGOS DE 6 DÍGITOS ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// --- ESQUEMAS ---
const registerSchema = z.object({
  name: z.string().min(2),
  lastname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
})

const loginSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(4) 
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6)
})

export default async function auth(app: FastifyInstance) {
    
    // ==========================================================
    // 1. REGISTRO (Crea cuenta inactiva y envía código)
    // ==========================================================
    app.post('/register', async (req, reply) => { 
        try {
            const body = registerSchema.parse(req.body)
            const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
            
            if (existingUser) {
                // Si existe pero no está verificado, le reenviamos el código
                if (!existingUser.isVerified) {
                    const otp = generateOTP()
                    await prisma.user.update({
                        where: { email: body.email },
                        data: {
                            verificationCode: otp,
                            verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
                        }
                    })
                    await resend.emails.send({
                        from: MAIL_FROM,
                        to: body.email,
                        subject: 'Verifica tu cuenta en Pet Health',
                        html: `<p>Tu código de verificación es: <strong>${otp}</strong></p>`
                    })
                    return reply.send({ message: 'Usuario ya existía sin verificar. Se reenvió el código.' })
                }
                return reply.code(409).send({ message: 'El correo electrónico ya está registrado y verificado.' })
            }

            const passwordHash = await bcrypt.hash(body.password, 10) 
            const otp = generateOTP()

            await prisma.user.create({
                data: {
                    name: body.name,
                    lastname: body.lastname,
                    email: body.email,
                    passwordHash: passwordHash,
                    phone: body.phone,
                    role: 'USER',
                    isVerified: false,
                    verificationCode: otp,
                    verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
                }
            })

            await resend.emails.send({
                from: MAIL_FROM,
                to: body.email,
                subject: '¡Bienvenido a Pet Health! Verifica tu cuenta',
                html: `<h1>¡Hola ${body.name}!</h1><p>Tu código de verificación es: <strong style="font-size:24px;">${otp}</strong></p><p>Este código expira en 15 minutos.</p>`
            })

            return reply.send({ message: 'Cuenta creada. Revisa tu email para verificarla.' })
        } catch (error) {
            console.error(error)
            return reply.code(400).send({ message: 'Error en el registro' })
        }
    })

    // ==========================================================
    // 2. VERIFICAR EMAIL (Recibe el código y activa la cuenta)
    // ==========================================================
    app.post('/verify-email', async (req, reply) => {
        try {
            const body = verifySchema.parse(req.body)
            const user = await prisma.user.findUnique({ where: { email: body.email } })

            if (!user) return reply.code(404).send({ message: 'Usuario no encontrado' })
            if (user.isVerified) return reply.code(400).send({ message: 'El usuario ya está verificado' })
            
            if (user.verificationCode !== body.code) {
                return reply.code(401).send({ message: 'Código incorrecto' })
            }
            if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
                return reply.code(401).send({ message: 'El código expiró. Pide uno nuevo.' })
            }

            // Marcamos como verificado y borramos el código
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true, verificationCode: null, verificationCodeExpiry: null }
            })

            // Lo logueamos automáticamente
            const token = app.jwt.sign({ sub: updatedUser.id, role: updatedUser.role, email: updatedUser.email })
            return { token, message: 'Cuenta verificada exitosamente' }

        } catch (error) {
            return reply.code(400).send({ message: 'Error en la verificación' })
        }
    })

    // ==========================================================
    // 3. LOGIN (Solo deja entrar si isVerified es true)
    // ==========================================================
    app.post('/login', async (req, reply) => { 
        const body = loginSchema.parse(req.body)
        const user = await prisma.user.findUnique({ where: { email: body.email } })
        
        if (!user || !user.passwordHash) {
            return reply.code(401).send({ message: 'Credenciales inválidas' })
        }       
        
        if (!user.isVerified) {
            return reply.code(403).send({ message: 'PENDING_VERIFICATION', email: user.email })
        }

        const ok = await bcrypt.compare(body.password, user.passwordHash)        
        if (!ok) return reply.code(401).send({ message: 'Credenciales inválidas' })

        const token = app.jwt.sign({ sub: user.id, role: user.role, email: user.email })
        return { token }   
    })

    // ==========================================================
    // 4. FORGOT PASSWORD (Genera código de recuperación)
    // ==========================================================
    app.post('/forgot-password', async (req, reply) => {
        try {
            const body = forgotPasswordSchema.parse(req.body)
            const user = await prisma.user.findUnique({ where: { email: body.email } })

            if (!user) {
                // Por seguridad, no decimos si existe o no, simulamos éxito
                return reply.send({ message: 'Si el correo existe, recibirás un código.' })
            }

            const otp = generateOTP()
            await prisma.user.update({
                where: { email: user.email },
                data: {
                    resetToken: otp,
                    resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
                }
            })

            await resend.emails.send({
                from: MAIL_FROM,
                to: user.email,
                subject: 'Recuperación de contraseña - Pet Health',
                html: `<p>Solicitaste restablecer tu contraseña.</p><p>Tu código es: <strong style="font-size:24px;">${otp}</strong></p><p>Expira en 15 minutos.</p>`
            })

            return reply.send({ message: 'Si el correo existe, recibirás un código.' })
        } catch (error) {
            return reply.code(400).send({ message: 'Error procesando la solicitud' })
        }
    })

    // ==========================================================
    // 5. RESET PASSWORD (Verifica código y cambia clave)
    // ==========================================================
    app.post('/reset-password', async (req, reply) => {
        try {
            const body = resetPasswordSchema.parse(req.body)
            const user = await prisma.user.findUnique({ where: { email: body.email } })

            if (!user) return reply.code(400).send({ message: 'Error al restablecer contraseña' })

            if (user.resetToken !== body.code) {
                return reply.code(401).send({ message: 'Código de recuperación incorrecto' })
            }
            if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
                return reply.code(401).send({ message: 'El código expiró. Solicita uno nuevo.' })
            }

            const newPasswordHash = await bcrypt.hash(body.newPassword, 10)

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    resetToken: null,
                    resetTokenExpiry: null
                }
            })

            return reply.send({ message: 'Contraseña actualizada exitosamente' })
        } catch (error) {
            return reply.code(400).send({ message: 'Error al restablecer contraseña' })
        }
    })

    // ==========================================================
    // ME
    // ==========================================================
    app.get('/me', { preHandler: [authenticate] }, async (req: any) => { 
        const me = await prisma.user.findUnique({ 
            where: { id: req.user.sub }, 
            select: { id: true, email: true, name: true, lastname: true, phone: true, role: true } 
        })
        return me
    })
}