import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../lib/axios'
import { toast } from 'sonner'
import { X, Cat, Dog, Heart, Camera, Image as ImageIcon, Trash2, AlertTriangle } from 'lucide-react'
import { Input } from './Input'
import { Button } from './Button'
import { useNavigate } from 'react-router-dom'

const editPetSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  species: z.enum(['CAT', 'DOG'], { message: 'Selecciona una especie válida' }),
  breed: z.string().optional(),
  gender: z.enum(['Macho', 'Hembra'], { message: 'Selecciona un género' }),
  birthDate: z.string().optional(),
  weight: z.string().optional(),
  isCastrated: z.boolean(),
  specialNeeds: z.string().optional(),
})

type EditPetFormData = z.infer<typeof editPetSchema>

type PetData = EditPetFormData & {
  id: string
  profileImageUrl?: string | null
  bannerImageUrl?: string | null
}

type EditPetModalProps = {
  isOpen: boolean
  onClose: () => void
  onPetUpdated?: () => void
  petData: PetData
}

export function EditPetModal({ isOpen, onClose, onPetUpdated, petData }: EditPetModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<'CAT' | 'DOG'>(petData.species)
  const navigate = useNavigate()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(petData.profileImageUrl || null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(petData.bannerImageUrl || null)

  const profileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditPetFormData>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      ...petData,
      birthDate: petData.birthDate ? new Date(petData.birthDate).toISOString().split('T')[0] : '',
    },
  })

  useEffect(() => {
    if (isOpen && petData) {
        reset({
            ...petData,
            birthDate: petData.birthDate ? new Date(petData.birthDate).toISOString().split('T')[0] : '',
        })
        setSelectedSpecies(petData.species)
        setProfileImage(null)
        setBannerImage(null)
        setProfilePreview(petData.profileImageUrl || null)
        setBannerPreview(petData.bannerImageUrl || null)
        setShowDeleteConfirm(false)
    }
  }, [isOpen, petData, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { 
        toast.error('La imagen no puede superar los 5MB')
        return
    }
    const previewUrl = URL.createObjectURL(file)
    if (type === 'profile') {
        setProfileImage(file)
        setProfilePreview(previewUrl)
    } else {
        setBannerImage(file)
        setBannerPreview(previewUrl)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await api.delete(`/pets/${petData.id}`)
      toast.success('Mascota eliminada correctamente')
      handleClose()
      navigate('/pets')
    } catch (error) {
      toast.error('Error al eliminar la mascota')
      console.error(error)
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: EditPetFormData) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, typeof value === 'boolean' ? value.toString() : value)
        }
      })
      formData.append('species', selectedSpecies)
      if (profileImage) formData.append('profileImage', profileImage)
      if (bannerImage) formData.append('bannerImage', bannerImage)

      await api.put(`/pets/${petData.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('¡Mascota actualizada exitosamente!')
      handleClose()
      onPetUpdated?.()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Error al actualizar')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="bg-white dark:bg-bg-card border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-300 scale-100 relative overflow-hidden">
        
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* --- SECCIÓN DE IMÁGENES (Diseño IDÉNTICO al AddPetModal) --- */}
            <div className="relative">
                <div 
                    className="h-40 bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 bg-cover bg-center flex items-center justify-center cursor-pointer group"
                    style={{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined }}
                    onClick={() => bannerInputRef.current?.click()}
                >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                    <ImageIcon className="text-white/70 group-hover:text-white transition-colors z-10" size={32} />
                    <span className="absolute bottom-2 right-4 text-[10px] font-bold text-white/50 uppercase tracking-widest">Editar Banner</span>
                    <input type="file" ref={bannerInputRef} onChange={(e) => handleImageChange(e, 'banner')} className="hidden" accept="image/*" />
                </div>

                <div className="absolute -bottom-12 left-8">
                    <div 
                        className="w-24 h-24 rounded-full bg-gray-200 dark:bg-zinc-800 border-4 border-white dark:border-bg-card overflow-hidden cursor-pointer group relative flex items-center justify-center"
                        onClick={() => profileInputRef.current?.click()}
                    >
                        {profilePreview ? (
                            <img src={profilePreview} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 dark:text-gray-500">
                                {selectedSpecies === 'CAT' ? <Cat size={32} /> : <Dog size={32} />}
                            </div>
                        )}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                         </div>
                        <input type="file" ref={profileInputRef} onChange={(e) => handleImageChange(e, 'profile')} className="hidden" accept="image/*" />
                    </div>
                </div>
                <button type="button" onClick={handleClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors z-20">
                    <X size={20} />
                </button>
            </div>

            {/* --- CAMPOS --- */}
            <div className="p-8 pt-16 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter uppercase">Editar Mascota</h2>
                </div>

                {/* Campos idénticos al de Agregar */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Nombre</label>
                        <Input type="text" {...register('name')} className="w-full bg-gray-50 dark:bg-bg-matte border-2 border-transparent focus:border-emerald-600 dark:text-gray-100 rounded-2xl transition-all font-bold" />
                        {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Raza</label>
                        <Input type="text" {...register('breed')} className="w-full bg-gray-50 dark:bg-bg-matte border-2 border-transparent focus:border-emerald-600 dark:text-gray-100 rounded-2xl transition-all font-bold text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Especie</label>
                    <div className="flex gap-2">
                    {(['CAT', 'DOG'] as const).map((s) => (
                        <button key={s} type="button" onClick={() => { setSelectedSpecies(s); setValue('species', s) }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${selectedSpecies === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-bg-matte border-transparent text-gray-400 dark:text-neutral-500'}`}>
                        {s === 'CAT' ? <Cat size={18} /> : <Dog size={18} />} {s === 'CAT' ? 'Gato' : 'Perro'}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Género</label>
                        <select {...register('gender')} className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-matte dark:text-gray-100 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-bold text-sm outline-none appearance-none">
                            <option value="Macho">Macho</option>
                            <option value="Hembra">Hembra</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Peso (kg)</label>
                        <Input type="text" {...register('weight')} className="bg-gray-50 dark:bg-bg-matte border-transparent focus:border-emerald-600 rounded-2xl text-sm font-bold dark:text-gray-100" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Nacimiento</label>
                        <Input type="date" {...register('birthDate')} className="bg-gray-50 dark:bg-bg-matte border-transparent focus:border-emerald-600 rounded-2xl text-sm font-bold dark:text-gray-100 w-full" />
                    </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-bg-matte rounded-2xl cursor-pointer group transition-all border-2 border-transparent hover:border-emerald-600/30">
                    <input type="checkbox" {...register('isCastrated')} className="w-5 h-5 rounded-lg accent-emerald-600 cursor-pointer" />
                    <div className="flex items-center gap-2">
                        <Heart size={16} className="text-emerald-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">¿Está castrado?</span>
                    </div>
                </label>

                <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Notas de salud</label>
                    <textarea {...register('specialNeeds')} className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-matte dark:text-gray-100 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-sm font-bold min-h-[80px] outline-none resize-none" />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button type="button" onClick={handleClose} className="flex-1 px-6 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    Cancelar
                    </button>
                    <Button type="submit" disabled={isLoading} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex justify-center items-center">
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Guardar Cambios'}
                    </Button>
                </div>

                {/* ZONA DE PELIGRO (Eliminar) */}
                <div className="pt-2">
                   {!showDeleteConfirm ? (
                       <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 text-[10px] font-black uppercase tracking-widest py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                           <Trash2 size={14} /> Eliminar Mascota
                       </button>
                   ) : (
                       <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-3 mb-3 text-red-600 dark:text-red-400">
                               <AlertTriangle size={18} />
                               <p className="text-xs font-bold">¿Estás seguro? Esta acción no se puede deshacer.</p>
                           </div>
                           <div className="flex gap-3">
                               <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold shadow-sm">Cancelar</button>
                               <button type="button" onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/10">Sí, Eliminar</button>
                           </div>
                       </div>
                   )}
                </div>

            </div>
        </form>
      </div>
    </div>
  )
}