import { Link } from 'react-router-dom'
import { Card } from './Card'
import { Cat, Dog, Heart, ArrowRight } from 'lucide-react'

type PetCardProps = {
  pet: {
    id: string
    name: string
    species: 'CAT' | 'DOG'
    breed?: string | null
    isCastrated: boolean
    profileImageUrl?: string | null // <--- Agregamos esto para leer la foto
  }
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <Card className="p-5 bg-white dark:bg-bg-card border-l-4 border-emerald-500 dark:border-emerald-600 shadow-sm hover:shadow-xl dark:hover:shadow-none transition-all duration-300">
      
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
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{pet.breed || 'Mestizo'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-gray-50 dark:border-gray-800/50 pt-4 text-xs font-bold text-gray-600 dark:text-gray-400">
        <Heart size={14} className={pet.isCastrated ? 'fill-emerald-500 text-emerald-500' : 'text-gray-300 dark:text-gray-700'} />
        {pet.isCastrated ? 'Castrado' : 'Pendiente de castración'}
      </div>

      <div className="mt-6">
        <Link 
          to={`/pets/${pet.id}`} 
          className="group w-full flex items-center justify-center gap-2 text-[10px] uppercase font-black py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-900/10"
        >
          Ver Perfil Completo 
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  )
}