import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import { ENV } from './env.js'
import health from './routes/health.js'
import auth from './routes/auth.js'
import petRoutes from './routes/pets.js'
// 1. IMPORTAR LA NUEVA RUTA DE SUBIDA (Asegúrate de haber creado el archivo)
import { uploadRoutes } from './routes/upload.js' 
import medicalRoutes from './routes/medical.js'
import vaccineRoutes from './routes/vaccines.js'
import dewormingRoutes from './routes/dewormings.js'
import attachmentRoutes from './routes/attachments.js'

const app = Fastify({ logger: true })

// CORS
await app.register(cors, { 
  origin: [
    'http://localhost:5173',
    "http://localhost:5174"    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

// 2. REGISTRAR JWT
await app.register(jwt, { secret: ENV.JWT_SECRET })

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

//attachments

app.register(attachmentRoutes, { prefix: '/attachments' }) // <--- Registrar

export default app