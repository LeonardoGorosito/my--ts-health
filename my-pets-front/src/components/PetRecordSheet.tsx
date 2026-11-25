import type React from 'react'
import { Placo } from './brand/Placo'
import { daysFromToday, formatDay } from '../lib/dates'
import { frequencyLabel, treatmentStatus } from '../lib/treatments'
import { breedOrDefault, speciesName } from '../lib/species'
import type { Treatment } from '../lib/treatments'

// ==========================================================
// HOJA DE LA FICHA DE SALUD (A4, siempre clara, lista para imprimir o guardar en PDF)
// La usan la ficha del dueño (pages/pets/PetRecord) y el link del veterinario (pages/public/VetRecord).
// ==========================================================

type Dated = { id: string; name: string; dateApplied: string; nextDueDate?: string | null }

export interface PetRecordData {
  id: string
  name: string
  species: string
  breed: string | null
  gender: 'Macho' | 'Hembra' | null
  birthDate: string | null
  weight?: string | null
  isCastrated: boolean
  specialNeeds: string | null
  profileImageUrl?: string | null
  vaccinations: Dated[]
  dewormings: (Dated & { type: 'INTERNA' | 'EXTERNA' })[]
  medicalHistory: { id: string; date: string; title: string; description: string }[]
  weights?: { id: string; date: string; weightKg: number; note?: string | null }[]
  treatments?: Treatment[]
  attachments: { id: string; name: string; createdAt: string }[]
}

export const SECTIONS = [
  { key: 'owner', label: 'Mis datos de contacto' },
  { key: 'treatments', label: 'Tratamientos' },
  { key: 'vaccines', label: 'Vacunas' },
  { key: 'dewormings', label: 'Desparasitaciones' },
  { key: 'weights', label: 'Peso' },
  { key: 'history', label: 'Historial médico' },
  { key: 'files', label: 'Estudios adjuntos' },
] as const
export type SectionKey = (typeof SECTIONS)[number]['key']

function ageLabel(birthDate: string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getUTCFullYear()) * 12 + (now.getMonth() - birth.getUTCMonth())
  if (now.getDate() < birth.getUTCDate()) months--
  if (months < 12) return `${Math.max(months, 0)} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'}`
}

// Estado de una próxima dosis: texto + si conviene resaltarlo
function dueStatus(nextDueDate?: string | null): { text: string; tone: 'ok' | 'soon' | 'late' | 'none' } {
  if (!nextDueDate) return { text: '—', tone: 'none' }
  const d = daysFromToday(nextDueDate)
  if (d < 0) return { text: `Vencida (${formatDay(nextDueDate)})`, tone: 'late' }
  if (d === 0) return { text: 'Vence hoy', tone: 'soon' }
  if (d <= 30) return { text: `${formatDay(nextDueDate)} (en ${d} ${d === 1 ? 'día' : 'días'})`, tone: 'soon' }
  return { text: formatDay(nextDueDate), tone: 'ok' }
}

const toneClass = { ok: 'text-gray-900', soon: 'text-amber-800 font-semibold', late: 'text-red-700 font-semibold', none: 'text-gray-500' }

const fmtKg = (kg: number) => `${kg.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`
const byDateDesc = <T,>(get: (x: T) => string) => (a: T, b: T) => get(b).localeCompare(get(a))

export type RecordContact = { name: string; lastname: string; phone?: string | null; email?: string | null }

export const ALL_SECTIONS: Record<SectionKey, boolean> = {
  owner: true, treatments: true, vaccines: true, dewormings: true, weights: true, history: true, files: true,
}

