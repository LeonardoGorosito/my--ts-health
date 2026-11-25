import { useState } from 'react'
import type React from 'react'
import { toast } from 'sonner'
import { api } from '../../lib/axios'
import { apiMessage } from '../../lib/clinic'
import type { ClinicClient, ClinicPatient, Preventive } from '../../lib/clinic'
import { todayInput } from '../../lib/dates'
import { SPECIES, SPECIES_ORDER } from '../../lib/species'
import type { Species } from '../../lib/species'
import { Field, Modal, inputClass, primaryButton, secondaryButton } from './ui'

// Fecha guardada (ISO a medianoche UTC) -> valor de <input type="date">
const toInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '')

function FormActions({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className={secondaryButton}>Cancelar</button>
      <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Guardando...' : label}</button>
    </div>
  )
}

// ---------------------------------------------------------------
// CLIENTE (dueño del paciente)
// ---------------------------------------------------------------
export function ClientFormModal({ clinicId, client, onClose, onSaved }: {
  clinicId: string
  client?: ClinicClient | null
  onClose: () => void
  onSaved: (c: ClinicClient) => void
}) {
  return (
    <Modal title={client ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <ClientForm clinicId={clinicId} client={client} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  )
}

// Formulario de datos del cliente (sin modal: lo usan "Editar cliente" y "Nuevo cliente")
export function ClientForm({ clinicId, client, onCancel, onSaved }: {
  clinicId: string
  client?: ClinicClient | null
  onCancel: () => void
  onSaved: (c: ClinicClient) => void
}) {
  const [f, setF] = useState({
    name: client?.name ?? '', lastname: client?.lastname ?? '', dni: client?.dni ?? '', phone: client?.phone ?? '',
    email: client?.email ?? '', address: client?.address ?? '', notes: client?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = client
        ? await api.put(`/clinics/${clinicId}/clients/${client.id}`, f)
        : await api.post(`/clinics/${clinicId}/clients`, f)
      toast.success(client ? 'Cliente actualizado' : 'Cliente creado')
      onSaved(res.data)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo guardar el cliente'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre">{(id) => <input id={id} required value={f.name} onChange={set('name')} className={inputClass} autoFocus />}</Field>
      <Field label="Apellido">{(id) => <input id={id} required value={f.lastname} onChange={set('lastname')} className={inputClass} />}</Field>
      <Field label="Teléfono">{(id) => <input id={id} type="tel" value={f.phone} onChange={set('phone')} className={inputClass} />}</Field>
      <Field label="DNI (opcional)">{(id) => <input id={id} inputMode="numeric" value={f.dni} onChange={set('dni')} className={inputClass} />}</Field>
      <Field label="Email (opcional)" className="sm:col-span-2">{(id) => <input id={id} type="email" value={f.email} onChange={set('email')} className={inputClass} />}</Field>
      <Field label="Dirección (opcional)" className="sm:col-span-2">{(id) => <input id={id} value={f.address} onChange={set('address')} className={inputClass} />}</Field>
      <Field label="Notas (opcional)" className="sm:col-span-2">{(id) => <textarea id={id} rows={2} value={f.notes} onChange={set('notes')} className={inputClass} />}</Field>
      <div className="sm:col-span-2"><FormActions saving={saving} onCancel={onCancel} label={client ? 'Guardar' : 'Crear cliente'} /></div>
    </form>
  )
}

// ---------------------------------------------------------------
// PACIENTE
// ---------------------------------------------------------------
export function PatientFormModal({ clinicId, clientId, patient, onClose, onSaved }: {
  clinicId: string
  clientId: string
  patient?: ClinicPatient | null
  onClose: () => void
  onSaved: (p: ClinicPatient) => void
}) {
  const [f, setF] = useState({
    name: patient?.name ?? '',
    species: (patient?.species ?? 'DOG') as Species,
    breed: patient?.breed ?? '',
    sex: patient?.sex ?? '',
    birthDate: toInput(patient?.birthDate),
    coat: patient?.coat ?? '',
    microchip: patient?.microchip ?? '',
    isCastrated: patient?.isCastrated ?? false,
    weightKg: patient?.weightKg?.toString() ?? '',
    alerts: patient?.alerts ?? '',
    deceased: !!patient?.deceasedAt,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...f, clientId, sex: f.sex || null, weightKg: f.weightKg || null }
    try {
      const res = patient
        ? await api.put(`/clinics/${clinicId}/patients/${patient.id}`, body)
        : await api.post(`/clinics/${clinicId}/patients`, body)
      toast.success(patient ? 'Paciente actualizado' : 'Paciente creado')
      onSaved(res.data)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo guardar el paciente'))
      setSaving(false)
    }
  }

  return (
    <Modal title={patient ? 'Editar paciente' : 'Nuevo paciente'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">{(id) => <input id={id} required value={f.name} onChange={set('name')} className={inputClass} autoFocus />}</Field>
        <Field label="Especie">
          {(id) => (
            <select id={id} value={f.species} onChange={set('species')} className={inputClass}>
              {SPECIES_ORDER.map((s) => <option key={s} value={s}>{SPECIES[s].label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Raza o tipo">{(id) => <input id={id} value={f.breed} onChange={set('breed')} className={inputClass} placeholder={SPECIES[f.species].breedHint} />}</Field>
        <Field label="Sexo">
          {(id) => (
            <select id={id} value={f.sex} onChange={set('sex')} className={inputClass}>
              <option value="">Sin indicar</option>
              <option>Macho</option>
              <option>Hembra</option>
            </select>
          )}
        </Field>
        <Field label="Fecha de nacimiento">{(id) => <input id={id} type="date" max={todayInput()} value={f.birthDate} onChange={set('birthDate')} className={inputClass} />}</Field>
        <Field label="Peso (kg)">{(id) => <input id={id} inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} className={inputClass} placeholder="Ej: 12,5" />}</Field>
        <Field label="Pelaje y señas">{(id) => <input id={id} value={f.coat} onChange={set('coat')} className={inputClass} placeholder="Ej: atigrado, mancha blanca en el pecho" />}</Field>
        <Field label="Microchip">{(id) => <input id={id} value={f.microchip} onChange={set('microchip')} className={inputClass} />}</Field>
        <Field label="Alertas" hint="Alergias, agresividad, cardiopatías… Se muestran siempre arriba de la ficha." className="sm:col-span-2">
          {(id) => <textarea id={id} rows={2} value={f.alerts} onChange={set('alerts')} className={inputClass} />}
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
            <input type="checkbox" checked={f.isCastrated} onChange={set('isCastrated')} className="h-4 w-4" /> Castrado/a
          </label>
          {patient && (
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input type="checkbox" checked={f.deceased} onChange={set('deceased')} className="h-4 w-4" /> Falleció
            </label>
          )}
        </div>
        <div className="sm:col-span-2"><FormActions saving={saving} onCancel={onClose} label={patient ? 'Guardar' : 'Crear paciente'} /></div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------
// VACUNA / DESPARASITACIÓN
// ---------------------------------------------------------------
export function PreventiveFormModal({ clinicId, patientId, kind, record, linkedOwner, onClose, onSaved }: {
  clinicId: string
  patientId: string
  kind: 'VACCINE' | 'DEWORMING'
  record?: Preventive | null
  linkedOwner?: string | null // nombre del dueño si el paciente está vinculado a su app
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState({
    name: record?.name ?? '',
    lot: record?.lot ?? '',
    route: record?.route ?? 'INTERNA',
    dateApplied: toInput(record?.dateApplied) || todayInput(),
    nextDueDate: toInput(record?.nextDueDate),
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const vaccine = kind === 'VACCINE'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...f, kind, route: vaccine ? null : f.route, nextDueDate: f.nextDueDate || null }
    try {
      if (record) await api.put(`/clinics/${clinicId}/preventives/${record.id}`, body)
      else await api.post(`/clinics/${clinicId}/patients/${patientId}/preventives`, body)
      toast.success('Guardado')
      onSaved()
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo guardar'))
      setSaving(false)
    }
  }

  return (
    <Modal title={`${record ? 'Editar' : 'Registrar'} ${vaccine ? 'vacuna' : 'desparasitación'}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label={vaccine ? 'Vacuna' : 'Producto'} className="sm:col-span-2">
          {(id) => <input id={id} required value={f.name} onChange={set('name')} className={inputClass} placeholder={vaccine ? 'Ej: Séxtuple, Antirrábica' : 'Ej: Bravecto, Drontal'} autoFocus />}
        </Field>
        {!vaccine && (
          <Field label="Tipo">
            {(id) => (
              <select id={id} value={f.route} onChange={set('route')} className={inputClass}>
                <option value="INTERNA">Interna</option>
                <option value="EXTERNA">Externa</option>
              </select>
            )}
          </Field>
        )}
        <Field label="Lote (opcional)">{(id) => <input id={id} value={f.lot} onChange={set('lot')} className={inputClass} />}</Field>
        <Field label="Fecha de aplicación">{(id) => <input id={id} type="date" required max={todayInput()} value={f.dateApplied} onChange={set('dateApplied')} className={inputClass} />}</Field>
        <Field label="Próxima dosis (opcional)">{(id) => <input id={id} type="date" min={f.dateApplied} value={f.nextDueDate} onChange={set('nextDueDate')} className={inputClass} />}</Field>
        {linkedOwner && (
          <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-950 sm:col-span-2 dark:bg-sky-900/20 dark:text-sky-100">
            {linkedOwner} usa PetHealth: se suma a la libreta de la mascota en su app y le llega el recordatorio de la próxima dosis.
          </p>
        )}
        <div className="sm:col-span-2"><FormActions saving={saving} onCancel={onClose} label="Guardar" /></div>
      </form>
    </Modal>
  )
}
