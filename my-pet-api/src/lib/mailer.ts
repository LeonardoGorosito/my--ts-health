import { Resend } from 'resend'

// Toma la API key de tu archivo .env
export const resend = new Resend(process.env.RESEND_API_KEY)

// Resend te da este correo de prueba gratis ('onboarding@resend.dev') que solo puede 
// enviar correos a la misma dirección con la que te creaste la cuenta de Resend.
// ¡Ideal para probar ahora mismo!
export const MAIL_FROM = 'PetHealth <soporte@oethealth.com>'

