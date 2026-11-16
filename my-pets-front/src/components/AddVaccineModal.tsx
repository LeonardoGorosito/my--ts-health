import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/axios'
import { toast } from 'sonner'
import { X, Syringe } from 'lucide-react'
import { Input } from './Input'
import { Button } from './Button'

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  date: z.string().min(1, 'Fecha de aplicación requerida'),
  nextDueDate: z.string().optional()
})

type FormData = z.infer<typeof schema>

// Fecha ISO del backend -> valor de <input type="date">
const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')

export function AddVaccineModal({ isOpen, onClose, petId, onSuccess, record }: any) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', date: '', nextDueDate: '' }
  })

  // Con `record` el modal edita un registro existente; sin él, crea uno nuevo
  const isEdit = Boolean(record)

  // Cada vez que se abre, cargamos los datos del registro (o limpiamos el formulario)
  useEffect(() => {
    if (!isOpen) return
    reset(record ? { name: record.name, date: toInputDate(record.dateApplied), nextDueDate: toInputDate(record.nextDueDate) } : { name: '', date: '', nextDueDate: '' })
  }, [isOpen, record, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/vaccines/${record.id}`, data)
        toast.success('Vacuna actualizada')
      } else {
        await api.post('/vaccines', { ...data, petId })
        toast.success('Vacuna registrada correctamente')
      }
      reset()
      onSuccess()
      onClose()
    } catch (e) {
      toast.error('Error al guardar')
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
            <Syringe className="text-emerald-500" /> {isEdit ? 'Editar Vacuna' : 'Registrar Vacuna'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X aria-hidden="true" className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="vaccine-name" className="block text-xs font-bold text-gray-500 mb-1">Nombre de la Vacuna</label>
            <Input placeholder="Ej: Rabia, Séxtuple, Triple Felina..." id="vaccine-name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="vaccine-date" className="block text-xs font-bold text-gray-500 mb-1">Fecha Aplicación</label>
                <Input type="date" id="vaccine-date" {...register('date')} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div>
                <label htmlFor="vaccine-nextDueDate" className="block text-xs font-bold text-emerald-600 mb-1">Próxima Dosis (Opcional)</label>
                <Input type="date" id="vaccine-nextDueDate" {...register('nextDueDate')} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-700">CANCELAR</button>
             <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase tracking-wide">
               {loading ? 'Guardando...' : 'Confirmar'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  )
}