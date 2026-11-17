import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { PetCard } from '../../components/PetCard'
import { AddPetModal } from '../../components/AddPetModal'
import { useAuth } from '../../context/AuthContext'
import { Plus } from 'lucide-react'
import { Loader } from '../../components/Loader'
import { Placo } from '../../components/brand/Placo'
import { useSubscription } from '../../hooks/useSubscription'
import { Link } from 'react-router-dom'

export function PetsList() {
  const { user } = useAuth()
  const { limits } = useSubscription()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: pets, isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const r = await api.get('/pets')

      // Manejo seguro por si el backend devuelve un objeto { pets: [...] } o similar
      let data = r.data
      if (data && !Array.isArray(data)) {
        if (Array.isArray(data.pets)) data = data.pets
        else if (Array.isArray(data.data)) data = data.data
      }

      return Array.isArray(data) ? data : []
    }
  })

  const handlePetAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['pets'] })
    setIsModalOpen(false)
  }

  // Pantalla de carga
  if (isLoading) return <Loader text="Buscando tus peludos..." />

  // ¿El plan permite agregar otra mascota? (el backend lo controla igual)
  const petCount = pets?.length ?? 0
  const atPetLimit = limits.maxPets !== null && petCount >= limits.maxPets
  const canAddPet = !limits.readOnly && !atPetLimit
  const limitLabel = limits.readOnly ? 'Elegí un plan para agregar' : `Tu plan permite ${limits.maxPets} · Pasate a Pro`

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">
              Mis Mascotas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
              ¡Hola, {user?.name}! Tenés <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pets?.length || 0} peludos</span> a cargo.
            </p>
          </div>
          {canAddPet ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 dark:shadow-none transition-all flex items-center gap-2 group whitespace-nowrap"
            >
              <Plus size={20} aria-hidden="true" className="group-hover:rotate-90 transition-transform motion-reduce:transition-none" />
              Agregar Mascota
            </button>
          ) : (
            <Link
              to="/app/plan"
              className="border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 px-5 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap"
            >
              {limitLabel}
            </Link>
          )}
        </header>

        {/* GRILLA DE MASCOTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pets?.map((pet: any) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>

        {/* ESTADO VACÍO */}
        {(!pets || pets.length === 0) && (
          <div className="text-center py-16 bg-gray-50 dark:bg-bg-card rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center">
            <Placo size={120} className="mb-4" title="Placo esperando a tu primera mascota" />
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-lg">
              Soy Placo y todavía no conozco a tus mascotas.
            </p>
            {canAddPet ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
              >
                ¡Agregá la primera!
              </button>
            ) : (
              <Link to="/app/plan" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all">
                Elegí un plan para empezar
              </Link>
            )}
          </div>
        )}
      </div>

      <AddPetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onPetAdded={handlePetAdded}
      />
    </>
  )
}