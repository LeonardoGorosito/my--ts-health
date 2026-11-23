import { useNavigate } from 'react-router-dom'
import { Card } from './Card'
import { Cat, Dog, Heart, ArrowRight, Siren, Users } from 'lucide-react'

type PetCardProps = {
  pet: {
    id: string
    name: string
    species: 'CAT' | 'DOG'
    breed?: string | null
    isCastrated: boolean
    profileImageUrl?: string | null // <--- Agregamos esto para leer la foto
    isLost?: boolean
    gender?: string | null
    access?: 'OWNER' | 'CAREGIVER'
    owner?: { name: string; lastname: string }
  }
}

export function PetCard({ pet }: PetCardProps) {
  const navigate = useNavigate();

  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/app/pets/${pet.id}`);
  };

  return (
    <Card className="p-5 bg-white dark:bg-bg-card shadow-sm hover:shadow-xl dark:hover:shadow-none transition-all duration-300">
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          
          {/* FOTO O ICONO */}
          <div className="w-14 h-14 flex-shrink-0"> 
             {pet.profileImageUrl ? (
                // Si tiene foto, la mostramos
                <img 
                  src={pet.profileImageUrl} 
                  alt={pet.name} 
                  className="w-full h-full object-cover rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm"
                />
             ) : (
                // Si NO tiene foto, mostramos el ícono por defecto
                <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                   {pet.species === 'CAT' ? <Cat size={24} /> : <Dog size={24} />}
                </div>
             )}
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 leading-tight">{pet.name}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{pet.breed || (pet.gender === 'Hembra' ? 'Mestiza' : 'Mestizo')}</p>
          </div>
        </div>

        {pet.isLost && (
          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg animate-pulse">
            <Siren size={12} aria-hidden="true" /> Perdida
          </span>
        )}
      </div>

      {pet.access === 'CAREGIVER' && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
          <Users size={13} aria-hidden="true" /> Compartida por {pet.owner?.name}
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-gray-50 dark:border-gray-800/50 pt-4 text-xs font-bold text-gray-600 dark:text-gray-400">
        <Heart size={14} aria-hidden="true" className={pet.isCastrated ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400 dark:text-gray-600'} />
        {pet.isCastrated ? (pet.gender === 'Hembra' ? 'Castrada' : 'Castrado') : 'Pendiente de castración'}
      </div>

      <div className="mt-6">
        <button 
          onClick={handleViewProfile}
          className="group w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-900/10"
        >
          Ver perfil completo
          <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
        </button>
      </div>
    </Card>
  )
}