import { useEffect, useState } from 'react'
import type React from 'react'
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { api } from '../../lib/axios'
import { RECORD_TYPE_LABEL, apiMessage, canClinical, canDelete } from '../../lib/clinic'
import type { PatientDetail, RecordType } from '../../lib/clinic'
import { todayInput } from '../../lib/dates'
import { Field, card, dangerLink, inputClass, primaryButton, secondaryButton } from '../../components/clinic/ui'
import type { ClinicOutlet } from './ClinicShell'

// ==========================================================
// CONSULTA (/clinica/pacientes/:patientId/consulta/nueva y /consulta/:recordId)
// Pantalla completa, pensada para cargar durante la atención: motivo, anamnesis,
// examen físico, diagnóstico y tratamiento. El peso arranca con el último registrado.
// ==========================================================

type Form = {
  date: string; type: RecordType; reason: string; anamnesis: string
  weightKg: string; temperatureC: string; heartRate: string; respiratoryRate: string
  mucous: string; capillaryRefill: string; hydration: string; bodyCondition: string; physicalExam: string
  presumptiveDx: string; finalDx: string; treatment: string; nextControl: string
  sharedWithOwner: boolean; ownerNote: string
}

const MUCOUS = ['Rosadas', 'Pálidas', 'Congestivas', 'Cianóticas', 'Ictéricas']
const HYDRATION = ['Normal', 'Deshidratación leve (5%)', 'Moderada (6-8%)', 'Severa (>8%)']

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v))

