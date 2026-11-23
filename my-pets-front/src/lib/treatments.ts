import { dayNumber, todayNumber, formatDay, todayInput } from './dates'

export { formatDay, todayInput }

// ==========================================================
// MEDICACIÓN Y TRATAMIENTOS: tipos y cálculos compartidos
// (tarjeta del perfil, formulario y avisos de la campana)
// ==========================================================

export type Treatment = {
  id: string
  name: string
  dose?: string | null
  frequencyHours: number
  startDate: string
  endDate?: string | null // null = continuo
  notes?: string | null
}

export const FREQUENCY_OPTIONS = [
  { hours: 6, label: 'Cada 6 horas (4 veces por día)' },
  { hours: 8, label: 'Cada 8 horas (3 veces por día)' },
  { hours: 12, label: 'Cada 12 horas (2 veces por día)' },
  { hours: 24, label: '1 vez por día' },
  { hours: 48, label: 'Día por medio' },
  { hours: 72, label: 'Cada 3 días' },
  { hours: 168, label: '1 vez por semana' },
  { hours: 336, label: 'Cada 2 semanas' },
  { hours: 720, label: '1 vez por mes' },
]

export function frequencyLabel(hours: number) {
  const known = FREQUENCY_OPTIONS.find((o) => o.hours === hours)
  if (known) return known.label
  if (hours < 24) return `Cada ${hours} horas`
  if (hours % 24 === 0) return `Cada ${hours / 24} días`
  return `Cada ${hours} horas`
}

export type TreatmentStatus =
  | { kind: 'upcoming'; startsIn: number }
  | { kind: 'active'; day: number; totalDays: number | null; daysLeft: number | null } // totalDays null = continuo
  | { kind: 'finished' }

export function treatmentStatus(t: Treatment): TreatmentStatus {
  const today = todayNumber()
  const start = dayNumber(t.startDate)
  if (start > today) return { kind: 'upcoming', startsIn: start - today }
  if (!t.endDate) return { kind: 'active', day: today - start + 1, totalDays: null, daysLeft: null }
  const end = dayNumber(t.endDate)
  if (end < today) return { kind: 'finished' }
  return { kind: 'active', day: today - start + 1, totalDays: end - start + 1, daysLeft: end - today }
}
