import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, MapPin, Pencil, Phone, Plus, UserPlus } from 'lucide-react'
import { api } from '../../lib/axios'
import { ageFrom, apiMessage, canDelete, fullName } from '../../lib/clinic'
import type { ClinicClient, ClinicPatient } from '../../lib/clinic'
import { breedOrDefault, speciesName } from '../../lib/species'
import { SpeciesIcon } from '../../components/SpeciesIcon'
import { ClientFormModal, PatientFormModal } from '../../components/clinic/forms'
import { NewClientModal } from '../../components/clinic/NewClientModal'
import { card, dangerLink, inputClass, primaryButton, secondaryButton } from '../../components/clinic/ui'
import type { ClinicOutlet } from './ClinicShell'

type ClientRow = ClinicClient & { patients: Pick<ClinicPatient, 'id' | 'name' | 'species' | 'deceasedAt'>[] }

// ---------------------------------------------------------------
// LISTA DE CLIENTES (/clinica/clientes)
// ---------------------------------------------------------------
export function ClinicClients() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const { data, isLoading } = useQuery<ClientRow[]>({
    queryKey: ['clinic', clinicId, 'clients'],
    queryFn: async () => (await api.get(`/clinics/${clinicId}/clients`)).data,
  })

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter((c) =>
      [c.name, c.lastname, c.phone, c.dni, c.email, ...c.patients.map((p) => p.name)].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [data, filter])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="clients-filter" className="sr-only">Filtrar clientes</label>
        <input id="clients-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar por nombre, teléfono o mascota" className={`${inputClass} flex-1`} />
        <button type="button" onClick={() => setCreating(true)} className={primaryButton}>
          <UserPlus size={18} aria-hidden="true" /> Nuevo cliente
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : rows.length === 0 ? (
        <p className={`${card} text-center text-gray-600 dark:text-gray-400`}>{filter ? 'Ningún cliente coincide con el filtro.' : 'Todavía no cargaste clientes.'}</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-600 dark:border-zinc-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Cliente</th>
                <th scope="col" className="px-5 py-3 font-semibold">Teléfono</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pacientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                  <td className="px-5 py-3">
                    <Link to={`/clinica/clientes/${c.id}`} className="font-medium text-gray-900 hover:text-emerald-700 hover:underline dark:text-white dark:hover:text-emerald-400">{c.lastname}, {c.name}</Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-gray-700 dark:text-gray-300">{c.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {c.patients.length === 0 ? '—' : c.patients.map((p) => p.name).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <NewClientModal clinicId={clinicId} onClose={() => setCreating(false)} onSaved={(id, imported) => navigate(`/clinica/clientes/${id}${imported ? '' : '?nuevoPaciente=1'}`)} />}
    </div>
  )
}

// ---------------------------------------------------------------
// FICHA DEL CLIENTE (/clinica/clientes/:clientId)
// ---------------------------------------------------------------
export function ClinicClientDetail() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(false)
  const creatingPatient = params.get('nuevoPaciente') === '1'
  const setCreatingPatient = (v: boolean) => setParams(v ? { nuevoPaciente: '1' } : {}, { replace: true })

  const { data: client, isLoading, refetch } = useQuery<ClinicClient & { patients: ClinicPatient[] }>({
    queryKey: ['clinic', clinicId, 'client', clientId],
    queryFn: async () => (await api.get(`/clinics/${clinicId}/clients/${clientId}`)).data,
  })

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
  if (!client) return <p className="text-gray-600 dark:text-gray-400">No encontramos al cliente. <Link to="/clinica/clientes" className="font-semibold underline">Volver</Link></p>

  const remove = async () => {
    if (!window.confirm(`¿Eliminar a ${fullName(client)} con sus ${client.patients.length} paciente(s) y toda su historia clínica? No se puede deshacer.`)) return
    try {
      await api.delete(`/clinics/${clinicId}/clients/${client.id}`)
      queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] })
      toast.success('Cliente eliminado')
      navigate('/clinica/clientes', { replace: true })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo eliminar'))
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className={card} aria-labelledby="client-name">
        <h2 id="client-name" className="font-brand text-2xl font-bold text-gray-900 dark:text-white">{fullName(client)}</h2>
        {client.dni && <p className="text-sm text-gray-600 dark:text-gray-400">DNI {client.dni}</p>}
        <ul className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
          {client.phone && (
            <li className="flex items-center gap-2">
              <Phone size={16} aria-hidden="true" className="text-gray-500" />
              <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
              <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400">WhatsApp</a>
            </li>
          )}
          {client.email && <li className="flex items-center gap-2"><Mail size={16} aria-hidden="true" className="text-gray-500" /><a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a></li>}
          {client.address && <li className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" className="text-gray-500" />{client.address}</li>}
        </ul>
        {client.notes && <p className="mt-4 whitespace-pre-line rounded-xl bg-gray-50 p-3 text-sm text-gray-700 dark:bg-black/20 dark:text-gray-300">{client.notes}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setEditing(true)} className={secondaryButton}><Pencil size={16} aria-hidden="true" /> Editar</button>
          {canDelete(membership.role) && <button type="button" onClick={remove} className={dangerLink}>Eliminar cliente</button>}
        </div>
      </section>

      <section aria-labelledby="client-patients">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="client-patients" className="font-semibold text-gray-900 dark:text-white">Pacientes</h2>
          <button type="button" onClick={() => setCreatingPatient(true)} className={primaryButton}><Plus size={18} aria-hidden="true" /> Nuevo paciente</button>
        </div>
        {client.patients.length === 0 ? (
          <p className={`${card} text-center text-gray-600 dark:text-gray-400`}>Este cliente todavía no tiene pacientes.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {client.patients.map((p) => (
              <li key={p.id}>
                <Link to={`/clinica/pacientes/${p.id}`} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-600">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <SpeciesIcon species={p.species} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-900 dark:text-white">{p.name}{p.deceasedAt && <span className="ml-2 text-xs font-normal text-gray-500">(falleció)</span>}</span>
                    <span className="block truncate text-sm text-gray-600 dark:text-gray-400">
                      {[speciesName(p.species, p.sex), breedOrDefault(p.breed, p.species, p.sex), ageFrom(p.birthDate)].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && <ClientFormModal clinicId={clinicId} client={client} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refetch() }} />}
      {creatingPatient && (
        <PatientFormModal clinicId={clinicId} clientId={client.id} onClose={() => setCreatingPatient(false)} onSaved={(p) => navigate(`/clinica/pacientes/${p.id}`)} />
      )}
    </div>
  )
}
