import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Check, Copy, Link2, Stethoscope, Trash2, Users, X } from 'lucide-react'
import { api } from '../lib/axios'

// ==========================================================
// COMPARTIR MASCOTA (solo el dueño)
// - Familia: link de invitación de un solo uso. Quien lo acepta ve y carga registros.
// - Veterinario: link de solo lectura de la ficha, sin cuenta.
// Los dos vencen a los 7 días y se pueden revocar.
// ==========================================================

type ShareLink = { id: string; kind: 'FAMILY' | 'VET'; token: string; createdAt: string; expiresAt: string }
type Member = { id: string; createdAt: string; user: { name: string; lastname: string; email: string } }
type ShareState = { members: Member[]; invites: ShareLink[]; vetLinks: ShareLink[] }

const linkUrl = (l: ShareLink) => `${window.location.origin}/${l.kind === 'VET' ? 'vet' : 'invitacion'}/${l.token}`
const until = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
const errorMessage = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback

interface Props {
  isOpen: boolean
  onClose: () => void
  petId: string
  petName: string
}

export function ShareModal({ isOpen, onClose, petId, petName }: Props) {
  const [state, setState] = useState<ShareState | null>(null)
  const [creating, setCreating] = useState<'FAMILY' | 'VET' | null>(null)

  const load = async () => {
    try {
      const res = await api.get(`/shares/pet/${petId}`)
      setState(res.data)
    } catch (e) {
      toast.error(errorMessage(e, 'No pudimos cargar con quién compartís'))
    }
  }

  useEffect(() => {
    if (isOpen) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, petId])

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const createLink = async (kind: 'FAMILY' | 'VET') => {
    setCreating(kind)
    try {
      const res = await api.post(`/shares/pet/${petId}/links`, { kind })
      await load()
      await copy(res.data as ShareLink, true)
    } catch (e) {
      if (!isAxiosError(e) || e.response?.status !== 402) toast.error(errorMessage(e, 'No se pudo crear el link'))
    } finally {
      setCreating(null)
    }
  }

  const copy = async (l: ShareLink, justCreated = false) => {
    try {
      await navigator.clipboard.writeText(linkUrl(l))
      toast.success(justCreated ? 'Link creado y copiado' : 'Link copiado')
    } catch {
      toast.message('Link creado. Copialo desde la lista.')
    }
  }

  const revoke = async (l: ShareLink) => {
    if (!window.confirm('¿Revocar este link? Quien lo tenga ya no va a poder usarlo.')) return
    try {
      await api.delete(`/shares/links/${l.id}`)
      toast.success('Link revocado')
      load()
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo revocar'))
    }
  }

  const removeMember = async (m: Member) => {
    if (!window.confirm(`¿Quitarle el acceso a ${m.user.name}? Deja de ver a ${petName}.`)) return
    try {
      await api.delete(`/shares/members/${m.id}`)
      toast.success('Acceso quitado')
      load()
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo quitar el acceso'))
    }
  }

  const whatsappText = (l: ShareLink) =>
    l.kind === 'VET'
      ? `Hola, te comparto la ficha de salud de ${petName}: ${linkUrl(l)}`
      : `Te invito a cuidar a ${petName} en PetHealth: ${linkUrl(l)}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="font-brand text-2xl font-bold text-gray-900 dark:text-white">Compartir a {petName}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Los links vencen a los 7 días. Mandalos por WhatsApp o copialos.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {!state ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : (
          <>
            {/* FAMILIA */}
            <section aria-labelledby="share-family" className="mt-7">
              <h3 id="share-family" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Users size={18} aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" /> Familia
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Ven la ficha y cargan vacunas, peso, tratamientos y consultas. No pueden borrar a {petName} ni compartirla.
              </p>

              {state.members.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {state.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 dark:text-white">{m.user.name} {m.user.lastname}</p>
                        <p className="truncate text-sm text-gray-600 dark:text-gray-400">{m.user.email}</p>
                      </div>
                      <button type="button" onClick={() => removeMember(m)} aria-label={`Quitar el acceso de ${m.user.name}`} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <LinkList links={state.invites} label="Invitación pendiente" whatsappText={whatsappText} onCopy={copy} onRevoke={revoke} />

              <button type="button" onClick={() => createLink('FAMILY')} disabled={creating !== null} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">
                <Link2 size={18} aria-hidden="true" /> {creating === 'FAMILY' ? 'Creando...' : 'Crear link de invitación'}
              </button>
            </section>

            {/* VETERINARIO */}
            <section aria-labelledby="share-vet" className="mt-8 border-t border-gray-100 pt-6 dark:border-zinc-800">
              <h3 id="share-vet" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Stethoscope size={18} aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" /> Veterinario
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Ve la ficha de salud completa sin crear una cuenta, y no puede cambiar nada. Incluye tu nombre, teléfono y email.
              </p>

              <LinkList links={state.vetLinks} label="Link activo" whatsappText={whatsappText} onCopy={copy} onRevoke={revoke} />

              <button type="button" onClick={() => createLink('VET')} disabled={creating !== null} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-300 dark:hover:bg-emerald-900/20">
                <Link2 size={18} aria-hidden="true" /> {creating === 'VET' ? 'Creando...' : 'Crear link para el veterinario'}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function LinkList({ links, label, whatsappText, onCopy, onRevoke }: {
  links: ShareLink[]
  label: string
  whatsappText: (l: ShareLink) => string
  onCopy: (l: ShareLink) => void
  onRevoke: (l: ShareLink) => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  if (links.length === 0) return null
  return (
    <ul className="mt-3 space-y-2">
      {links.map((l) => (
        <li key={l.id} className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100 dark:bg-black/20 dark:ring-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">{label}</span> · vence el {until(l.expiresAt)}
            </p>
            <button type="button" onClick={() => onRevoke(l)} className="text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
              Revocar
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => { onCopy(l); setCopiedId(l.id); setTimeout(() => setCopiedId(null), 2000) }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-800 ring-1 ring-gray-200 transition-colors hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-100 dark:ring-zinc-700 dark:hover:bg-zinc-700"
            >
              {copiedId === l.id ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copiedId === l.id ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText(l))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-[#073b1d] transition-colors hover:bg-[#1fbd5a]"
            >
              WhatsApp
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}
