import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BadgeCheck } from 'lucide-react'
import { api } from '../lib/axios'
import { ROLE_LABEL, apiMessage } from '../lib/clinic'
import type { ClinicRole, LicenseStatus } from '../lib/clinic'

type LicenseRow = {
  id: string
  role: ClinicRole
  createdAt: string
  licenseNumber: string
  licenseIssuer: string
  licenseStatus: LicenseStatus
  licenseNote: string | null
  photoUrl: string | null
  user: { name: string; lastname: string; email: string }
  clinic: { name: string; city: string; province: string; phone: string }
}

// Revisión manual de matrículas de veterinarios (solo ADMIN)
export function AdminLicenses() {
  const [status, setStatus] = useState<LicenseStatus>('PENDING')
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<LicenseRow[]>({
    queryKey: ['admin', 'licenses', status],
    queryFn: async () => (await api.get('/admin/licenses', { params: { status } })).data,
  })

  const review = async (row: LicenseRow, next: 'APPROVED' | 'REJECTED') => {
    let note: string | undefined
    if (next === 'REJECTED') {
      const answer = window.prompt('Motivo del rechazo (lo va a ver el veterinario):')
      if (!answer?.trim()) return
      note = answer.trim()
    }
    try {
      await api.put(`/admin/licenses/${row.id}`, { status: next, note })
      toast.success(next === 'APPROVED' ? 'Matrícula aprobada' : 'Matrícula rechazada')
      queryClient.invalidateQueries({ queryKey: ['admin', 'licenses'] })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo guardar'))
    }
  }

  return (
    <section aria-labelledby="licenses-title" className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="licenses-title" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <BadgeCheck size={20} aria-hidden="true" className="text-emerald-600" /> Matrículas de veterinarios
        </h2>
        <div role="group" aria-label="Estado" className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
          {(['PENDING', 'APPROVED', 'REJECTED'] as LicenseStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === s ? 'bg-white text-emerald-800 shadow-sm dark:bg-zinc-900 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {s === 'PENDING' ? 'Pendientes' : s === 'APPROVED' ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-500">Cargando...</p>
      ) : !data?.length ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No hay matrículas en este estado.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-zinc-800">
          {data.map((row) => (
            <li key={row.id} className="flex flex-col gap-4 py-4 sm:flex-row">
              {row.photoUrl ? (
                <a href={row.photoUrl} target="_blank" rel="noreferrer" className="flex-shrink-0">
                  <img src={row.photoUrl} alt={`Carnet de matrícula de ${row.user.name} ${row.user.lastname}`} className="h-28 w-44 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-zinc-700" />
                </a>
              ) : (
                <div className="flex h-28 w-44 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500 dark:bg-zinc-800">Sin foto</div>
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">{row.user.name} {row.user.lastname} <span className="font-normal text-gray-600 dark:text-gray-400">· {row.user.email}</span></p>
                <p className="text-gray-800 dark:text-gray-200">Matrícula <strong>{row.licenseNumber}</strong> · {row.licenseIssuer}</p>
                <p className="text-gray-600 dark:text-gray-400">{ROLE_LABEL[row.role]} en {row.clinic.name} ({row.clinic.city}, {row.clinic.province}) · {row.clinic.phone}</p>
                <p className="text-gray-500 dark:text-gray-400">Enviada el {new Date(row.createdAt).toLocaleDateString('es-AR')}</p>
                {row.licenseNote && <p className="mt-1 text-red-700 dark:text-red-400">Motivo del rechazo: {row.licenseNote}</p>}
                <div className="mt-3 flex gap-2">
                  {row.licenseStatus !== 'APPROVED' && (
                    <button type="button" onClick={() => review(row, 'APPROVED')} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Aprobar</button>
                  )}
                  {row.licenseStatus !== 'REJECTED' && (
                    <button type="button" onClick={() => review(row, 'REJECTED')} className="rounded-xl px-4 py-2 font-semibold text-red-700 ring-1 ring-red-300 hover:bg-red-50 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-900/20">Rechazar</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
