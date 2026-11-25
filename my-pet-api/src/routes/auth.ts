import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import { prisma } from '../db.js'
import { authenticate } from '../hooks/authenticate.js'
// IMPORTANTE: Asegurate de tener tu resend configurado en este archivo
import { resend, MAIL_FROM, logDevCode } from '../lib/mailer.js'
import { getSubscription, trialEndFromNow } from '../lib/subscription.js'
import { TERMS_VERSION } from '../lib/legal.js'
import { destroyCloudinaryUrl } from '../lib/cloudinary-assets.js'

// --- HELPER PARA CÓDIGOS DE 6 DÍGITOS ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// --- ESQUEMAS ---
const registerSchema = z.object({
  name: z.string().min(2),
  lastname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  // Consentimiento expreso (Ley 25.326): sin aceptar no se crea la cuenta
  acceptTerms: z.literal(true, { message: 'Tenés que aceptar los términos y la política de privacidad' }),
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

// Campos del usuario que devuelve /auth/me (nunca el hash ni los códigos)
const meSelect = {
  id: true, email: true, name: true, lastname: true, phone: true, address: true,
  vetName: true, vetPhone: true, emergencyPhone: true, emailReminders: true, role: true,
  termsVersion: true, termsAcceptedAt: true
} as const

// Respuesta de /auth/me (y de lo que edita el perfil): datos del usuario + estado de la suscripción
const meResponse = async (userId: string) => {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: meSelect })
  if (!me) return null
  // currentTermsVersion: si no coincide con termsVersion, el front pide aceptar los textos nuevos
  return { ...me, currentTermsVersion: TERMS_VERSION, subscription: await getSubscription(userId) }
}

const updateMeSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto'),
  lastname: z.string().trim().min(2, 'El apellido es muy corto'),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  vetName: z.string().max(100).optional(),
  vetPhone: z.string().max(30).optional(),
  emergencyPhone: z.string().max(30).optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
})

const preferencesSchema = z.object({
  emailReminders: z.boolean(),
})

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

// --- LÍMITES DE INTENTOS POR IP ---
// Rutas que mandan email: pocos intentos para no gastar cuota de Resend
const emailLimit = { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }
// Rutas que validan contraseña o código de 6 dígitos: frenan la fuerza bruta
const codeLimit = { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }
const loginLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

