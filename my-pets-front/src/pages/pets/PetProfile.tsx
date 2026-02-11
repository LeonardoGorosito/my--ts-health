import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/axios'
import { ArrowLeft, Calendar, Weight, Syringe, FileText, Paperclip, Cat, Dog } from 'lucide-react'
import { UploadButton } from '../../components/UploadButton' // El botón que hicimos antes

// Tipos rápidos (idealmente van en un archivo types.ts)
interface PetDetail {
  id: string
  name: string
  species: 'CAT' | 'DOG'
  breed: string
  gender: string
  birthDate: string
  attachments: any[]
  vaccinations: any[]
  medicalHistory: any[]
}

export function PetProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState<PetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'files'>('info')

  const fetchPet = async () => {
    try {
      const res = await api.get(`/pets/${id}`)
      setPet(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPet() }, [id])

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>
  if (!pet) return <div className="p-10 text-center">No encontramos a la mascota</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      
      {/* --- PORTADA TIPO RED SOCIAL --- */}
      <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-teal-700">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* --- INFO PRINCIPAL (flotando sobre la portada) --- */}
      <div className="px-6 relative -mt-16 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          
          {/* FOTO DE PERFIL */}
          <div className="w-32 h-32 rounded-full bg-white dark:bg-zinc-900 p-1 shadow-2xl overflow-hidden flex items-center justify-center border-4 border-white dark:border-zinc-900">
             {/* Si tuviera foto real, iría acá. Por ahora icono */}
             <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center rounded-full text-emerald-600">
                {pet.species === 'CAT' ? <Cat size={48} /> : <Dog size={48} />}
             </div>
          </div>

          {/* DATOS */}
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{pet.name}</h1>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-sm tracking-widest">
              {pet.breed || 'Mestizo'} • {pet.gender || 'Sin género'}
            </p>
          </div>

          {/* ESTADÍSTICAS RÁPIDAS (Badges) */}
          <div className="flex gap-3 mb-3">
             <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                <Weight size={16} className="text-gray-400" />
                <span className="font-bold text-sm dark:text-gray-200">5.4 kg</span>
             </div>
             <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="font-bold text-sm dark:text-gray-200">2 años</span>
             </div>
          </div>
        </div>
      </div>

      {/* --- TABS DE NAVEGACIÓN --- */}
      <div className="px-6 border-b border-gray-200 dark:border-zinc-800 mb-6">
        <div className="flex gap-8">
          {['info', 'history', 'files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'info' && 'Resumen'}
              {tab === 'history' && 'Historial Médico'}
              {tab === 'files' && 'Carpeta de Estudios'}
            </button>
          ))}
        </div>
      </div>

      {/* --- CONTENIDO DE LOS TABS --- */}
      <div className="px-6 max-w-5xl mx-auto">
        
        {/* TAB: ESTUDIOS (Acá integramos tu subida de archivos) */}
        {activeTab === 'files' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">Estudios y Archivos</h2>
              {/* AQUÍ ESTÁ EL BOTÓN DE SUBIDA */}
              <UploadButton petId={pet.id} onUploadSuccess={fetchPet} />
            </div>

            {pet.attachments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                <Paperclip className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500">No hay archivos guardados aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pet.attachments.map((file: any) => (
                  <a 
                    key={file.id} 
                    href={file.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="group relative aspect-square bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all"
                  >
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="text-emerald-600" />
                    </div>
                    <span className="text-xs text-center font-medium text-gray-600 dark:text-gray-300 truncate w-full px-2">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: RESUMEN (Ejemplo) */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Syringe size={18} className="text-emerald-500" /> Próximas Vacunas
               </h3>
               {pet.vaccinations.length > 0 ? (
                 <ul className="space-y-3">
                   {pet.vaccinations.map((v: any) => (
                     <li key={v.id} className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                       <span>{v.name}</span>
                       <span className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                         {new Date(v.dateApplied).toLocaleDateString()}
                       </span>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm text-gray-400">No hay vacunas registradas.</p>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}