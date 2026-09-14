import { Resend } from 'resend';
// Si usás process.env directamente:
// const apiKey = process.env.RESEND_API_KEY;

// Si usás tu archivo env.ts (como vi en tu server.ts):
import { ENV } from '../env.js'; 
const apiKey = ENV.RESEND_API_KEY;

export const resend = new Resend(apiKey);

// ESTE ES EL REMITENTE MÁGICO DE PRUEBA
export const MAIL_FROM = 'onboarding@resend.dev';