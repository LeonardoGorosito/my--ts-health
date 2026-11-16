import { Resend } from 'resend';
// Si usás process.env directamente:
// const apiKey = process.env.RESEND_API_KEY;

// Si usás tu archivo env.ts (como vi en tu server.ts):
import { ENV } from '../env.js'; 
const apiKey = ENV.RESEND_API_KEY;

export const resend = new Resend(apiKey);

// ESTE ES EL REMITENTE MÁGICO DE PRUEBA
export const MAIL_FROM = 'onboarding@resend.dev';

// --- MODO DESARROLLO ---
// Solo activo con NODE_ENV=development (lo setea `npm run dev`). En Vercel nunca se activa.
export const isDev = process.env.NODE_ENV === 'development'

// Imprime el código OTP en la consola del servidor para poder probar sin email
export const logDevCode = (tipo: string, email: string, code: string) => {
  if (!isDev) return
  console.log(`\n🔑 [DEV] Código de ${tipo} para ${email}: ${code}\n`)
}