export default async function auth(app: FastifyInstance) {
    
    // ==========================================================
    // 1. REGISTRO (Crea cuenta inactiva y envía código)
    // ==========================================================
    app.post('/register', emailLimit, async (req, reply) => { 
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
                            verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
                            termsAcceptedAt: new Date(),
                            termsVersion: TERMS_VERSION
                        }
                    })
                    logDevCode('verificación', body.email, otp)
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
                    trialEndsAt: trialEndFromNow(), // 30 días de prueba con todo lo de Pro
                    termsAcceptedAt: new Date(),
                    termsVersion: TERMS_VERSION,
                    verificationCode: otp,
                    verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
                }
            })

            logDevCode('verificación', body.email, otp)
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
    app.post('/verify-email', codeLimit, async (req, reply) => {
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
    app.post('/login', loginLimit, async (req, reply) => { 
        const body = loginSchema.parse(req.body)
        const user = await prisma.user.findUnique({ where: { email: body.email } })
        
        if (!user || !user.passwordHash) {
            return reply.code(401).send({ message: 'Credenciales inválidas' })
        }       
        
        // Primero la contraseña: así no se revela si la cuenta existe ni se mandan emails a cuentas ajenas
        const ok = await bcrypt.compare(body.password, user.passwordHash)        
        if (!ok) return reply.code(401).send({ message: 'Credenciales inválidas' })

        // Cuenta sin verificar: generamos un código nuevo (el anterior pudo haber vencido) y lo reenviamos
        if (!user.isVerified) {
            const otp = generateOTP()
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    verificationCode: otp,
                    verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
                }
            })
            logDevCode('verificación', user.email, otp)
            await resend.emails.send({
                from: MAIL_FROM,
                to: user.email,
                subject: 'Verifica tu cuenta en Pet Health',
                html: `<p>Tu código de verificación es: <strong style="font-size:24px;">${otp}</strong></p><p>Este código expira en 15 minutos.</p>`
            })
            return reply.code(403).send({ message: 'PENDING_VERIFICATION', email: user.email })
        }

        const token = app.jwt.sign({ sub: user.id, role: user.role, email: user.email })
        return { token }   
    })

    // ==========================================================
    // 4. FORGOT PASSWORD (Genera código de recuperación)
    // ==========================================================
    app.post('/forgot-password', emailLimit, async (req, reply) => {
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

            logDevCode('recuperación', user.email, otp)
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
    app.post('/reset-password', codeLimit, async (req, reply) => {
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
        return meResponse(req.user.sub)
    })

    // ==========================================================
    // CAMBIAR CONTRASEÑA (PUT /auth/me/password) — pide la actual
    // ==========================================================
    app.put('/me/password', { preHandler: [authenticate], ...codeLimit }, async (req: any, reply) => {
        const parsed = changePasswordSchema.safeParse(req.body)
        if (!parsed.success) {
            return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
        }
        const { currentPassword, newPassword } = parsed.data

        const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
        if (!user?.passwordHash) return reply.code(400).send({ message: 'La cuenta no tiene contraseña' })

        const ok = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!ok) return reply.code(401).send({ message: 'La contraseña actual no es correcta' })

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await bcrypt.hash(newPassword, 10) }
        })
        return { message: 'Contraseña actualizada' }
    })

    // ==========================================================
    // PREFERENCIAS (PUT /auth/me/preferences)
    // ==========================================================
    app.put('/me/preferences', { preHandler: [authenticate] }, async (req: any, reply) => {
        const parsed = preferencesSchema.safeParse(req.body)
        if (!parsed.success) return reply.code(400).send({ message: 'Datos inválidos' })
        const me = await prisma.user.update({
            where: { id: req.user.sub },
            data: parsed.data,
            select: { id: true }
        })
        return meResponse(me.id)
    })

    // ==========================================================
    // ACTUALIZAR MI PERFIL (PUT /auth/me)
    // ==========================================================
    app.put('/me', { preHandler: [authenticate] }, async (req: any, reply) => {
        const parsed = updateMeSchema.safeParse(req.body)
        if (!parsed.success) {
            return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
        }
        // Los campos opcionales vacíos se guardan como null
        const { name, lastname, ...rest } = parsed.data
        const optional = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, v?.trim() ? v.trim() : null])
        )
        const me = await prisma.user.update({
            where: { id: req.user.sub },
            data: { name: name.trim(), lastname: lastname.trim(), ...optional },
            select: { id: true }
        })
        return meResponse(me.id)
    })

    // ==========================================================
    // ACEPTAR TÉRMINOS VIGENTES (POST /auth/me/accept-terms)
    // Para usuarios que aceptaron una versión anterior (o se registraron antes de guardarla)
    // ==========================================================
    app.post('/me/accept-terms', { preHandler: [authenticate] }, async (req: any) => {
        await prisma.user.update({
            where: { id: req.user.sub },
            data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
        })
        return meResponse(req.user.sub)
    })

    // ==========================================================
    // ELIMINAR MI CUENTA (DELETE /auth/me) — derecho de supresión, Ley 25.326
    // Borra las mascotas propias (con sus registros y archivos en Cloudinary),
    // los accesos compartidos y la cuenta. Pide la contraseña.
    // ==========================================================
    app.delete('/me', { preHandler: [authenticate], ...codeLimit }, async (req: any, reply) => {
        const parsed = deleteAccountSchema.safeParse(req.body)
        if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos' })

        const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
        if (!user) return reply.code(404).send({ message: 'La cuenta no existe' })
        if (!user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
            return reply.code(401).send({ message: 'La contraseña no es correcta' })
        }

        // Quien administra una veterinaria no puede borrar su cuenta sin resolver la clínica antes
        const ownsClinic = await prisma.clinicMember.count({ where: { userId: user.id, role: 'OWNER' } })
        if (ownsClinic > 0) {
            return reply.code(409).send({ message: 'Administrás una veterinaria. Escribinos para darla de baja o transferirla antes de eliminar tu cuenta.' })
        }

        // Archivos en Cloudinary: fotos de las mascotas y adjuntos
        const pets = await prisma.pet.findMany({
            where: { ownerId: user.id },
            select: { profileImageUrl: true, bannerImageUrl: true, attachments: { select: { url: true } } },
        })
        const urls = pets.flatMap((p) => [p.profileImageUrl, p.bannerImageUrl, ...p.attachments.map((a) => a.url)])
        await Promise.all(urls.map((u) => destroyCloudinaryUrl(u)))

        // Base de datos: las mascotas arrastran en cascada sus registros, accesos y links;
        // el usuario arrastra los accesos que otros le compartieron.
        await prisma.$transaction([
            prisma.pet.deleteMany({ where: { ownerId: user.id } }),
            prisma.user.delete({ where: { id: user.id } }),
        ])
        req.log.info({ userId: user.id }, 'Cuenta eliminada por el usuario')
        return { message: 'Cuenta eliminada' }
    })

    // ==========================================================
    // CÓDIGO PARA MI VETERINARIA (POST /auth/me/clinic-code)
    // El dueño se lo pasa a su veterinaria para que importe sus datos y sus mascotas
    // sin cargarlos a mano. 6 caracteres fáciles de dictar, un solo uso, vence a los 30 min.
    // ==========================================================
    app.post('/me/clinic-code', { preHandler: [authenticate], config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req: any) => {
        const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O ni 1/I
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
            try {
                await prisma.user.update({ where: { id: req.user.sub }, data: { clinicLinkCode: code, clinicLinkCodeExpiresAt: expiresAt } })
                return { code, expiresAt }
            } catch {
                // choque con un código existente (único): probamos otro
            }
        }
        throw new Error('No se pudo generar el código')
    })
}
