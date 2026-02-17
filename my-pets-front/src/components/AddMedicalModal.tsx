import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/axios'
import { toast } from 'sonner'
import { X, Stethoscope } from 'lucide-react'
import { Input } from './Input'
import { Button } from './Button'

const schema = z.object({
  title: z.string().min(3, 'Título requerido'),
  description: z.string().min(3, 'Descripción requerida'),
  date: z.string().optional()
})

type FormData = z.infer<typeof schema>

export function AddMedicalModal({ isOpen, onClose, petId, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/medical', { ...data, petId })
      toast.success('Evento agregado al historial')
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
            <Stethoscope className="text-emerald-500" /> Nuevo Evento Médico
          </h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Título</label>
            <Input placeholder="Ej: Consulta anual, Vacunación..." {...register('title')} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
            <Input type="date" {...register('date')} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Descripción / Diagnóstico</label>
            <textarea 
              {...register('description')} 
              className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-2 border-transparent focus:border-emerald-500 outline-none min-h-[100px]"
              placeholder="Detalles de la visita, medicamentos recetados, etc."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
             <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-500">CANCELAR</button>
             <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">
               {loading ? 'GUARDANDO...' : 'GUARDAR'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  )
}