export function ClinicRecordForm() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const { patientId, recordId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editing = !!recordId

  const { data: patient, isLoading } = useQuery<PatientDetail>({
    queryKey: ['clinic', clinicId, 'patient', patientId],
    queryFn: async () => (await api.get(`/clinics/${clinicId}/patients/${patientId}`)).data,
  })

  const [f, setF] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)

  // Armamos el formulario cuando llegan los datos (consulta existente o nueva con el último peso)
  useEffect(() => {
    if (!patient || f) return
    const r = editing ? patient.records.find((x) => x.id === recordId) : null
    setF({
      date: r?.date.slice(0, 10) ?? todayInput(),
      type: r?.type ?? 'CONSULTATION',
      reason: r?.reason ?? '',
      anamnesis: r?.anamnesis ?? '',
      weightKg: str(r ? r.weightKg : patient.weightKg),
      temperatureC: str(r?.temperatureC),
      heartRate: str(r?.heartRate),
      respiratoryRate: str(r?.respiratoryRate),
      mucous: r?.mucous ?? '',
      capillaryRefill: r?.capillaryRefill ?? '',
      hydration: r?.hydration ?? '',
      bodyCondition: str(r?.bodyCondition),
      physicalExam: r?.physicalExam ?? '',
      presumptiveDx: r?.presumptiveDx ?? '',
      finalDx: r?.finalDx ?? '',
      treatment: r?.treatment ?? '',
      nextControl: r?.nextControl?.slice(0, 10) ?? '',
      sharedWithOwner: r?.sharedWithOwner ?? false,
      ownerNote: r?.ownerNote ?? '',
    })
  }, [patient, editing, recordId, f])

  if (!canClinical(membership.role)) return <Navigate to={`/clinica/pacientes/${patientId}`} replace />
  if (isLoading || !f) return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
  if (!patient) return <p className="text-gray-600 dark:text-gray-400">No encontramos al paciente.</p>

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => (s ? { ...s, [k]: e.target.value } : s))

  const back = `/clinica/pacientes/${patient.id}`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...f, nextControl: f.nextControl || null }
    try {
      if (editing) await api.put(`/clinics/${clinicId}/records/${recordId}`, body)
      else await api.post(`/clinics/${clinicId}/patients/${patient.id}/records`, body)
      await queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] })
      toast.success(editing ? 'Consulta actualizada' : 'Consulta guardada')
      navigate(back)
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo guardar la consulta'))
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('¿Borrar esta consulta? No se puede deshacer.')) return
    try {
      await api.delete(`/clinics/${clinicId}/records/${recordId}`)
      await queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] })
      toast.success('Consulta borrada')
      navigate(back, { replace: true })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo borrar'))
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:underline dark:text-gray-300">
          <ArrowLeft size={16} aria-hidden="true" /> {patient.name}
        </Link>
        <h2 className="mt-2 font-brand text-2xl font-bold text-gray-900 dark:text-white">{editing ? 'Editar consulta' : 'Nueva consulta'}</h2>
      </div>

      {patient.alerts && (
        <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertTriangle size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
          <p className="whitespace-pre-line"><strong>Alertas:</strong> {patient.alerts}</p>
        </div>
      )}

      <section className={`${card} grid gap-4 sm:grid-cols-[10rem_12rem_1fr]`} aria-label="Motivo">
        <Field label="Fecha">{(id) => <input id={id} type="date" required max={todayInput()} value={f.date} onChange={set('date')} className={inputClass} />}</Field>
        <Field label="Tipo">
          {(id) => (
            <select id={id} value={f.type} onChange={set('type')} className={inputClass}>
              {(Object.keys(RECORD_TYPE_LABEL) as RecordType[]).map((t) => <option key={t} value={t}>{RECORD_TYPE_LABEL[t]}</option>)}
            </select>
          )}
        </Field>
        <Field label="Motivo de consulta">{(id) => <input id={id} required value={f.reason} onChange={set('reason')} className={inputClass} placeholder="Ej: vómitos hace 2 días" autoFocus={!editing} />}</Field>
        <Field label="Anamnesis" className="sm:col-span-3">{(id) => <textarea id={id} rows={3} value={f.anamnesis} onChange={set('anamnesis')} className={inputClass} />}</Field>
      </section>

      <section className={card} aria-labelledby="exam-title">
        <h3 id="exam-title" className="mb-4 font-semibold text-gray-900 dark:text-white">Examen físico</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Peso (kg)">{(id) => <input id={id} inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} className={inputClass} />}</Field>
          <Field label="Temperatura (°C)">{(id) => <input id={id} inputMode="decimal" value={f.temperatureC} onChange={set('temperatureC')} className={inputClass} placeholder="38,5" />}</Field>
          <Field label="FC (lpm)">{(id) => <input id={id} inputMode="numeric" value={f.heartRate} onChange={set('heartRate')} className={inputClass} />}</Field>
          <Field label="FR (rpm)">{(id) => <input id={id} inputMode="numeric" value={f.respiratoryRate} onChange={set('respiratoryRate')} className={inputClass} />}</Field>
          <Field label="Mucosas">
            {(id) => (
              <>
                <input id={id} list="mucous-options" value={f.mucous} onChange={set('mucous')} className={inputClass} />
                <datalist id="mucous-options">{MUCOUS.map((m) => <option key={m} value={m} />)}</datalist>
              </>
            )}
          </Field>
          <Field label="TLLC">{(id) => <input id={id} value={f.capillaryRefill} onChange={set('capillaryRefill')} className={inputClass} placeholder="< 2 s" />}</Field>
          <Field label="Hidratación">
            {(id) => (
              <>
                <input id={id} list="hydration-options" value={f.hydration} onChange={set('hydration')} className={inputClass} />
                <datalist id="hydration-options">{HYDRATION.map((m) => <option key={m} value={m} />)}</datalist>
              </>
            )}
          </Field>
          <Field label="Condición corporal (1-9)">
            {(id) => (
              <select id={id} value={f.bodyCondition} onChange={set('bodyCondition')} className={inputClass}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
          </Field>
          <Field label="Observaciones del examen" className="col-span-2 sm:col-span-4">{(id) => <textarea id={id} rows={3} value={f.physicalExam} onChange={set('physicalExam')} className={inputClass} />}</Field>
        </div>
      </section>

      <section className={`${card} grid gap-4 sm:grid-cols-2`} aria-labelledby="dx-title">
        <h3 id="dx-title" className="font-semibold text-gray-900 dark:text-white sm:col-span-2">Diagnóstico y tratamiento</h3>
        <Field label="Diagnóstico presuntivo">{(id) => <textarea id={id} rows={2} value={f.presumptiveDx} onChange={set('presumptiveDx')} className={inputClass} />}</Field>
        <Field label="Diagnóstico definitivo">{(id) => <textarea id={id} rows={2} value={f.finalDx} onChange={set('finalDx')} className={inputClass} />}</Field>
        <Field label="Tratamiento e indicaciones" className="sm:col-span-2">{(id) => <textarea id={id} rows={4} value={f.treatment} onChange={set('treatment')} className={inputClass} />}</Field>
        <Field label="Próximo control (opcional)">{(id) => <input id={id} type="date" min={f.date} value={f.nextControl} onChange={set('nextControl')} className={inputClass} />}</Field>
      </section>

      {/* Compartir con la familia: solo si el paciente está vinculado a la app del dueño */}
      {patient.petId && (
        <section className={`${card} space-y-4`} aria-labelledby="owner-title">
          <div>
            <h3 id="owner-title" className="font-semibold text-gray-900 dark:text-white">Para la familia</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {patient.client.name} usa PetHealth. Si compartís la consulta, le aparece en el historial de {patient.name} con el motivo y estas indicaciones. Lo demás (anamnesis, examen, diagnósticos) queda solo en la clínica.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={f.sharedWithOwner}
              onChange={(e) => {
                const checked = e.target.checked
                // Primera vez: proponemos las indicaciones del tratamiento como punto de partida
                setF((s) => (s ? { ...s, sharedWithOwner: checked, ownerNote: checked && !s.ownerNote ? s.treatment : s.ownerNote } : s))
              }}
            />
            Compartir con la familia en su app
          </label>
          {f.sharedWithOwner && (
            <Field label="Indicaciones para la familia" hint="Escribilo para el dueño: qué tiene que hacer, qué medicación darle y cuándo volver.">
              {(id) => <textarea id={id} rows={4} value={f.ownerNote} onChange={set('ownerNote')} className={inputClass} />}
            </Field>
          )}
        </section>
      )}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {editing && canDelete(membership.role) ? <button type="button" onClick={remove} className={dangerLink}>Borrar consulta</button> : <span />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link to={back} className={secondaryButton}>Cancelar</Link>
          <button type="submit" disabled={saving} className={`${primaryButton} px-8`}>{saving ? 'Guardando...' : 'Guardar consulta'}</button>
        </div>
      </div>
    </form>
  )
}
