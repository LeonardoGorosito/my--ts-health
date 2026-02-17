import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/axios'
import { toast } from 'sonner'

// Iconos
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Cat, 
  Dog, 
  AlertCircle, 
  Weight, 
  Edit2, 
  Trash2, 
  Stethoscope, 
  Plus,
  Syringe,
  Pill // <--- Asegurate de tener importado Pill
} from 'lucide-react'

// Componentes
import { UploadButton } from '../../components/UploadButton'
import { EditPetModal } from '../../components/EditPetModal'
import { Loader } from '../../components/Loader'
import { AddMedicalModal } from '../../components/AddMedicalModal' 
import { AddVaccineModal } from '../../components/AddVaccineModal'
import { AddDewormingModal } from '../../components/AddDewormingModal'

// --- FUNCIÓN AUXILIAR: CALCULAR EDAD ---
function getAge(dateString: string | undefined) {
  if (!dateString) return 'Edad desconocida'
  const birth = new Date(dateString)
  const now = new Date()
  
  let years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--
  }

  if (years === 0) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return `${months} meses`
  }

  return `${years} años`
}

interface PetDetail {
  id: string
  name: string
  species: 'CAT' | 'DOG'
  breed: string | null
  gender: 'Macho' | 'Hembra'
  birthDate: string
  weight?: string | null
  isCastrated: boolean 
  specialNeeds: string | null
  profileImageUrl?: string | null 
  bannerImageUrl?: string | null  
  attachments: any[]
  vaccinations: any[] 
  medicalHistory: any[] 
  dewormings: any[]
}

