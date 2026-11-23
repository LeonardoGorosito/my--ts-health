// ==========================================================
// PLANES Y PRECIOS — este es el único lugar donde se definen.
// Los precios en pesos y en dólares son independientes (no se convierten).
// Los límites reales los controla el backend (my-pet-api/src/lib/subscription.ts):
// si cambiás qué incluye cada plan, cambialo en los dos lados.
// ==========================================================

export type Currency = 'ARS' | 'USD'
export type PaidPlan = 'STANDARD' | 'PRO'
export type Tier = 'TRIAL' | PaidPlan | 'EXPIRED'

export const TRIAL_DAYS = 30

export const PRICES: Record<PaidPlan, Record<Currency, number>> = {
  STANDARD: { ARS: 2500, USD: 2 },
  PRO: { ARS: 4500, USD: 4 },
}

export const PLAN_INFO: Record<PaidPlan, { name: string; tagline: string; features: string[] }> = {
  STANDARD: {
    name: 'Standard',
    tagline: 'Para cuidar a tus mascotas sin complicarte.',
    features: [
      'Hasta 2 mascotas',
      'Ficha completa: vacunas, historial, tratamientos y peso',
      'Placa QR con tus datos de contacto',
      'Modo mascota perdida',
    ],
  },
  PRO: {
    name: 'Pro',
    tagline: 'Para familias con muchos peludos.',
    features: [
      'Mascotas ilimitadas',
      'Todo lo de Standard',
      'Recordatorios por email de vacunas y desparasitaciones',
      'Archivos adjuntos (estudios, análisis, recetas)',
    ],
  },
}

export const TIER_LABEL: Record<Tier, string> = {
  TRIAL: 'Prueba gratis',
  STANDARD: 'Standard',
  PRO: 'Pro',
  EXPIRED: 'Sin plan',
}

export function formatPrice(amount: number, currency: Currency) {
  return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

// Moneda por defecto: pesos si el navegador está en Argentina, dólares si no
export function defaultCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz?.startsWith('America/Argentina') || tz === 'America/Buenos_Aires') return 'ARS'
  } catch {
    /* sin acceso a Intl: usamos USD */
  }
  return navigator.language?.toLowerCase().endsWith('-ar') ? 'ARS' : 'USD'
}
