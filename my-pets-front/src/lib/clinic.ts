import { useQuery } from '@tanstack/react-query'
import { api } from './axios'
import type { Species } from './species'

// ==========================================================
// CLÍNICAS VETERINARIAS: tipos, textos y la clínica activa del usuario
// (el backend está en my-pet-api/src/routes/clinics.ts)
// ==========================================================

export type ClinicRole = 'OWNER' | 'VET' | 'STAFF'
export type LicenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RecordType = 'CONSULTATION' | 'CONTROL' | 'EMERGENCY' | 'SURGERY' | 'OTHER'

export type Clinic = {
  id: string
  name: string
  address: string
  city: string
  province: string
  phone: string
  email: string | null
  logoUrl: string | null
  trialEndsAt: string
}

export type Membership = {
  memberId: string
  role: ClinicRole
  licenseNumber: string | null
  licenseIssuer: string | null
  licenseStatus: LicenseStatus | null
  licenseNote: string | null
  clinic: Clinic
}

export type ClinicClient = {
  id: string
  name: string
  lastname: string
  dni: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
}

export type ClinicPatient = {
  id: string
  clientId: string
  name: string
  species: Species
  breed: string | null
  sex: 'Macho' | 'Hembra' | null
  birthDate: string | null
  coat: string | null
  microchip: string | null
  isCastrated: boolean
  weightKg: number | null
  alerts: string | null
  deceasedAt: string | null
}

export type ClinicalRecord = {
  id: string
  date: string
  type: RecordType
  reason: string
  anamnesis: string | null
  weightKg: number | null
  temperatureC: number | null
  heartRate: number | null
  respiratoryRate: number | null
  mucous: string | null
  capillaryRefill: string | null
  hydration: string | null
  bodyCondition: number | null
  physicalExam: string | null
  presumptiveDx: string | null
  finalDx: string | null
  treatment: string | null
  nextControl: string | null
  author: { role: ClinicRole; licenseNumber: string | null; user: { name: string; lastname: string } } | null
}

export type Preventive = {
  id: string
  kind: 'VACCINE' | 'DEWORMING'
  name: string
  lot: string | null
  route: 'INTERNA' | 'EXTERNA' | null
  dateApplied: string
  nextDueDate: string | null
}

export type ClinicAttachment = { id: string; name: string; url: string; fileType: string; createdAt: string }

export type PatientDetail = ClinicPatient & {
  client: ClinicClient
  records: ClinicalRecord[]
  preventives: Preventive[]
  attachments: ClinicAttachment[]
}

export const ROLE_LABEL: Record<ClinicRole, string> = {
  OWNER: 'Administra la clínica',
  VET: 'Veterinario/a',
  STAFF: 'Recepción',
}

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  CONSULTATION: 'Consulta',
  CONTROL: 'Control',
  EMERGENCY: 'Urgencia',
  SURGERY: 'Cirugía',
  OTHER: 'Otro',
}

export const LICENSE_LABEL: Record<LicenseStatus, string> = {
  PENDING: 'Matrícula en revisión',
  APPROVED: 'Matrícula aprobada',
  REJECTED: 'Matrícula rechazada',
}

export const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa',
  'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
]

// Qué puede hacer cada rol (el backend lo controla igual; ver CAN en lib/clinic.ts del API)
export const canClinical = (role?: ClinicRole) => role === 'OWNER' || role === 'VET'
export const canDelete = canClinical
export const canManage = (role?: ClinicRole) => role === 'OWNER'

// Clínicas del usuario. La "activa" es la primera (casi siempre hay una sola).
export function useMyClinics(enabled = true) {
  return useQuery<Membership[]>({
    queryKey: ['clinics', 'mine'],
    queryFn: async () => (await api.get('/clinics/mine')).data,
    enabled,
    staleTime: 60_000,
  })
}

export function useActiveClinic() {
  const query = useMyClinics()
  return { ...query, membership: query.data?.[0] ?? null }
}

// Nombre completo de un cliente
export const fullName = (c: { name: string; lastname: string }) => `${c.name} ${c.lastname}`

// Edad a partir de la fecha de nacimiento ("3 años", "7 meses")
export function ageFrom(birthDate: string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getUTCFullYear()) * 12 + (now.getMonth() - birth.getUTCMonth())
  if (now.getDate() < birth.getUTCDate()) months--
  if (months < 12) return `${Math.max(months, 0)} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'}`
}

// Error legible de una respuesta del API
export const apiMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
