import { useState } from 'react'
import type React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../../lib/axios'
import { LICENSE_LABEL, PROVINCES, apiMessage, canClinical, canManage } from '../../lib/clinic'
import { Field, card, inputClass, primaryButton } from '../../components/clinic/ui'
import { FilePick } from './ClinicSignup'
import type { ClinicOutlet } from './ClinicShell'

// ==========================================================
// DATOS DE LA CLÍNICA Y MI MATRÍCULA (/clinica/datos)
// ==========================================================
export function ClinicSettings() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const { clinic, role } = membership
  const queryClient = useQueryClient()

  const [f, setF] = useState({ name: clinic.name, address: clinic.address, city: clinic.city, province: clinic.province, phone: clinic.phone, email: clinic.email ?? '' })
  const [logo, setLogo] = useState<File | null>(null)
  const [savingClinic, setSavingClinic] = useState(false)

  const [lic, setLic] = useState({ licenseNumber: membership.licenseNumber ?? '', licenseIssuer: membership.licenseIssuer ?? '' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [savingLicense, setSavingLicense] = useState(false)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  const saveClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingClinic(true)
    const data = new FormData()
    Object.entries(f).forEach(([k, v]) => data.append(k, v))
    if (logo) data.append('logo', logo)
    try {
      await api.put(`/clinics/${clinic.id}`, data)
      await queryClient.invalidateQueries({ queryKey: ['clinics'] })
      toast.success('Datos guardados')
      setLogo(null)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudieron guardar los datos'))
    } finally {
      setSavingClinic(false)
    }
  }

  const saveLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLicense(true)
    const data = new FormData()
    data.append('licenseNumber', lic.licenseNumber)
    data.append('licenseIssuer', lic.licenseIssuer)
    if (photo) data.append('licensePhoto', photo)
    try {
      await api.put(`/clinics/${clinic.id}/me/license`, data)
      await queryClient.invalidateQueries({ queryKey: ['clinics'] })
      toast.success('Matrícula enviada a revisión')
      setPhoto(null)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo enviar la matrícula'))
    } finally {
      setSavingLicense(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {canManage(role) && (
        <form onSubmit={saveClinic} className={`${card} grid gap-4 sm:grid-cols-2`} aria-labelledby="clinic-data-title">
          <h2 id="clinic-data-title" className="font-semibold text-gray-900 dark:text-white sm:col-span-2">Datos de la veterinaria</h2>
          <Field label="Nombre" className="sm:col-span-2">{(id) => <input id={id} required value={f.name} onChange={set('name')} className={inputClass} />}</Field>
          <Field label="Dirección" className="sm:col-span-2">{(id) => <input id={id} required value={f.address} onChange={set('address')} className={inputClass} />}</Field>
          <Field label="Ciudad">{(id) => <input id={id} required value={f.city} onChange={set('city')} className={inputClass} />}</Field>
          <Field label="Provincia">{(id) => <select id={id} value={f.province} onChange={set('province')} className={inputClass}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>}</Field>
          <Field label="Teléfono">{(id) => <input id={id} required type="tel" value={f.phone} onChange={set('phone')} className={inputClass} />}</Field>
          <Field label="Email (opcional)">{(id) => <input id={id} type="email" value={f.email} onChange={set('email')} className={inputClass} />}</Field>
          <Field label="Logo" className="sm:col-span-2">{(id) => <FilePick id={id} file={logo} onChange={setLogo} accept="image/*" placeholder={clinic.logoUrl ? 'Cambiar logo' : 'Subir logo'} />}</Field>
          <div className="sm:col-span-2"><button type="submit" disabled={savingClinic} className={primaryButton}>{savingClinic ? 'Guardando...' : 'Guardar datos'}</button></div>
        </form>
      )}

      {canClinical(role) && (
        <form onSubmit={saveLicense} className={`${card} grid gap-4`} aria-labelledby="license-title">
          <div>
            <h2 id="license-title" className="font-semibold text-gray-900 dark:text-white">Mi matrícula</h2>
            {membership.licenseStatus && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Estado: <strong>{LICENSE_LABEL[membership.licenseStatus]}</strong></p>}
            {membership.licenseStatus === 'REJECTED' && membership.licenseNote && (
              <p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-900/20 dark:text-red-100">Motivo: {membership.licenseNote}</p>
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Si cambiás algo, la matrícula vuelve a quedar en revisión.</p>
          </div>
          <Field label="Número de matrícula">{(id) => <input id={id} required value={lic.licenseNumber} onChange={(e) => setLic((l) => ({ ...l, licenseNumber: e.target.value }))} className={inputClass} />}</Field>
          <Field label="Colegio o provincia que la emite">{(id) => <input id={id} required value={lic.licenseIssuer} onChange={(e) => setLic((l) => ({ ...l, licenseIssuer: e.target.value }))} className={inputClass} />}</Field>
          <Field label="Foto del carnet" hint="Subí una nueva solo si querés reemplazar la que enviaste.">{(id) => <FilePick id={id} file={photo} onChange={setPhoto} accept="image/*" placeholder="Subir foto nueva" />}</Field>
          <div><button type="submit" disabled={savingLicense} className={primaryButton}>{savingLicense ? 'Enviando...' : 'Enviar a revisión'}</button></div>
        </form>
      )}
    </div>
  )
}
