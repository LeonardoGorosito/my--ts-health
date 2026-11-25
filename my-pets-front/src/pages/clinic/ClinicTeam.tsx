import { useEffect, useState } from 'react'
import type React from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Copy, Link2, Trash2 } from 'lucide-react'
import { api } from '../../lib/axios'
import { useAuth } from '../../context/AuthContext'
import { LICENSE_LABEL, ROLE_LABEL, apiMessage, canManage } from '../../lib/clinic'
import type { ClinicRole, LicenseStatus } from '../../lib/clinic'
import { Loader } from '../../components/Loader'
import { AuthTopBar } from '../../components/AuthTopBar'
import { Field, card, dangerLink, inputClass, primaryButton, secondaryButton } from '../../components/clinic/ui'
import { FilePick } from './ClinicSignup'
import type { ClinicOutlet } from './ClinicShell'

type Team = {
  members: { id: string; role: ClinicRole; user: { name: string; lastname: string; email: string }; licenseNumber: string | null; licenseIssuer: string | null; licenseStatus: LicenseStatus | null }[]
  invites: { id: string; role: ClinicRole; token: string; expiresAt: string }[]
}

const inviteUrl = (token: string) => `${window.location.origin}/clinica/invitacion/${token}`

// ---------------------------------------------------------------
// EQUIPO (/clinica/equipo)
// ---------------------------------------------------------------
export function ClinicTeam() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const owner = canManage(membership.role)
  const queryClient = useQueryClient()
  const key = ['clinic', clinicId, 'team']
  const { data, isLoading } = useQuery<Team>({ queryKey: key, queryFn: async () => (await api.get(`/clinics/${clinicId}/team`)).data })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })

  const invite = async (role: 'VET' | 'STAFF') => {
    try {
      const res = await api.post(`/clinics/${clinicId}/invites`, { role })
      await refresh()
      try { await navigator.clipboard.writeText(inviteUrl(res.data.token)); toast.success('Invitación creada y copiada') } catch { toast.success('Invitación creada') }
    } catch (err) { toast.error(apiMessage(err, 'No se pudo crear la invitación')) }
  }
  const revoke = async (id: string) => {
    try { await api.delete(`/clinics/${clinicId}/invites/${id}`); refresh() } catch (err) { toast.error(apiMessage(err, 'No se pudo revocar')) }
  }
  const removeMember = async (id: string, name: string) => {
    if (!window.confirm(`¿Quitar a ${name} del equipo? Deja de ver los pacientes de la clínica.`)) return
    try { await api.delete(`/clinics/${clinicId}/members/${id}`); refresh() } catch (err) { toast.error(apiMessage(err, 'No se pudo quitar')) }
  }

  if (isLoading || !data) return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className={card} aria-labelledby="team-title">
        <h2 id="team-title" className="mb-4 font-semibold text-gray-900 dark:text-white">Equipo</h2>
        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
          {data.members.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">{m.user.name} {m.user.lastname}</p>
                <p className="truncate text-gray-600 dark:text-gray-400">{m.user.email}</p>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {ROLE_LABEL[m.role]}
                  {m.licenseNumber && <> · {m.licenseNumber} ({m.licenseIssuer})</>}
                  {m.licenseStatus && <span className={`ml-2 text-xs font-semibold ${m.licenseStatus === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' : m.licenseStatus === 'PENDING' ? 'text-amber-800 dark:text-amber-300' : 'text-red-700 dark:text-red-400'}`}>{LICENSE_LABEL[m.licenseStatus]}</span>}
                </p>
              </div>
              {owner && m.role !== 'OWNER' && (
                <button type="button" onClick={() => removeMember(m.id, m.user.name)} aria-label={`Quitar a ${m.user.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {owner && (
        <section className={card} aria-labelledby="invite-title">
          <h2 id="invite-title" className="font-semibold text-gray-900 dark:text-white">Invitar al equipo</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Creá un link y mandáselo. Vence a los 7 días y sirve para una sola persona. Los veterinarios cargan su matrícula al aceptar.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => invite('VET')} className={primaryButton}><Link2 size={18} aria-hidden="true" /> Invitar veterinario/a</button>
            <button type="button" onClick={() => invite('STAFF')} className={secondaryButton}><Link2 size={18} aria-hidden="true" /> Invitar recepción</button>
          </div>
          {data.invites.length > 0 && (
            <ul className="mt-5 space-y-2">
              {data.invites.map((i) => (
                <li key={i.id} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm ring-1 ring-gray-100 dark:bg-black/20 dark:ring-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">{ROLE_LABEL[i.role]}</strong> · vence el {new Date(i.expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
                    <button type="button" onClick={() => revoke(i.id)} className={dangerLink}>Revocar</button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={async () => { await navigator.clipboard.writeText(inviteUrl(i.token)); toast.success('Link copiado') }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-100 dark:ring-zinc-700">
                      <Copy size={15} aria-hidden="true" /> Copiar
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Te invito al equipo de ${membership.clinic.name} en PetHealth: ${inviteUrl(i.token)}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 font-semibold text-[#073b1d] hover:bg-[#1fbd5a]">
                      WhatsApp
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// ACEPTAR INVITACIÓN AL EQUIPO (/clinica/invitacion/:token)
// ---------------------------------------------------------------
type InviteInfo = { role: ClinicRole; clinic: { name: string; city: string; logoUrl: string | null }; expiresAt: string }

export function ClinicInviteAccept() {
  const { token } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [license, setLicense] = useState({ licenseNumber: '', licenseIssuer: '' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/clinics/invites/${token}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setError((isAxiosError(e) && e.response?.data?.message) || 'No pudimos abrir la invitación.'))
  }, [token])

  if (loading || (!info && !error)) return <Loader text="Abriendo la invitación..." />

  const next = encodeURIComponent(`/clinica/invitacion/${token}`)
  const vet = info?.role === 'VET'

  const accept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (vet && !photo) return toast.error('Subí una foto de tu carnet de matrícula')
    setSaving(true)
    const data = new FormData()
    if (vet) {
      data.append('licenseNumber', license.licenseNumber)
      data.append('licenseIssuer', license.licenseIssuer)
      data.append('licensePhoto', photo!)
    }
    try {
      await api.post(`/clinics/invites/${token}/accept`, data)
      await queryClient.invalidateQueries({ queryKey: ['clinics'] })
      toast.success(`Ya sos parte de ${info?.clinic.name}`)
      navigate('/clinica', { replace: true })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo aceptar la invitación'))
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AuthTopBar />
      <main className="mx-auto max-w-md px-6 py-12">
        {error || !info ? (
          <div className="text-center">
            <h1 className="font-brand text-2xl font-bold text-gray-900 dark:text-white">La invitación no está disponible</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <Link to={user ? '/app' : '/'} className="mt-6 inline-block font-semibold text-emerald-700 underline dark:text-emerald-400">Volver</Link>
          </div>
        ) : (
          <>
            <h1 className="text-center font-brand text-3xl font-bold text-gray-900 text-balance dark:text-white">Te invitaron al equipo de {info.clinic.name}</h1>
            <p className="mt-3 text-center text-gray-600 dark:text-gray-400">
              Vas a sumarte como <strong>{ROLE_LABEL[info.role].toLowerCase()}</strong> en {info.clinic.city}.
            </p>
            {!user ? (
              <div className="mt-8 flex flex-col gap-3">
                <Link to={`/register?next=${next}`} className={`${primaryButton} py-3.5`}>Crear cuenta</Link>
                <Link to={`/login?next=${next}`} className={`${secondaryButton} py-3.5`}>Ya tengo cuenta</Link>
              </div>
            ) : (
              <form onSubmit={accept} className="mt-8 space-y-4">
                {vet && (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Cargá tu matrícula: la revisamos a mano antes de habilitar recetas y certificados.</p>
                    <Field label="Número de matrícula">{(id) => <input id={id} required value={license.licenseNumber} onChange={(e) => setLicense((l) => ({ ...l, licenseNumber: e.target.value }))} className={inputClass} />}</Field>
                    <Field label="Colegio o provincia que la emite">{(id) => <input id={id} required value={license.licenseIssuer} onChange={(e) => setLicense((l) => ({ ...l, licenseIssuer: e.target.value }))} className={inputClass} />}</Field>
                    <Field label="Foto del carnet de matrícula">{(id) => <FilePick id={id} file={photo} onChange={setPhoto} accept="image/*" placeholder="Subir foto" />}</Field>
                  </>
                )}
                <button type="submit" disabled={saving} className={`${primaryButton} w-full py-3.5`}>{saving ? 'Aceptando...' : 'Aceptar invitación'}</button>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">Vas a aceptar como {user.email}</p>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  )
}
