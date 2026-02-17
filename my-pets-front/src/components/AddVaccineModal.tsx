import { useState } from 'react'
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

export function AddVaccineModal({ isOpen, onClose, petId, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/vaccines', { ...data, petId })
      toast.success('Vacuna registrada correctamente')
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
            <Syringe className="text-emerald-500" /> Registrar Vacuna
          </h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre de la Vacuna</label>
            <Input placeholder="Ej: Rabia, Séxtuple, Triple Felina..." {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Aplicación</label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div>
                <label className="block text-xs font-bold text-emerald-600 mb-1">Próxima Dosis (Opcional)</label>
                <Input type="date" {...register('nextDueDate')} />
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