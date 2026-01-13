import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import { ENV } from './env.js'
import health from './routes/health.js'
import auth from './routes/auth.js'

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// --- NOTA: Ya NO usamos app.decorate('authenticate') aquí.
// Usamos el hook importado en cada archivo de ruta.

// 4. REGISTRAR RUTAS
app.get('/', async () => { return { status: 'ok', server: 'My Pets Health API' } })

await app.register(health)
await app.register(auth, { prefix: '/auth' })

export default app