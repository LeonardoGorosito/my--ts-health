import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../lib/axios'
import { toast } from 'sonner'
import { X, Cat, Dog, Heart } from 'lucide-react' // despues User, Calendar, AlertCircle
import { Input } from './Input'
import { Button } from './Button'

const addPetSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  species: z.enum(['CAT', 'DOG'], { message: 'Selecciona una especie válida' }),
  breed: z.string().optional().default(''),
  gender: z.enum(['Macho', 'Hembra'], { message: 'Selecciona un género' }),
  dateOfBirth: z.string().optional().default(''),
  isCastrated: z.boolean().default(false),
  specialNeeds: z.string().optional().default(''),
})

type AddPetFormData = z.infer<typeof addPetSchema>

type AddPetModalProps = {
  isOpen: boolean
  onClose: () => void
  onPetAdded?: () => void
}

export function AddPetModal({ isOpen, onClose, onPetAdded }: AddPetModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<'CAT' | 'DOG'>('CAT')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddPetFormData>({
    resolver: zodResolver(addPetSchema) as any,
    defaultValues: {
      species: 'CAT',
      gender: 'Macho',
      isCastrated: false,
    },
  })

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleClose = () => {
    reset()
    setSelectedSpecies('CAT')
    onClose()
  }

  const onSubmit = async (data: AddPetFormData) => {
    setIsLoading(true)
    try {
      await api.post('/pets', { ...data, species: selectedSpecies })
      toast.success('¡Mascota agregada exitosamente!')
      handleClose()
      onPetAdded?.()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
      {/* Contenedor Modal - Usamos bg-bg-card */}
      <div className="bg-white dark:bg-bg-card border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter uppercase">
            Nueva Mascota
          </h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Nombre con Input Matte */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Nombre</label>
            <Input
              type="text"
              placeholder="Nombre del peludo"
              {...register('name')}
              className="w-full bg-gray-50 dark:bg-bg-matte border-2 border-transparent focus:border-emerald-600 dark:text-gray-100 rounded-2xl transition-all"
            />
            {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name.message}</p>}
          </div>

          {/* Toggle Especie */}
          <div className="flex gap-2">
            {(['CAT', 'DOG'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSelectedSpecies(s); setValue('species', s) }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${
                  selectedSpecies === s
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                    : 'bg-gray-50 dark:bg-bg-matte border-transparent text-gray-400 dark:text-neutral-500 hover:border-gray-200 dark:hover:border-neutral-800'
                }`}
              >
                {s === 'CAT' ? <Cat size={16} /> : <Dog size={16} />}
                {s === 'CAT' ? 'Gato' : 'Perro'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Género */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Género</label>
              <select
                {...register('gender')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-matte dark:text-gray-100 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-bold text-sm outline-none transition-all appearance-none"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            {/* Fecha */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Nacimiento</label>
              <Input type="date" {...register('dateOfBirth')} className="bg-gray-50 dark:bg-bg-matte border-transparent focus:border-emerald-600 rounded-2xl text-sm" />
            </div>
          </div>

          {/* Castración Checkbox */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-bg-matte rounded-2xl cursor-pointer group transition-all border-2 border-transparent hover:border-emerald-600/30">
            <input type="checkbox" {...register('isCastrated')} className="w-5 h-5 rounded-lg accent-emerald-600" />
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">¿Está castrado?</span>
            </div>
          </label>

          {/* Necesidades Especiales */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 text-center">Notas de salud</label>
            <textarea
              placeholder="Baja visión, medicación, etc..."
              {...register('specialNeeds')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-matte dark:text-gray-100 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-sm font-bold min-h-[80px] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-6 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Confirmar Registro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}