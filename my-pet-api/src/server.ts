import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { ENV } from './env.js'
import health from './routes/health.js'
import auth from './routes/auth.js'
import petRoutes from './routes/pets.js'
// 1. IMPORTAR LA NUEVA RUTA DE SUBIDA (Asegúrate de haber creado el archivo)
import { uploadRoutes } from './routes/upload.js' 
import medicalRoutes from './routes/medical.js'
import vaccineRoutes from './routes/vaccines.js'
import dewormingRoutes from './routes/dewormings.js'
import weightRoutes from './routes/weights.js'
import treatmentRoutes from './routes/treatments.js'
import attachmentRoutes from './routes/attachments.js'
import cronRoutes from './routes/cron.js'
import adminRoutes from './routes/admin.js'
import shareRoutes from './routes/shares.js'
import clinicRoutes from './routes/clinics.js'

// trustProxy: en Vercel la IP real del cliente viene en X-Forwarded-For (necesario para el rate limit)
const app = Fastify({ logger: true, trustProxy: true })

// CORS
// FRONTEND_URL admite varias URLs separadas por coma (ej: "https://mi-app.vercel.app,https://midominio.com")
const frontendOrigins = ENV.FRONTEND_URL
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, '')) // sin espacios ni "/" final: el navegador manda el origin sin barra
  .filter(Boolean)

await app.register(cors, { 
  origin: [
    ...frontendOrigins,
    'http://localhost:5173',
    "http://localhost:5174",
    // Solo en desarrollo: permite abrir el front desde la red local (ej: probar el QR con el celular)
    ...(process.env.NODE_ENV === 'development' ? [/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

// 2. REGISTRAR JWT
await app.register(jwt, { secret: ENV.JWT_SECRET })

// RATE LIMIT: global: false => solo aplica a las rutas que definan config.rateLimit (ver routes/auth.ts)
await app.register(rateLimit, {
  global: false,
  errorResponseBuilder: (_req, ctx) => ({
    statusCode: 429,
    message: `Demasiados intentos. Probá de nuevo en ${ctx.after}.`,
  }),
})

// 3. REGISTRAR MULTIPART (Para subir archivos)
await app.register(fastifyMultipart, { 
  // RECOMENDACIÓN: Subir a 10MB o 15MB para estudios médicos pesados
  limits: { fileSize: 10 * 1024 * 1024 }, 
})

// 4. REGISTRAR RUTAS
app.get('/', async () => { return { status: 'ok', server: 'My Pets Health API' } })

await app.register(health)
await app.register(auth, { prefix: '/auth' })
app.register(petRoutes, { prefix: '/pets' })

// 5. AQUÍ REGISTRAMOS LA RUTA DE UPLOAD
// Esto habilita el endpoint: POST http://localhost:3000/upload
app.register(uploadRoutes) 

// medicalRoutes

app.register(medicalRoutes, { prefix: '/medical' }) // <--- Registrar con prefijo

//vaccines

app.register(vaccineRoutes, { prefix: '/vaccines' })

// dewornings

app.register(dewormingRoutes, { prefix: '/dewormings' })

// historial de peso
app.register(weightRoutes, { prefix: '/weights' })

// medicación y tratamientos
app.register(treatmentRoutes, { prefix: '/treatments' })

//attachments

app.register(attachmentRoutes, { prefix: '/attachments' }) // <--- Registrar

// cron (recordatorios diarios, lo llama Vercel Cron)
app.register(cronRoutes)

// administración (asignar planes a mano)
app.register(adminRoutes, { prefix: '/admin' })

// compartir mascotas con familia (invitaciones) y veterinario (link de solo lectura)
app.register(shareRoutes, { prefix: '/shares' })

// clínicas veterinarias: alta con matrícula, equipo, clientes, pacientes e historia clínica
app.register(clinicRoutes, { prefix: '/clinics' })


export default app
