import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { X, Tablets } from 'lucide-react'
import { api } from '../lib/axios'
import { FREQUENCY_OPTIONS, todayInput } from '../lib/treatments'
import type { Treatment } from '../lib/treatments'
import { Input } from './Input'
import { Button } from './Button'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá el nombre del medicamento').max(80),
    dose: z.string().max(60).optional(),
    frequency: z.string().min(1), // horas, como texto (valor del select)
    customHours: z.string().optional(),
    startDate: z.string().min(1, 'Elegí la fecha de inicio'),
    continuous: z.boolean(),
    endDate: z.string().optional(),
    notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
  })
  .superRefine((d, ctx) => {
    if (d.frequency === 'custom') {
      const h = Number(d.customHours)
      if (!Number.isInteger(h) || h < 1 || h > 744) ctx.addIssue({ code: 'custom', path: ['customHours'], message: 'Ingresá las horas (entre 1 y 744)' })
    }
    if (!d.continuous) {
      if (!d.endDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Elegí hasta cuándo, o marcalo como continuo' })
      else if (d.endDate < d.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Tiene que ser igual o posterior al inicio' })
    }
  })

type FormData = z.infer<typeof schema>

const empty = (): FormData => ({
  name: '', dose: '', frequency: '24', customHours: '', startDate: todayInput(), continuous: false, endDate: '', notes: '',
})

const fromRecord = (t: Treatment): FormData => {
  const known = FREQUENCY_OPTIONS.some((o) => o.hours === t.frequencyHours)
  return {
    name: t.name,
    dose: t.dose ?? '',
    frequency: known ? String(t.frequencyHours) : 'custom',
    customHours: known ? '' : String(t.frequencyHours),
    startDate: t.startDate.slice(0, 10),
    continuous: !t.endDate,
    endDate: t.endDate ? t.endDate.slice(0, 10) : '',
    notes: t.notes ?? '',
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  petId: string
  record?: Treatment | null // con registro: modo edición
}

const labelClass = 'block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1'
const errorClass = 'text-red-600 dark:text-red-400 text-xs mt-1'
const selectClass =
  'w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

export function AddTreatmentModal({ isOpen, onClose, onSuccess, petId, record }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(record)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty(),
  })
  const frequency = watch('frequency')
  const continuous = watch('continuous')

  useEffect(() => {
    if (!isOpen) return
    reset(record ? fromRecord(record) : empty())
  }, [isOpen, record, reset])

  const onSubmit = async (d: FormData) => {
    setLoading(true)
    const body = {
      name: d.name.trim(),
      dose: d.dose?.trim() || undefined,
      frequencyHours: d.frequency === 'custom' ? Number(d.customHours) : Number(d.frequency),
      startDate: d.startDate,
      endDate: d.continuous ? undefined : d.endDate,
      notes: d.notes?.trim() || undefined,
    }
    try {
      if (isEdit && record) {
        await api.put(`/treatments/${record.id}`, body)
        toast.success('Tratamiento actualizado')
      } else {
        await api.post('/treatments', { ...body, petId })
        toast.success('Tratamiento registrado')
      }
      onSuccess()
      onClose()
    } catch (e) {
      if (!(isAxiosError(e) && e.response?.status === 402)) {
        toast.error((isAxiosError(e) && e.response?.data?.message) || 'Error al guardar')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Tablets className="text-emerald-500" aria-hidden="true" /> {isEdit ? 'Editar tratamiento' : 'Nuevo tratamiento'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X aria-hidden="true" className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="t-name" className={labelClass}>Medicamento</label>
            <Input id="t-name" placeholder="Ej: Amoxicilina, Meloxicam..." aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p role="alert" className={errorClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="t-dose" className={labelClass}>Dosis (opcional)</label>
            <Input id="t-dose" placeholder="Ej: 1/2 comprimido, 5 ml, 2 gotas" maxLength={60} {...register('dose')} />
          </div>

          <div>
            <label htmlFor="t-frequency" className={labelClass}>Frecuencia</label>
            <select id="t-frequency" className={selectClass} {...register('frequency')}>
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.hours} value={String(o.hours)}>{o.label}</option>
              ))}
              <option value="custom">Otra (en horas)</option>
            </select>
            {frequency === 'custom' && (
              <div className="mt-2">
                <label htmlFor="t-hours" className="sr-only">Cada cuántas horas</label>
                <Input id="t-hours" inputMode="numeric" placeholder="Cada cuántas horas, ej: 36" aria-invalid={!!errors.customHours} {...register('customHours')} />
                {errors.customHours && <p role="alert" className={errorClass}>{errors.customHours.message}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="t-start" className={labelClass}>Desde</label>
              <Input id="t-start" type="date" aria-invalid={!!errors.startDate} {...register('startDate')} />
              {errors.startDate && <p role="alert" className={errorClass}>{errors.startDate.message}</p>}
            </div>
            <div>
              <label htmlFor="t-end" className={labelClass}>Hasta</label>
              <Input id="t-end" type="date" disabled={continuous} aria-invalid={!!errors.endDate} {...register('endDate')} />
              {errors.endDate && !continuous && <p role="alert" className={errorClass}>{errors.endDate.message}</p>}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" {...register('continuous')} />
            <span>Tratamiento continuo, sin fecha de fin (por ejemplo, medicación crónica)</span>
          </label>

          <div>
            <label htmlFor="t-notes" className={labelClass}>Notas (opcional)</label>
            <textarea
              id="t-notes"
              rows={2}
              maxLength={200}
              className="w-full bg-gray-50 dark:bg-zinc-800 dark:text-white rounded-xl p-3 text-sm border-2 border-transparent focus:border-emerald-500 outline-none"
              placeholder="Ej: dar con comida, lo indicó la Dra. Pérez"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">CANCELAR</button>
            <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase tracking-wide">
              {loading ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
