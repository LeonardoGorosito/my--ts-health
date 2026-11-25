import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { api } from '../../lib/axios'
import { RECORD_TYPE_LABEL, fullName } from '../../lib/clinic'
import type { ClinicClient, ClinicPatient, RecordType } from '../../lib/clinic'
import { formatDay } from '../../lib/dates'
import { speciesName } from '../../lib/species'
import { SpeciesIcon } from '../../components/SpeciesIcon'
import { NewClientModal } from '../../components/clinic/NewClientModal'
import { card, inputClass, primaryButton } from '../../components/clinic/ui'
import type { ClinicOutlet } from './ClinicShell'

type Home = {
  counts: { patients: number; clients: number }
  recentPatients: { date: string; reason: string; type: RecordType; patient: { id: string; name: string; species: string; sex: string | null; client: { name: string; lastname: string } } }[]
}
type SearchResult = { patients: (ClinicPatient & { client: Pick<ClinicClient, 'id' | 'name' | 'lastname' | 'phone'> })[]; clients: ClinicClient[] }

// Inicio de la clínica: buscador, números y últimos pacientes atendidos
export function ClinicHome() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [newClient, setNewClient] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const home = useQuery<Home>({ queryKey: ['clinic', clinicId, 'home'], queryFn: async () => (await api.get(`/clinics/${clinicId}/home`)).data })
  const search = useQuery<SearchResult>({
    queryKey: ['clinic', clinicId, 'search', debounced],
    queryFn: async () => (await api.get(`/clinics/${clinicId}/search`, { params: { q: debounced } })).data,
    enabled: debounced.length >= 2,
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <label htmlFor="clinic-search" className="sr-only">Buscar paciente o cliente</label>
          <input
            id="clinic-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por paciente, dueño, teléfono, DNI o microchip"
            className={`${inputClass} py-3 pl-10`}
            autoFocus
          />
        </div>
        <button type="button" onClick={() => setNewClient(true)} className={primaryButton}>
          <UserPlus size={18} aria-hidden="true" /> Nuevo cliente
        </button>
      </div>

      {debounced.length >= 2 ? (
        <section aria-label="Resultados de búsqueda" className={card}>
          {search.isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Buscando...</p>
          ) : search.data && (search.data.patients.length > 0 || search.data.clients.length > 0) ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Pacientes</h2>
                {search.data.patients.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">Ninguno</p> : (
                  <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {search.data.patients.map((p) => (
                      <li key={p.id}>
                        <Link to={`/clinica/pacientes/${p.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <SpeciesIcon species={p.species} size={20} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-900 dark:text-white">{p.name}{p.deceasedAt && <span className="ml-2 text-xs text-gray-500">(falleció)</span>}</span>
                            <span className="block truncate text-sm text-gray-600 dark:text-gray-400">{speciesName(p.species, p.sex)} · {fullName(p.client)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Clientes</h2>
                {search.data.clients.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">Ninguno</p> : (
                  <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {search.data.clients.map((c) => (
                      <li key={c.id}>
                        <Link to={`/clinica/clientes/${c.id}`} className="block rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <span className="block font-medium text-gray-900 dark:text-white">{fullName(c)}</span>
                          <span className="block text-sm text-gray-600 dark:text-gray-400">{[c.phone, c.dni && `DNI ${c.dni}`].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No encontramos nada con “{debounced}”.{' '}
              <button type="button" onClick={() => setNewClient(true)} className="font-semibold text-emerald-700 underline dark:text-emerald-400">Crear un cliente nuevo</button>
            </p>
          )}
        </section>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className={card}>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Pacientes</dt>
              <dd className="mt-1 font-brand text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{home.data?.counts.patients ?? '—'}</dd>
            </div>
            <div className={card}>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Clientes</dt>
              <dd className="mt-1 font-brand text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{home.data?.counts.clients ?? '—'}</dd>
            </div>
          </dl>

          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className="mb-3 font-semibold text-gray-900 dark:text-white">Últimos pacientes atendidos</h2>
            {home.isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : !home.data?.recentPatients.length ? (
              <div className={`${card} text-center`}>
                <p className="text-gray-700 dark:text-gray-300">Todavía no hay consultas cargadas.</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Empezá creando un cliente y su paciente: después cargás la consulta desde la ficha.</p>
                <button type="button" onClick={() => setNewClient(true)} className={`${primaryButton} mt-4`}>
                  <UserPlus size={18} aria-hidden="true" /> Crear el primer cliente
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {home.data.recentPatients.map((r) => (
                  <li key={r.patient.id}>
                    <Link to={`/clinica/pacientes/${r.patient.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                      <SpeciesIcon species={r.patient.species} size={22} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-gray-900 dark:text-white">{r.patient.name} <span className="font-normal text-gray-600 dark:text-gray-400">· {fullName(r.patient.client)}</span></span>
                        <span className="block truncate text-sm text-gray-600 dark:text-gray-400">{RECORD_TYPE_LABEL[r.type]}: {r.reason}</span>
                      </span>
                      <span className="flex-shrink-0 text-sm tabular-nums text-gray-500 dark:text-gray-400">{formatDay(r.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {newClient && (
        <NewClientModal
          clinicId={clinicId}
          onClose={() => setNewClient(false)}
          onSaved={(id, imported) => navigate(`/clinica/clientes/${id}${imported ? '' : '?nuevoPaciente=1'}`)}
        />
      )}
    </div>
  )
}
