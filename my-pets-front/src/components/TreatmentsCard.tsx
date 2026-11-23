import { useState } from 'react'
import { CheckCircle2, Edit2, Plus, Tablets, Trash2 } from 'lucide-react'
import { formatDay, frequencyLabel, treatmentStatus } from '../lib/treatments'
import type { Treatment } from '../lib/treatments'
import { EmptyHint } from './EmptyHint'

interface Props {
  treatments: Treatment[]
  petName: string
  onAdd: () => void
  onEdit: (t: Treatment) => void
  onFinish: (t: Treatment) => void
  onDelete: (t: Treatment) => void
}

const iconButton =
  'text-gray-500 dark:text-gray-400 p-2 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100'

// Tarjeta "Medicación y tratamientos": vigentes arriba (con progreso), terminados plegados abajo
export function TreatmentsCard({ treatments, petName, onAdd, onEdit, onFinish, onDelete }: Props) {
  const [showFinished, setShowFinished] = useState(false)

  const withStatus = treatments.map((t) => ({ t, status: treatmentStatus(t) }))
  const current = withStatus
    .filter(({ status }) => status.kind !== 'finished')
    // Primero los que terminan antes; los continuos al final
    .sort((a, b) => {
      const left = (x: typeof a) => (x.status.kind === 'active' ? x.status.daysLeft ?? 9999 : 10000 + (x.status.kind === 'upcoming' ? x.status.startsIn : 0))
      return left(a) - left(b)
    })
  const finished = withStatus.filter(({ status }) => status.kind === 'finished')

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Tablets size={20} className="text-emerald-500" aria-hidden="true" /> Medicación y tratamientos
        </h3>
        <button onClick={onAdd} aria-label="Agregar tratamiento" className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      {current.length === 0 ? (
        <EmptyHint
          text={finished.length > 0 ? `${petName} no tiene tratamientos en curso.` : `Registrá los remedios de ${petName}: dosis, cada cuántas horas y hasta cuándo.`}
          action="Agregar tratamiento"
          onAction={onAdd}
        />
      ) : (
        <ul className="space-y-3">
          {current.map(({ t, status }) => (
            <li key={t.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-zinc-800/50 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {t.name}
                    {t.dose && <span className="font-medium text-gray-600 dark:text-gray-300"> · {t.dose}</span>}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{frequencyLabel(t.frequencyHours)}</p>
                  {t.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.notes}</p>}
                </div>
                <div className="flex flex-shrink-0">
                  {status.kind === 'active' && (
                    <button onClick={() => onFinish(t)} aria-label={`Finalizar hoy ${t.name}`} title="Finalizar hoy" className={`${iconButton} hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </button>
                  )}
                  <button onClick={() => onEdit(t)} aria-label={`Editar ${t.name}`} className={`${iconButton} hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}>
                    <Edit2 size={16} aria-hidden="true" />
                  </button>
                  <button onClick={() => onDelete(t)} aria-label={`Eliminar ${t.name}`} className={`${iconButton} hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Estado y progreso */}
              {status.kind === 'upcoming' && (
                <p className="mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Empieza {status.startsIn === 1 ? 'mañana' : `en ${status.startsIn} días`} ({formatDay(t.startDate)})
                </p>
              )}
              {status.kind === 'active' && status.totalDays === null && (
                <p className="mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Tratamiento continuo desde el {formatDay(t.startDate)}</p>
              )}
              {status.kind === 'active' && status.totalDays !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    <span>Día {status.day} de {status.totalDays}</span>
                    <span className={status.daysLeft !== null && status.daysLeft <= 1 ? 'text-amber-700 dark:text-amber-400' : ''}>
                      {status.daysLeft === 0 ? 'Termina hoy' : status.daysLeft === 1 ? 'Termina mañana' : `Termina el ${formatDay(t.endDate!)}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Progreso de ${t.name}`}
                    aria-valuemin={0}
                    aria-valuemax={status.totalDays}
                    aria-valuenow={status.day}
                    aria-valuetext={`Día ${status.day} de ${status.totalDays}`}
                    className="h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden"
                  >
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (status.day / status.totalDays) * 100)}%` }} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {finished.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={showFinished}
            onClick={() => setShowFinished((v) => !v)}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            {showFinished ? 'Ocultar tratamientos terminados' : `Ver tratamientos terminados (${finished.length})`}
          </button>
          {showFinished && (
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-zinc-800">
              {finished.map(({ t }) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 group">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.name}{t.dose ? ` · ${t.dose}` : ''}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDay(t.startDate)} al {formatDay(t.endDate!)} · {frequencyLabel(t.frequencyHours)}</p>
                  </div>
                  <div className="flex flex-shrink-0">
                    <button onClick={() => onEdit(t)} aria-label={`Editar ${t.name}`} className={`${iconButton} hover:text-emerald-600`}>
                      <Edit2 size={14} aria-hidden="true" />
                    </button>
                    <button onClick={() => onDelete(t)} aria-label={`Eliminar ${t.name}`} className={`${iconButton} hover:text-red-500`}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
