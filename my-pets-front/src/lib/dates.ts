// ==========================================================
// FECHAS "DE CALENDARIO" (sin hora): vacunas, desparasitaciones, historial,
// nacimiento, peso y tratamientos. El backend las guarda a medianoche UTC
// ("2026-11-20T00:00:00Z"). Mostrarlas con la zona horaria local en Argentina
// (UTC-3) las corre al día anterior: por eso siempre se leen en UTC.
// (Los momentos reales, como "se perdió" o "se subió", usan la hora local.)
// ==========================================================

const DAY_MS = 24 * 60 * 60 * 1000

// "20/11/2026" (o con otras opciones, ej: { day: 'numeric', month: 'short' })
export const formatDay = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleDateString('es-AR', { timeZone: 'UTC', ...opts })

// Número de día de una fecha de calendario y de hoy (en la zona del usuario)
export const dayNumber = (iso: string) => Math.floor(new Date(iso).getTime() / DAY_MS)
export const todayNumber = () => {
  const now = new Date()
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS)
}

// Días desde hoy: 0 = hoy, 1 = mañana, -2 = hace dos días
export const daysFromToday = (iso: string) => dayNumber(iso) - todayNumber()

// Partes para mostrar por separado (ej: el día grande en la línea de tiempo)
export const dayParts = (iso: string) => {
  const d = new Date(iso)
  return { day: d.getUTCDate(), month: formatDay(iso, { month: 'short' }), year: d.getUTCFullYear() }
}

// Fecha local de un momento (o de hoy) en formato de <input type="date">: "2026-11-20".
// Ojo: toISOString() usa UTC y después de las 21 h en Argentina da el día siguiente.
export const todayInput = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
