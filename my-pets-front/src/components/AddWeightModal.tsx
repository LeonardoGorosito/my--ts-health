import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { X, Weight } from 'lucide-react'
import { api } from '../lib/axios'
import { todayInput } from '../lib/dates'
import { Input } from './Input'
import { Button } from './Button'

// Acepta coma o punto decimal ("4,5" o "4.5")
const toNumber = (v: string) => Number(v.replace(',', '.'))

const schema = z.object({
  weight: z
    .string()
    .min(1, 'Ingresá el peso')
    .refine((v) => !Number.isNaN(toNumber(v)) && toNumber(v) > 0, 'Ingresá un número mayor a 0')
    .refine((v) => toNumber(v) <= 150, 'Revisá el peso: máximo 150 kg'),
  date: z.string().min(1, 'Elegí la fecha'),
  note: z.string().max(120, 'Máximo 120 caracteres').optional(),
})

type FormData = z.infer<typeof schema>

export type WeightRecordItem = { id: string; weightKg: number; date: string; note?: string | null }

const today = () => todayInput()
const empty = (): FormData => ({ weight: '', date: today(), note: '' })

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  petId: string
  record?: WeightRecordItem | null // con registro: modo edición
}

export function AddWeightModal({ isOpen, onClose, onSuccess, petId, record }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(record)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: empty(),
  })

  // Cada vez que se abre: datos del registro (edición) o formulario limpio con la fecha de hoy
  useEffect(() => {
    if (!isOpen) return
    reset(record ? { weight: String(record.weightKg).replace('.', ','), date: record.date.slice(0, 10), note: record.note ?? '' } : empty())
  }, [isOpen, record, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const body = { weightKg: toNumber(data.weight), date: data.date, note: data.note?.trim() || undefined }
    try {
      if (isEdit && record) {
        await api.put(`/weights/${record.id}`, body)
        toast.success('Peso actualizado')
      } else {
        await api.post('/weights', { ...body, petId })
        toast.success('Peso registrado')
      }
      onSuccess()
      onClose()
    } catch (e) {
      // Los 402 (plan) ya muestran su propio aviso
      if (!(isAxiosError(e) && e.response?.status === 402)) {
        toast.error((isAxiosError(e) && e.response?.data?.message) || 'Error al guardar')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Weight className="text-emerald-500" aria-hidden="true" /> {isEdit ? 'Editar peso' : 'Registrar peso'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X aria-hidden="true" className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weight-value" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</label>
              <Input id="weight-value" inputMode="decimal" placeholder="Ej: 4,5" autoComplete="off" aria-invalid={!!errors.weight} {...register('weight')} />
              {errors.weight && <p role="alert" className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <label htmlFor="weight-date" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
              <Input id="weight-date" type="date" max={today()} aria-invalid={!!errors.date} {...register('date')} />
              {errors.date && <p role="alert" className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="weight-note" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nota (opcional)</label>
            <Input id="weight-note" placeholder="Ej: control en la veterinaria, empezó dieta" maxLength={120} {...register('note')} />
            {errors.note && <p role="alert" className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.note.message}</p>}
          </div>

          <div className="flex gap-3 pt-4">
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
