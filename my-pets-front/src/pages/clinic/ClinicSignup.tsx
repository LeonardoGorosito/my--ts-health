import { useState } from 'react'
import type React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BadgeCheck, Building2, Upload } from 'lucide-react'
import { api } from '../../lib/axios'
import { apiMessage, PROVINCES, useMyClinics } from '../../lib/clinic'
import { Loader } from '../../components/Loader'
import { Field, card, inputClass, primaryButton } from '../../components/clinic/ui'

// ==========================================================
// REGISTRAR UNA VETERINARIA (/veterinarias/registro)
// Datos de la clínica + matrícula de quien la registra (con foto del carnet).
// La matrícula queda "en revisión" hasta que un administrador la aprueba.
// ==========================================================

type Form = {
  name: string; address: string; city: string; province: string; phone: string; email: string
  licenseNumber: string; licenseIssuer: string
}

const empty: Form = { name: '', address: '', city: '', province: 'Santa Fe', phone: '', email: '', licenseNumber: '', licenseIssuer: '' }

export function ClinicSignup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: clinics, isLoading } = useMyClinics()
  const [form, setForm] = useState<Form>(empty)
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)

  if (isLoading) return <Loader text="Cargando..." />
  if (clinics?.some((c) => c.role === 'OWNER')) return <Navigate to="/clinica" replace />

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!licensePhoto) return toast.error('Subí una foto de tu carnet de matrícula')
    if (!accepted) return toast.error('Tenés que aceptar los términos para veterinarias')
    setSaving(true)
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    data.append('licensePhoto', licensePhoto)
    if (logo) data.append('logo', logo)
    try {
      await api.post('/clinics', data)
      await queryClient.invalidateQueries({ queryKey: ['clinics'] })
      toast.success('¡Veterinaria registrada! Ya podés empezar a cargar pacientes.')
      navigate('/clinica', { replace: true })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo registrar la veterinaria'))
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-brand text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Registrá tu veterinaria</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          Llevá la historia clínica de tus pacientes, sus vacunas y estudios, y sumá a tu equipo. Los primeros 30 días son gratis.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <section className={card} aria-labelledby="clinic-data">
          <h2 id="clinic-data" className="mb-5 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Building2 size={18} aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" /> La veterinaria
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" className="sm:col-span-2">{(id) => <input id={id} required value={form.name} onChange={set('name')} className={inputClass} placeholder="Veterinaria San Roque" />}</Field>
            <Field label="Dirección" className="sm:col-span-2">{(id) => <input id={id} required value={form.address} onChange={set('address')} className={inputClass} autoComplete="street-address" />}</Field>
            <Field label="Ciudad">{(id) => <input id={id} required value={form.city} onChange={set('city')} className={inputClass} autoComplete="address-level2" />}</Field>
            <Field label="Provincia">
              {(id) => (
                <select id={id} value={form.province} onChange={set('province')} className={inputClass}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              )}
            </Field>
            <Field label="Teléfono">{(id) => <input id={id} required type="tel" value={form.phone} onChange={set('phone')} className={inputClass} autoComplete="tel" />}</Field>
            <Field label="Email de la clínica (opcional)">{(id) => <input id={id} type="email" value={form.email} onChange={set('email')} className={inputClass} />}</Field>
            <Field label="Logo (opcional)" hint="Aparece en las recetas y certificados." className="sm:col-span-2">
              {(id) => <FilePick id={id} file={logo} onChange={setLogo} accept="image/*" placeholder="Elegir imagen" />}
            </Field>
          </div>
        </section>

        <section className={card} aria-labelledby="license-data">
          <h2 id="license-data" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <BadgeCheck size={18} aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" /> Tu matrícula profesional
          </h2>
          <p className="mb-5 mt-1 text-sm text-gray-600 dark:text-gray-400">
            La revisamos a mano antes de habilitar recetas y certificados. Mientras tanto ya podés usar todo lo demás. La foto del carnet solo la ve quien revisa.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Número de matrícula">{(id) => <input id={id} required value={form.licenseNumber} onChange={set('licenseNumber')} className={inputClass} placeholder="Ej: MP 1234" />}</Field>
            <Field label="Colegio o provincia que la emite">{(id) => <input id={id} required value={form.licenseIssuer} onChange={set('licenseIssuer')} className={inputClass} placeholder="Ej: Colegio de Veterinarios de Santa Fe" />}</Field>
            <Field label="Foto del carnet de matrícula" hint="Frente del carnet, que se lean el nombre y el número." className="sm:col-span-2">
              {(id) => <FilePick id={id} file={licensePhoto} onChange={setLicensePhoto} accept="image/*" placeholder="Subir foto" />}
            </Field>
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Declaro que los datos de mi matrícula son verdaderos y acepto los{' '}
            <Link to="/terminos#veterinarias" target="_blank" rel="noopener" className="font-semibold text-emerald-700 underline dark:text-emerald-400">términos para veterinarias</Link>
            , incluido el tratamiento de los datos de mis clientes.
          </span>
        </label>

        <button type="submit" disabled={saving} className={`${primaryButton} w-full py-3.5 text-base sm:w-auto`}>
          {saving ? 'Registrando...' : 'Registrar veterinaria'}
        </button>
      </form>
    </div>
  )
}

// Selector de archivo con nombre visible
export function FilePick({ id, file, onChange, accept, placeholder }: { id: string; file: File | null; onChange: (f: File | null) => void; accept: string; placeholder: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50/50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-emerald-900/10">
      <Upload size={18} aria-hidden="true" className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="truncate">{file ? file.name : placeholder}</span>
      <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  )
}