export function PetRecordSheet({ pet, contact, include = ALL_SECTIONS }: {
  pet: PetRecordData
  contact?: RecordContact | null
  include?: Record<SectionKey, boolean>
}) {
  const female = pet.gender === 'Hembra'
  const generatedAt = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  const treatments = (pet.treatments ?? []).map((t) => ({ t, status: treatmentStatus(t) }))
  const currentTreatments = treatments.filter(({ status }) => status.kind !== 'finished')
  const pastTreatments = treatments.filter(({ status }) => status.kind === 'finished').sort(byDateDesc(({ t }) => t.startDate))
  const vaccines = [...pet.vaccinations].sort(byDateDesc((v) => v.dateApplied))
  const dewormings = [...pet.dewormings].sort(byDateDesc((d) => d.dateApplied))
  const weights = [...(pet.weights ?? [])].sort(byDateDesc((w) => w.date))
  const history = [...pet.medicalHistory].sort(byDateDesc((r) => r.date))
  const latestWeight = weights[0] ? fmtKg(weights[0].weightKg) : pet.weight ? `${pet.weight} kg` : null

  const facts: [string, string | null][] = [
    ['Especie', speciesName(pet.species, pet.gender)],
    ['Raza o tipo', breedOrDefault(pet.breed, pet.species, pet.gender)],
    ['Sexo', pet.gender],
    ['Nacimiento', pet.birthDate ? `${formatDay(pet.birthDate)} (${ageLabel(pet.birthDate)})` : null],
    ['Castración', pet.isCastrated ? (female ? 'Castrada' : 'Castrado') : 'No'],
    ['Peso', latestWeight ? `${latestWeight}${weights[0] ? ` (${formatDay(weights[0].date)})` : ''}` : null],
  ]

  return (
    <article className="record-sheet mx-auto max-w-[210mm] bg-white px-6 py-8 text-[13px] leading-relaxed text-gray-900 shadow-xl ring-1 ring-gray-200 sm:px-12 sm:py-12 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-emerald-600 pb-4">
        {/* Logo con colores fijos: la hoja es clara aunque la app esté en modo oscuro */}
        <span className="inline-flex items-center gap-2">
          <Placo size={30} title="PetHealth" />
          <span className="font-brand text-lg leading-none tracking-tight">
            <span className="font-bold text-[#052E2B]">Pet</span>
            <span className="font-medium text-emerald-700">Health</span>
          </span>
        </span>
        <div className="text-right text-xs text-gray-600">
          <p className="font-brand text-base font-bold text-gray-900">Ficha de salud</p>
          <p>Generada el {generatedAt}</p>
        </div>
      </header>

      {/* Mascota */}
      <section className="mt-6 flex gap-5 break-inside-avoid" aria-label="Datos de la mascota">
        {pet.profileImageUrl && (
          <img src={pet.profileImageUrl} alt="" className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-brand text-3xl font-bold leading-tight">{pet.name}</h1>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 print:grid-cols-2">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 flex-shrink-0 text-gray-600">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {include.owner && contact && (
        <Section title="Contacto">
          <p>
            <span className="font-medium">{contact.name} {contact.lastname}</span>
            {contact.phone ? ` · ${contact.phone}` : ''}{contact.email ? ` · ${contact.email}` : ''}
          </p>
        </Section>
      )}

      {pet.specialNeeds && (
        <Section title="Notas de salud">
          <p className="whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">{pet.specialNeeds}</p>
        </Section>
      )}

      {include.treatments && (
        <Section title="Tratamientos" empty={treatments.length === 0 ? 'Sin tratamientos registrados.' : undefined}>
          {currentTreatments.length > 0 && (
            <Table head={['Medicamento', 'Dosis', 'Frecuencia', 'Desde', 'Hasta']}>
              {currentTreatments.map(({ t, status }) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}{t.notes && <span className="block text-xs font-normal text-gray-600">{t.notes}</span>}</td>
                  <td>{t.dose || '—'}</td>
                  <td>{frequencyLabel(t.frequencyHours)}</td>
                  <td>{formatDay(t.startDate)}</td>
                  <td>{t.endDate ? formatDay(t.endDate) : 'Continuo'}{status.kind === 'upcoming' && <span className="block text-xs text-gray-600">Todavía no empezó</span>}</td>
                </tr>
              ))}
            </Table>
          )}
          {pastTreatments.length > 0 && (
            <>
              <h3 className="mt-3 text-xs font-semibold text-gray-600">Terminados</h3>
              <Table head={['Medicamento', 'Dosis', 'Frecuencia', 'Período']}>
                {pastTreatments.map(({ t }) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td>{t.dose || '—'}</td>
                    <td>{frequencyLabel(t.frequencyHours)}</td>
                    <td>{formatDay(t.startDate)} al {formatDay(t.endDate!)}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </Section>
      )}

      {include.vaccines && (
        <Section title="Vacunas" empty={vaccines.length === 0 ? 'Sin vacunas registradas.' : undefined}>
          <Table head={['Vacuna', 'Aplicada', 'Próxima dosis']}>
            {vaccines.map((v) => {
              const due = dueStatus(v.nextDueDate)
              return (
                <tr key={v.id}>
                  <td className="font-medium">{v.name}</td>
                  <td>{formatDay(v.dateApplied)}</td>
                  <td className={toneClass[due.tone]}>{v.nextDueDate ? due.text : 'Dosis única'}</td>
                </tr>
              )
            })}
          </Table>
        </Section>
      )}

      {include.dewormings && (
        <Section title="Desparasitaciones" empty={dewormings.length === 0 ? 'Sin desparasitaciones registradas.' : undefined}>
          <Table head={['Producto', 'Tipo', 'Aplicada', 'Próxima']}>
            {dewormings.map((d) => {
              const due = dueStatus(d.nextDueDate)
              return (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td>{d.type === 'INTERNA' ? 'Interna' : 'Externa'}</td>
                  <td>{formatDay(d.dateApplied)}</td>
                  <td className={toneClass[due.tone]}>{due.text}</td>
                </tr>
              )
            })}
          </Table>
        </Section>
      )}

      {include.weights && (
        <Section title="Peso" empty={weights.length === 0 ? 'Sin pesadas registradas.' : undefined}>
          <Table head={['Fecha', 'Peso', 'Nota']}>
            {weights.slice(0, 12).map((w) => (
              <tr key={w.id}>
                <td>{formatDay(w.date)}</td>
                <td className="font-medium tabular-nums">{fmtKg(w.weightKg)}</td>
                <td className="text-gray-600">{w.note || ''}</td>
              </tr>
            ))}
          </Table>
          {weights.length > 12 && <p className="mt-1 text-xs text-gray-600">Se muestran las últimas 12 de {weights.length} pesadas.</p>}
        </Section>
      )}

      {include.history && (
        <Section title="Historial médico" empty={history.length === 0 ? 'Sin consultas registradas.' : undefined}>
          <ol className="space-y-3">
            {history.map((r) => (
              <li key={r.id} className="grid grid-cols-[6.5rem_1fr] gap-3 break-inside-avoid">
                <span className="tabular-nums text-gray-600">{formatDay(r.date)}</span>
                <div>
                  <p className="font-semibold">{r.title}</p>
                  {r.description && <p className="whitespace-pre-line text-gray-700">{r.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {include.files && pet.attachments.length > 0 && (
        <Section title="Estudios adjuntos">
          <p className="mb-1 text-xs text-gray-600">Los archivos se ven desde la app PetHealth.</p>
          <ul className="list-disc pl-5">
            {pet.attachments.map((f) => (
              <li key={f.id}>{f.name} <span className="text-gray-600">· {new Date(f.createdAt).toLocaleDateString('es-AR')}</span></li>
            ))}
          </ul>
        </Section>
      )}

      <footer className="mt-10 border-t border-gray-200 pt-3 text-[11px] text-gray-600">
        Ficha generada con PetHealth a partir de los datos que cargó la familia de {pet.name}. No reemplaza la libreta sanitaria oficial ni el criterio del veterinario.
      </footer>
    </article>
  )
}

function Section({ title, empty, children }: { title: string; empty?: string; children?: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 break-after-avoid font-brand text-base font-bold text-emerald-800">{title}</h2>
      {empty ? <p className="text-gray-600">{empty}</p> : children}
    </section>
  )
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="record-table w-full border-collapse text-left">
      <thead>
        <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}
