import { useRef, useState } from 'react'
import type React from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, FileText, Pencil, Plus, Stethoscope, Trash2, Upload } from 'lucide-react'
import { api } from '../../lib/axios'
import { RECORD_TYPE_LABEL, ageFrom, apiMessage, canClinical, canDelete, fullName } from '../../lib/clinic'
import type { ClinicalRecord, PatientDetail, Preventive } from '../../lib/clinic'
import { daysFromToday, formatDay } from '../../lib/dates'
import { breedOrDefault, speciesName } from '../../lib/species'
import { SpeciesIcon } from '../../components/SpeciesIcon'
import { PatientFormModal, PreventiveFormModal } from '../../components/clinic/forms'
import { FamilyRecord } from '../../components/clinic/FamilyRecord'
import { card, dangerLink, primaryButton, secondaryButton } from '../../components/clinic/ui'
import type { ClinicOutlet } from './ClinicShell'

type Tab = 'history' | 'family' | 'preventives' | 'files'

// ---------------------------------------------------------------
// FICHA DEL PACIENTE (/clinica/pacientes/:patientId)
// ---------------------------------------------------------------
export function ClinicPatient() {
  const { membership } = useOutletContext<ClinicOutlet>()
  const clinicId = membership.clinic.id
  const clinical = canClinical(membership.role)
  const { patientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('history')
  const [editing, setEditing] = useState(false)
  const [preventive, setPreventive] = useState<{ kind: 'VACCINE' | 'DEWORMING'; record: Preventive | null } | null>(null)

  const key = ['clinic', clinicId, 'patient', patientId]
  const { data: p, isLoading } = useQuery<PatientDetail>({
    queryKey: key,
    queryFn: async () => (await api.get(`/clinics/${clinicId}/patients/${patientId}`)).data,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
  if (!p) return <p className="text-gray-600 dark:text-gray-400">No encontramos al paciente. <Link to="/clinica" className="font-semibold underline">Volver</Link></p>

  const removePatient = async () => {
    if (!window.confirm(`¿Eliminar a ${p.name} con toda su historia clínica? No se puede deshacer.`)) return
    try {
      await api.delete(`/clinics/${clinicId}/patients/${p.id}`)
      queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] })
      toast.success('Paciente eliminado')
      navigate(`/clinica/clientes/${p.client.id}`, { replace: true })
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo eliminar'))
    }
  }

  const facts = [
    speciesName(p.species, p.sex),
    breedOrDefault(p.breed, p.species, p.sex),
    p.sex,
    ageFrom(p.birthDate),
    p.isCastrated ? (p.sex === 'Hembra' ? 'Castrada' : 'Castrado') : null,
    p.weightKg ? `${p.weightKg.toLocaleString('es-AR')} kg` : null,
  ].filter((v, i, a) => v && a.indexOf(v) === i)

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'history', label: 'Historia clínica', count: p.records.length },
    // Ficha que carga el dueño en PetHealth (solo si vinculó la mascota con su código)
    ...(p.familyRecord
      ? [{ id: 'family' as Tab, label: 'Ficha de la familia', count: p.familyRecord.vaccinations.length + p.familyRecord.dewormings.length + p.familyRecord.medicalHistory.length + p.familyRecord.treatments.length }]
      : []),
    { id: 'preventives', label: 'Vacunas y desparasitaciones', count: p.preventives.length },
    { id: 'files', label: 'Estudios', count: p.attachments.length },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado del paciente */}
      <section className={`${card} flex flex-col gap-5 sm:flex-row sm:items-start`} aria-labelledby="patient-name">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <SpeciesIcon species={p.species} size={32} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="patient-name" className="font-brand text-3xl font-bold leading-tight text-gray-900 dark:text-white">
            {p.name}
            {p.deceasedAt && <span className="ml-3 align-middle text-sm font-semibold text-gray-500">Falleció el {formatDay(p.deceasedAt)}</span>}
          </h2>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{facts.join(' · ')}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {[p.coat, p.microchip && `Microchip ${p.microchip}`].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 text-sm">
            {p.familyRecord && (
              <span className="mr-2 inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">Usa PetHealth</span>
            )}
            <span className="text-gray-600 dark:text-gray-400">Dueño/a: </span>
            <Link to={`/clinica/clientes/${p.client.id}`} className="font-semibold text-gray-900 hover:underline dark:text-white">{fullName(p.client)}</Link>
            {p.client.phone && <a href={`tel:${p.client.phone}`} className="ml-2 tabular-nums text-gray-700 hover:underline dark:text-gray-300">{p.client.phone}</a>}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          {clinical && !p.deceasedAt && (
            <Link to={`/clinica/pacientes/${p.id}/consulta/nueva`} className={primaryButton}><Stethoscope size={18} aria-hidden="true" /> Nueva consulta</Link>
          )}
          <button type="button" onClick={() => setEditing(true)} className={secondaryButton}><Pencil size={16} aria-hidden="true" /> Editar datos</button>
        </div>
      </section>

      {p.alerts && (
        <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertTriangle size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
          <p className="whitespace-pre-line"><strong>Alertas:</strong> {p.alerts}</p>
        </div>
      )}

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones de la ficha" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors ${
              tab === t.id ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t.label} <span className="ml-1 tabular-nums text-gray-500 dark:text-gray-500">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'history' && <History records={p.records} patientId={p.id} clinical={clinical} />}

      {tab === 'family' && p.familyRecord && <FamilyRecord data={p.familyRecord} ownerName={p.client.name} />}

      {tab === 'preventives' && (
        <PreventiveList
          items={p.preventives}
          clinical={clinical}
          canRemove={canDelete(membership.role)}
          onAdd={(kind) => setPreventive({ kind, record: null })}
          onEdit={(record) => setPreventive({ kind: record.kind, record })}
          onRemove={async (record) => {
            if (!window.confirm(`¿Borrar ${record.name} del ${formatDay(record.dateApplied)}?`)) return
            try { await api.delete(`/clinics/${clinicId}/preventives/${record.id}`); refresh() } catch (err) { toast.error(apiMessage(err, 'No se pudo borrar')) }
          }}
        />
      )}

      {tab === 'files' && (
        <Files
          clinicId={clinicId}
          patientId={p.id}
          files={p.attachments}
          clinical={clinical}
          canRemove={canDelete(membership.role)}
          onChange={refresh}
        />
      )}

      {canDelete(membership.role) && (
        <div className="border-t border-gray-200 pt-4 dark:border-zinc-800">
          <button type="button" onClick={removePatient} className={dangerLink}>Eliminar paciente</button>
        </div>
      )}

      {editing && <PatientFormModal clinicId={clinicId} clientId={p.client.id} patient={p} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh() }} />}
      {preventive && (
        <PreventiveFormModal
          clinicId={clinicId}
          patientId={p.id}
          kind={preventive.kind}
          record={preventive.record}
          onClose={() => setPreventive(null)}
          onSaved={() => { setPreventive(null); refresh() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Historia clínica: una tarjeta por consulta, de la más nueva a la más vieja
// ---------------------------------------------------------------
function History({ records, patientId, clinical }: { records: ClinicalRecord[]; patientId: string; clinical: boolean }) {
  if (records.length === 0) {
    return (
      <div className={`${card} text-center`}>
        <p className="text-gray-700 dark:text-gray-300">Todavía no hay consultas.</p>
        {clinical && <Link to={`/clinica/pacientes/${patientId}/consulta/nueva`} className={`${primaryButton} mt-4`}><Stethoscope size={18} aria-hidden="true" /> Cargar la primera consulta</Link>}
      </div>
    )
  }
  return (
    <ol className="space-y-4">
      {records.map((r) => {
        const vitals = [
          r.weightKg != null && `${r.weightKg.toLocaleString('es-AR')} kg`,
          r.temperatureC != null && `${r.temperatureC.toLocaleString('es-AR')} °C`,
          r.heartRate != null && `FC ${r.heartRate} lpm`,
          r.respiratoryRate != null && `FR ${r.respiratoryRate} rpm`,
          r.mucous && `Mucosas ${r.mucous}`,
          r.capillaryRefill && `TLLC ${r.capillaryRefill}`,
          r.hydration && `Hidratación ${r.hydration}`,
          r.bodyCondition != null && `CC ${r.bodyCondition}/9`,
        ].filter(Boolean) as string[]
        return (
          <li key={r.id} className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatDay(r.date)}</span> · {RECORD_TYPE_LABEL[r.type]}
                  {r.author && <> · {r.author.user.name} {r.author.user.lastname}{r.author.licenseNumber ? ` (${r.author.licenseNumber})` : ''}</>}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{r.reason}</h3>
              </div>
              {clinical && (
                <Link to={`/clinica/pacientes/${patientId}/consulta/${r.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800">
                  <Pencil size={15} aria-hidden="true" /> Editar
                </Link>
              )}
            </div>
            {vitals.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Examen físico">
                {vitals.map((v) => <li key={v} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-800 dark:bg-zinc-800 dark:text-gray-200">{v}</li>)}
              </ul>
            )}
            <dl className="mt-3 space-y-2 text-sm">
              <RecordText label="Anamnesis" value={r.anamnesis} />
              <RecordText label="Examen" value={r.physicalExam} />
              <RecordText label="Diagnóstico presuntivo" value={r.presumptiveDx} />
              <RecordText label="Diagnóstico definitivo" value={r.finalDx} />
              <RecordText label="Tratamiento e indicaciones" value={r.treatment} />
              {r.nextControl && <RecordText label="Próximo control" value={formatDay(r.nextControl)} />}
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

function RecordText({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="font-semibold text-gray-700 dark:text-gray-300">{label}</dt>
      <dd className="whitespace-pre-line text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  )
}

// ---------------------------------------------------------------
// Vacunas y desparasitaciones
// ---------------------------------------------------------------
function PreventiveList({ items, clinical, canRemove, onAdd, onEdit, onRemove }: {
  items: Preventive[]
  clinical: boolean
  canRemove: boolean
  onAdd: (kind: 'VACCINE' | 'DEWORMING') => void
  onEdit: (p: Preventive) => void
  onRemove: (p: Preventive) => void
}) {
  const groups = [
    { kind: 'VACCINE' as const, title: 'Vacunas', add: 'Registrar vacuna' },
    { kind: 'DEWORMING' as const, title: 'Desparasitaciones', add: 'Registrar desparasitación' },
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups.map((g) => {
        const list = items.filter((i) => i.kind === g.kind)
        return (
          <section key={g.kind} className={card} aria-labelledby={`prev-${g.kind}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id={`prev-${g.kind}`} className="font-semibold text-gray-900 dark:text-white">{g.title}</h3>
              {clinical && <button type="button" onClick={() => onAdd(g.kind)} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"><Plus size={16} aria-hidden="true" /> {g.add}</button>}
            </div>
            {list.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Sin registros.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                {list.map((i) => {
                  const days = i.nextDueDate ? daysFromToday(i.nextDueDate) : null
                  return (
                    <li key={i.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {i.name}
                          {i.route && <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">{i.route === 'INTERNA' ? 'Interna' : 'Externa'}</span>}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Aplicada el {formatDay(i.dateApplied)}{i.lot ? ` · Lote ${i.lot}` : ''}</p>
                        {i.nextDueDate && (
                          <p className={days !== null && days < 0 ? 'font-semibold text-red-700 dark:text-red-400' : days !== null && days <= 30 ? 'font-semibold text-amber-800 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}>
                            Próxima: {formatDay(i.nextDueDate)}{days !== null && days < 0 ? ' (vencida)' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0">
                        {clinical && <button type="button" onClick={() => onEdit(i)} aria-label={`Editar ${i.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"><Pencil size={15} aria-hidden="true" /></button>}
                        {canRemove && <button type="button" onClick={() => onRemove(i)} aria-label={`Borrar ${i.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"><Trash2 size={15} aria-hidden="true" /></button>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------
// Estudios adjuntos
// ---------------------------------------------------------------
function Files({ clinicId, patientId, files, clinical, canRemove, onChange }: {
  clinicId: string
  patientId: string
  files: PatientDetail['attachments']
  clinical: boolean
  canRemove: boolean
  onChange: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('El archivo supera los 10 MB')
    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    try {
      await api.post(`/clinics/${clinicId}/patients/${patientId}/attachments`, data)
      toast.success('Estudio subido')
      onChange()
    } catch (err) {
      toast.error(apiMessage(err, 'No se pudo subir el archivo'))
    } finally {
      setUploading(false)
    }
  }

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`¿Borrar ${name}?`)) return
    try { await api.delete(`/clinics/${clinicId}/attachments/${id}`); onChange() } catch (err) { toast.error(apiMessage(err, 'No se pudo borrar')) }
  }

  return (
    <section className={card} aria-label="Estudios">
      {clinical && (
        <div className="mb-4">
          <input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" onChange={upload} aria-label="Elegir archivo" />
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className={primaryButton}>
            <Upload size={18} aria-hidden="true" /> {uploading ? 'Subiendo...' : 'Subir estudio'}
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF o imagen, hasta 10 MB.</p>
        </div>
      )}
      {files.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Sin estudios adjuntos.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-3">
              <a href={f.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 text-sm hover:underline">
                <FileText size={18} aria-hidden="true" className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-medium text-gray-900 dark:text-white">{f.name}</span>
                <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">{new Date(f.createdAt).toLocaleDateString('es-AR')}</span>
              </a>
              {canRemove && <button type="button" onClick={() => remove(f.id, f.name)} aria-label={`Borrar ${f.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"><Trash2 size={15} aria-hidden="true" /></button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
