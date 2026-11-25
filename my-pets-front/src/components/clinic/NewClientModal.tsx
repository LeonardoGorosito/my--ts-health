import { useState } from 'react'
import type React from 'react'
import { toast } from 'sonner'
import { Check, KeyRound } from 'lucide-react'
import { api } from '../../lib/axios'
import { apiMessage, ageFrom, fullName } from '../../lib/clinic'
import { breedOrDefault, speciesName } from '../../lib/species'
import { SpeciesIcon } from '../SpeciesIcon'
import { ClientForm } from './forms'
import { Field, Modal, inputClass, primaryButton, secondaryButton } from './ui'

// ==========================================================
// NUEVO CLIENTE: a mano, o con el código de PetHealth del dueño
// (el dueño lo genera en Mi Perfil → "Código para mi veterinaria").
// Con el código se traen sus datos de contacto y las mascotas que se elijan.
// ==========================================================

type Preview = {
  name: string
  lastname: string
  phone: string | null
  email: string
  address: string | null
  pets: { id: string; name: string; species: string; breed: string | null; gender: string | null; birthDate: string | null }[]
  existingClientId: string | null
  importedPetIds: string[]
}

// onSaved(clientId, imported): imported = true si vino con el código (ya trae sus pacientes)
export function NewClientModal({ clinicId, onClose, onSaved }: { clinicId: string; onClose: () => void; onSaved: (clientId: string, imported: boolean) => void }) {
  const [mode, setMode] = useState<'manual' | 'code'>('manual')

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <div role="tablist" aria-label="Cómo cargar el cliente" className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
        {([
          ['manual', 'Cargar a mano'],
          ['code', 'Tiene PetHealth'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === id ? 'bg-white text-emerald-800 shadow-sm dark:bg-zinc-900 dark:text-emerald-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'manual' ? (
        <ClientForm clinicId={clinicId} onCancel={onClose} onSaved={(c) => onSaved(c.id, false)} />
      ) : (
        <CodeImport clinicId={clinicId} onCancel={onClose} onSaved={(id) => onSaved(id, true)} />
      )}
    </Modal>
  )
}

function CodeImport({ clinicId, onCancel, onSaved }: { clinicId: string; onCancel: () => void; onSaved: (clientId: string) => void }) {
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.get<Preview>(`/clinics/${clinicId}/link-code/${encodeURIComponent(code.trim())}`)
      setPreview(data)
      // Preseleccionamos las mascotas que todavía no son pacientes
      setSelected(new Set(data.pets.filter((p) => !data.importedPetIds.includes(p.id)).map((p) => p.id)))
    } catch (err) {
      toast.error(apiMessage(err, 'No encontramos ese código'))
    } finally {
      setBusy(false)
    }
  }

  const importClient = async () => {
    setBusy(true)
    try {
      const { data } = await api.post(`/clinics/${clinicId}/clients/from-code`, { code: code.trim(), petIds: [...selected] })
      toast.success(preview?.existingClientId ? 'Cliente actualizado' : 'Cliente cargado desde PetHealth')
      onSaved(data.clientId)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo importar'))
      setBusy(false)
    }
  }

  if (!preview) {
    return (
      <form onSubmit={lookup}>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Pedile al cliente su código: lo genera en la app, en <strong>Mi Perfil → Código para mi veterinaria</strong>. Vence a los 30 minutos.
        </p>
        <Field label="Código del cliente">
          {(id) => (
            <input
              id={id}
              required
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className={`${inputClass} font-brand text-2xl tracking-[0.3em] uppercase`}
              placeholder="ABC123"
            />
          )}
        </Field>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={secondaryButton}>Cancelar</button>
          <button type="submit" disabled={busy || code.length < 6} className={primaryButton}><KeyRound size={18} aria-hidden="true" /> {busy ? 'Buscando...' : 'Buscar'}</button>
        </div>
      </form>
    )
  }

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div>
      <div className="rounded-2xl bg-gray-50 p-4 text-sm dark:bg-black/20">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{fullName(preview)}</p>
        <p className="text-gray-700 dark:text-gray-300">{[preview.phone, preview.email].filter(Boolean).join(' · ')}</p>
        {preview.address && <p className="text-gray-700 dark:text-gray-300">{preview.address}</p>}
        {preview.existingClientId && <p className="mt-2 font-semibold text-emerald-800 dark:text-emerald-300">Ya es cliente de la clínica: se actualizan sus datos de contacto.</p>}
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Mascotas a cargar como pacientes</legend>
        {preview.pets.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No tiene mascotas cargadas en PetHealth.</p>
        ) : (
          <ul className="space-y-2">
            {preview.pets.map((p) => {
              const imported = preview.importedPetIds.includes(p.id)
              return (
                <li key={p.id}>
                  <label className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${imported ? 'border-gray-200 opacity-70 dark:border-zinc-800' : 'cursor-pointer border-gray-200 hover:border-emerald-500 dark:border-zinc-700'}`}>
                    <input type="checkbox" disabled={imported} checked={imported || selected.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" />
                    <SpeciesIcon species={p.species} size={20} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold text-gray-900 dark:text-white">{p.name}</span>
                      <span className="block truncate text-gray-600 dark:text-gray-400">
                        {[speciesName(p.species, p.gender), breedOrDefault(p.breed, p.species, p.gender), ageFrom(p.birthDate)].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ')}
                      </span>
                    </span>
                    {imported && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Check size={14} aria-hidden="true" /> Ya es paciente</span>}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </fieldset>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => { setPreview(null); setCode('') }} className={secondaryButton}>Otro código</button>
        <button type="button" onClick={importClient} disabled={busy} className={primaryButton}>
          {busy ? 'Cargando...' : selected.size > 0 ? `Cargar cliente y ${selected.size} ${selected.size === 1 ? 'paciente' : 'pacientes'}` : 'Cargar cliente'}
        </button>
      </div>
    </div>
  )
}
