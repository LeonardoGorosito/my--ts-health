// En src/pages/pets/PetList.tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { PetCard } from '../../components/PetCard'

export function PetsList() {
  // TanStack Query se encarga de pedir los datos y manejar el loading
  const { data: pets, isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const r = await api.get('/pets')
      return r.data
    }
  })

  if (isLoading) return <div className="p-10 text-center">Cargando tus peludos...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mis Mascotas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pets?.map((pet: any) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
        {pets?.length === 0 && (
          <p className="text-gray-500">Todavía no tenés mascotas registradas. ¡Agregá la primera!</p>
        )}
      </div>
    </div>
  )
}