// ------------------------------------------------------------------
// EL COMPONENTE EMPIEZA AQUÍ
// ------------------------------------------------------------------
export function PetProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // 1. ESTADOS (Todos adentro del componente)
  const [pet, setPet] = useState<PetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'files'>('info')
  
  // Estados de los Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false)
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false)
  const [isDewormingModalOpen, setIsDewormingModalOpen] = useState(false) // <--- CORREGIDO: Ahora está adentro

  // 2. CARGAR DATOS
  const fetchPet = async () => {
    try {
      const res = await api.get(`/pets/${id}`)
      setPet(res.data)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cargar la mascota')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPet() }, [id])

  // 3. FUNCIONES DE ELIMINAR (Adentro para poder usar fetchPet)
  
  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('¿Estás seguro de borrar este evento médico?')) return
    try {
      await api.delete(`/medical/${recordId}`)
      toast.success('Registro eliminado')
      fetchPet() 
    } catch (e) {
      toast.error('No se pudo eliminar el registro')
    }
  }

  const handleDeleteAttachment = async (fileId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este archivo permanentemente?')) return
    try {
      await api.delete(`/attachments/${fileId}`)
      toast.success('Archivo eliminado')
      fetchPet()
    } catch (e) {
      toast.error('No se pudo eliminar el archivo')
    }
  }

  const handleDeleteVaccine = async (vaccineId: string) => {
    if (!window.confirm('¿Borrar esta vacuna del historial?')) return
    try {
      await api.delete(`/vaccines/${vaccineId}`)
      toast.success('Vacuna eliminada')
      fetchPet()
    } catch (e) {
      toast.error('Error al eliminar vacuna')
    }
  }

  // CORREGIDO: Movido adentro del componente
  const handleDeleteDeworming = async (id: string) => {
    if (!window.confirm('¿Borrar esta desparasitación?')) return
    try {
      await api.delete(`/dewormings/${id}`)
      toast.success('Eliminado')
      fetchPet() // Ahora sí funciona porque está en el scope
    } catch (e) { toast.error('Error al eliminar') }
  }

  if (loading) return <Loader text="Cargando perfil..." />  
  if (!pet) return <div className="p-10 text-center text-gray-500 dark:text-white">No encontramos a la mascota</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 transition-colors duration-300">
      
      {/* BANNER */}
      <div 
        className="relative h-48 bg-cover bg-center transition-all group"
        style={{ backgroundImage: pet.bannerImageUrl ? `url(${pet.bannerImageUrl})` : undefined }}
      >
        {!pet.bannerImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800"></div>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all z-10">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => setIsEditModalOpen(true)} className="absolute top-6 right-6 bg-black/20 hover:bg-black/40 text-white p-2 px-4 rounded-full backdrop-blur-sm transition-all z-10 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <Edit2 size={16} /> <span className="hidden md:inline">Editar Perfil</span>
        </button>
      </div>

      {/* CABECERA */}
      <div className="px-6 relative mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="-mt-16 w-32 h-32 rounded-full bg-white dark:bg-zinc-900 p-1.5 shadow-2xl overflow-hidden flex items-center justify-center border-4 border-white dark:border-black z-10 transition-colors duration-300">
             {pet.profileImageUrl ? (
                <img src={pet.profileImageUrl} alt={pet.name} className="w-full h-full object-cover rounded-full" />
             ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center rounded-full text-emerald-500 dark:text-emerald-500">
                    {pet.species === 'CAT' ? <Cat size={48} /> : <Dog size={48} />}
                </div>
             )}
          </div>
          <div className="flex-1 pt-2 md:pb-2">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">{pet.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <span>{pet.breed || 'Mestizo'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700"></span>
              <span>{pet.gender || 'Sin género'}</span>
            </div>
          </div>
          <div className="flex gap-3 mb-2">
             <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm dark:shadow-none transition-colors">
                <Weight size={16} className="text-emerald-500" />
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{pet.weight ? `${pet.weight} kg` : '-- kg'}</span>
             </div>
             <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm dark:shadow-none transition-colors">
                <Calendar size={16} className="text-emerald-500" />
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{getAge(pet.birthDate)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 border-b border-gray-200 dark:border-zinc-800 mb-8 transition-colors">
        <div className="flex gap-8 overflow-x-auto">
          {['info', 'history', 'files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'info' && 'Resumen'}
              {tab === 'history' && 'Historial Médico'}
              {tab === 'files' && 'Carpeta de Estudios'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 max-w-5xl mx-auto">
        
        {/* TAB 1: RESUMEN */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Notas de Salud */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none flex flex-col h-full">
               <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertCircle size={20} className="text-emerald-500" /> Notas de Salud
                   </h3>
                   <button onClick={() => setIsEditModalOpen(true)} className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors">
                     Editar
                   </button>
               </div>
               <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800/50">
                 {pet.specialNeeds ? (
                   <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm font-medium">{pet.specialNeeds}</p>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4">
                      <span className="text-sm text-gray-400 italic mb-2">Sin observaciones</span>
                      <p className="text-xs text-gray-300 max-w-[200px]">Agrega alergias, medicación o condiciones crónicas.</p>
                   </div>
                 )}
               </div>
            </div>

            {/* TARJETA 3: DESPARASITACIÓN */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none flex flex-col h-full">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Pill size={20} className="text-blue-500" /> Desparasitación
                   </h3>
                   <button 
                     onClick={() => setIsDewormingModalOpen(true)}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/20"
                   >
                     <Plus size={16} />
                   </button>
               </div>

               <div className="flex-1 space-y-3">
                 {(!pet.dewormings || pet.dewormings.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4 min-h-[100px]">
                      <span className="text-sm text-gray-400 italic mb-1">Sin registros</span>
                      <p className="text-xs text-gray-300">Pipetas y pastillas mensuales.</p>
                    </div>
                 ) : (
                    [...pet.dewormings]
                    .sort((a: any, b: any) => {
                        const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : 0
                        const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : 0
                        return dateB - dateA
                    })
                    .slice(0, 3)
                    .map((d: any) => {
                        const nextDate = d.nextDueDate ? new Date(d.nextDueDate) : null
                        const isExpired = nextDate && nextDate < new Date()
                        const daysLeft = nextDate ? Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                        const appliedDate = d.dateApplied ? new Date(d.dateApplied).toLocaleDateString() : '-'

                        return (
                          <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 group">
                             <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{d.name}</p>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-black/40 text-gray-400 uppercase">
                                        {d.type === 'INTERNA' ? 'INT' : 'EXT'}
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                   Aplicada: {appliedDate}
                                </p>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               {nextDate ? (
                                 <div className={`text-right px-3 py-1 rounded-lg border ${
                                    isExpired 
                                      ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400'
                                      : daysLeft && daysLeft < 15 
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400'
                                 }`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{isExpired ? 'Vencida' : 'Próxima'}</p>
                                    <p className="font-bold text-xs">{nextDate.toLocaleDateString()}</p>
                                 </div>
                               ) : null}
                               
                               <button 
                                 onClick={() => handleDeleteDeworming(d.id)}
                                 className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                          </div>
                        )
                    })
                 )}
               </div>
            </div>

            {/* Calendario Vacunas */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none flex flex-col h-full md:col-span-2">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Syringe size={20} className="text-emerald-500" /> Calendario Vacunas
                   </h3>
                   <button onClick={() => setIsVaccineModalOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20">
                     <Plus size={16} />
                   </button>
               </div>

               <div className="flex-1 space-y-3">
                 {pet.vaccinations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4 min-h-[100px]">
                      <span className="text-sm text-gray-400 italic mb-1">Calendario vacío</span>
                      <p className="text-xs text-gray-300">Registra sus vacunas para activar los recordatorios.</p>
                    </div>
                 ) : (
                    [...pet.vaccinations]
                    .sort((a: any, b: any) => {
                        const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : 0
                        const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : 0
                        return dateB - dateA 
                    })
                    .slice(0, 4) 
                    .map((v: any) => {
                        const nextDate = v.nextDueDate ? new Date(v.nextDueDate) : null
                        const isExpired = nextDate && nextDate < new Date()
                        const daysLeft = nextDate ? Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                        const appliedDate = v.dateApplied ? new Date(v.dateApplied).toLocaleDateString() : 'Sin fecha'

                        return (
                          <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-zinc-800/50 group">
                             <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{v.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                   Aplicada: {appliedDate}
                                </p>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               {nextDate ? (
                                 <div className={`text-right px-3 py-1 rounded-lg border ${
                                    isExpired 
                                      ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400'
                                      : daysLeft && daysLeft < 30 
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
                                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                 }`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{isExpired ? 'Vencida' : 'Próxima'}</p>
                                    <p className="font-bold text-xs">{nextDate.toLocaleDateString()}</p>
                                 </div>
                               ) : (
                                 <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Dosis Única</span>
                               )}
                               
                               <button 
                                  onClick={() => handleDeleteVaccine(v.id)}
                                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                  title="Eliminar vacuna"
                                  >
                                  <Trash2 size={14} />
                              </button>
                             </div>
                          </div>
                        )
                    })
                 )}
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIAL MÉDICO */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Linea de Tiempo</h2>
              <button onClick={() => setIsMedicalModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20">
                <Plus size={16} /> Agregar Evento
              </button>
            </div>
            <div className="space-y-4">
              {pet.medicalHistory.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                   <Stethoscope className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                   <p className="text-gray-500">No hay registros médicos aún.</p>
                </div>
              ) : (
                pet.medicalHistory.map((record: any) => (
                  <div key={record.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex gap-4 transition-colors">
                    <div className="flex flex-col items-center min-w-[60px] border-r border-gray-100 dark:border-zinc-800 pr-4">
                       <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{new Date(record.date).getDate()}</span>
                       <span className="text-xs font-bold text-gray-400 uppercase">{new Date(record.date).toLocaleString('es-ES', { month: 'short' })}</span>
                       <span className="text-[10px] text-gray-300 mt-1">{new Date(record.date).getFullYear()}</span>
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{record.title}</h3>
                          <button onClick={() => handleDeleteRecord(record.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                       </div>
                       <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 leading-relaxed">{record.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ESTUDIOS Y ARCHIVOS */}
        {activeTab === 'files' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estudios y Archivos</h2>
              <UploadButton petId={pet.id} onUploadSuccess={fetchPet} />
            </div>
            
            {pet.attachments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 transition-colors">
                <FileText className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500">No hay archivos guardados aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pet.attachments.map((file: any) => (
                  <div key={file.id} className="relative group">
                    {/* Tarjeta del archivo (Link) */}
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="block aspect-square bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex flex-col items-center justify-center hover:shadow-lg dark:hover:bg-zinc-800 transition-all"
                    >
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <FileText className="text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 truncate w-full px-2">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </a>

                    {/* BOTÓN DE BORRAR ARCHIVO */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault() // Evita que se abra el archivo al hacer click en borrar
                        handleDeleteAttachment(file.id)
                      }}
                      className="absolute top-2 right-2 bg-white dark:bg-black/50 hover:bg-red-50 text-gray-400 hover:text-red-500 p-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-transparent transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                      title="Eliminar archivo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EditPetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} petData={pet as any} onPetUpdated={fetchPet} />
      <AddMedicalModal isOpen={isMedicalModalOpen} onClose={() => setIsMedicalModalOpen(false)} petId={pet.id} onSuccess={fetchPet} />
      <AddVaccineModal isOpen={isVaccineModalOpen} onClose={() => setIsVaccineModalOpen(false)} petId={pet.id} onSuccess={fetchPet} />
      {/* Modal nuevo */}
      <AddDewormingModal isOpen={isDewormingModalOpen} onClose={() => setIsDewormingModalOpen(false)} petId={pet.id} onSuccess={fetchPet} />

    </div>
  )
}