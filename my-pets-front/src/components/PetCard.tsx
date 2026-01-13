import { Card } from './Card'
import { Button } from './Button'
import { Cat, Dog, Heart, Syringe } from 'lucide-react'

type PetCardProps = {
  pet: {
    id: string
    name: string
    species: 'CAT' | 'DOG'
    breed?: string | null
    specialNeeds?: string | null
    isCastrated: boolean
  }
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            {pet.species === 'CAT' ? <Cat size={24} /> : <Dog size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
            <p className="text-sm text-gray-500">{pet.breed || 'Raza no definida'}</p>
          </div>
        </div>
        {pet.specialNeeds && (
          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
            Atención Especial
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Heart size={14} className={pet.isCastrated ? 'text-green-500' : 'text-gray-400'} />
          {pet.isCastrated ? 'Castrado' : 'Pendiente'}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button  className="text-xs py-1 h-auto">Ver Historial</Button>
        <Button className="text-xs py-1 h-auto flex gap-1 items-center">
          <Syringe size={14} /> Vacunar
        </Button>
      </div>
    </Card>
  )
}