import type React from 'react'
import { FileText, Smartphone } from 'lucide-react'
import type { FamilyRecord as FamilyRecordData } from '../../lib/clinic'
import { daysFromToday, formatDay } from '../../lib/dates'
import { frequencyLabel, treatmentStatus } from '../../lib/treatments'
import { card } from './ui'

// ==========================================================
// FICHA DE LA FAMILIA (pestaña de la ficha del paciente en la clínica)
// Lo que el dueño carga en su app de PetHealth: solo lectura y siempre al día.
// Aparece cuando el paciente se vinculó con el código del dueño.
// ==========================================================
export function FamilyRecord({ data, ownerName }: { data: FamilyRecordData; ownerName: string }) {
  const current = data.treatments.filter((t) => treatmentStatus(t).kind !== 'finished')
  const past = data.treatments.filter((t) => treatmentStatus(t).kind === 'finished')

  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-950 dark:bg-sky-900/20 dark:text-sky-100">
        <Smartphone size={18} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        Esto lo carga {ownerName} en su app de PetHealth. Se actualiza solo y no se puede editar desde la clínica. Si deja de compartirlo, deja de verse acá.
      </p>

      {data.specialNeeds && (
        <Block title="Notas de salud">
          <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{data.specialNeeds}</p>
        </Block>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Block title="Vacunas" empty={data.vaccinations.length === 0}>
          <DueList items={data.vaccinations.map((v) => ({ id: v.id, name: v.name, applied: v.dateApplied, next: v.nextDueDate }))} />
        </Block>
        <Block title="Desparasitaciones" empty={data.dewormings.length === 0}>
          <DueList items={data.dewormings.map((d) => ({ id: d.id, name: `${d.name} (${d.type === 'INTERNA' ? 'interna' : 'externa'})`, applied: d.dateApplied, next: d.nextDueDate }))} />
        </Block>
      </div>

      <Block title="Medicación y tratamientos" empty={data.treatments.length === 0}>
        <ul className="divide-y divide-gray-100 text-sm dark:divide-zinc-800">
          {[...current, ...past].map((t) => {
            const finished = treatmentStatus(t).kind === 'finished'
            return (
              <li key={t.id} className={`py-2.5 ${finished ? 'text-gray-500 dark:text-gray-500' : ''}`}>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t.name}{t.dose ? ` · ${t.dose}` : ''}
                  {!finished && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">En curso</span>}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {frequencyLabel(t.frequencyHours)} · desde el {formatDay(t.startDate)}{t.endDate ? ` hasta el ${formatDay(t.endDate)}` : ' (continuo)'}
                </p>
                {t.notes && <p className="text-gray-600 dark:text-gray-400">{t.notes}</p>}
              </li>
            )
          })}
        </ul>
      </Block>

      <div className="grid gap-6 lg:grid-cols-2">
        <Block title="Historial que cargó la familia" empty={data.medicalHistory.length === 0}>
          <ol className="space-y-3 text-sm">
            {data.medicalHistory.map((m) => (
              <li key={m.id}>
                <p><span className="tabular-nums text-gray-600 dark:text-gray-400">{formatDay(m.date)}</span> · <span className="font-semibold text-gray-900 dark:text-white">{m.title}</span></p>
                {m.description && <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{m.description}</p>}
              </li>
            ))}
          </ol>
        </Block>
        <Block title="Peso" empty={data.weights.length === 0}>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {data.weights.slice(0, 10).map((w) => (
                <tr key={w.id}>
                  <td className="py-2 tabular-nums text-gray-600 dark:text-gray-400">{formatDay(w.date)}</td>
                  <td className="py-2 font-semibold tabular-nums text-gray-900 dark:text-white">{w.weightKg.toLocaleString('es-AR')} kg</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      </div>

      <Block title="Estudios que subió la familia" empty={data.attachments.length === 0}>
        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
          {data.attachments.map((f) => (
            <li key={f.id} className="py-2.5">
              <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:underline">
                <FileText size={18} aria-hidden="true" className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-medium text-gray-900 dark:text-white">{f.name}</span>
                <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">{new Date(f.createdAt).toLocaleDateString('es-AR')}</span>
              </a>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  )
}

function Block({ title, empty, children }: { title: string; empty?: boolean; children: React.ReactNode }) {
  return (
    <section className={card}>
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">{title}</h3>
      {empty ? <p className="text-sm text-gray-600 dark:text-gray-400">Sin registros.</p> : children}
    </section>
  )
}

function DueList({ items }: { items: { id: string; name: string; applied: string; next: string | null }[] }) {
  return (
    <ul className="divide-y divide-gray-100 text-sm dark:divide-zinc-800">
      {items.map((i) => {
        const days = i.next ? daysFromToday(i.next) : null
        return (
          <li key={i.id} className="py-2.5">
            <p className="font-semibold text-gray-900 dark:text-white">{i.name}</p>
            <p className="text-gray-600 dark:text-gray-400">Aplicada el {formatDay(i.applied)}</p>
            {i.next && (
              <p className={days !== null && days < 0 ? 'font-semibold text-red-700 dark:text-red-400' : days !== null && days <= 30 ? 'font-semibold text-amber-800 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}>
                Próxima: {formatDay(i.next)}{days !== null && days < 0 ? ' (vencida)' : ''}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
