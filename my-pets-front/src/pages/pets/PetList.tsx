import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { PetCard } from '../../components/PetCard'
import { AddPetModal } from '../../components/AddPetModal'
import { useAuth } from '../../context/AuthContext'
import { Plus } from 'lucide-react'
import { Loader } from '../../components/Loader'

export function PetsList() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: pets, isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      console.log('🐾 Iniciando petición GET a /pets...')
      try {
        const r = await api.get('/pets')
        console.log('✅ Respuesta completa del backend:', r)
        console.log('📦 Payload (r.data):', r.data)
        
        // Manejo seguro por si el backend devuelve un objeto { pets: [...] } o similar
        let data = r.data
        if (data && !Array.isArray(data)) {
          if (Array.isArray(data.pets)) data = data.pets
          else if (Array.isArray(data.data)) data = data.data
        }
        
        const finalPets = Array.isArray(data) ? data : []
        console.log('🐕 Mascotas a renderizar (array validado):', finalPets)
        return finalPets
      } catch (error) {
        console.error('❌ Error al fetchear mascotas:', error)
        throw error
      }
    }
  })

  const handlePetAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['pets'] })
    setIsModalOpen(false)
  }

  // Pantalla de carga
  if (isLoading) return <Loader text="Buscando tus peludos..." />

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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 dark:shadow-none transition-all flex items-center gap-2 group whitespace-nowrap"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Agregar Mascota
          </button>
        </header>

        {/* GRILLA DE MASCOTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pets?.map((pet: any) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>

        {/* ESTADO VACÍO */}
        {(!pets || pets.length === 0) && (
          <div className="text-center py-20 bg-gray-50 dark:bg-bg-card rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-lg">
              No tienes mascotas registradas.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              ¡Agregá la primera!
            </button>
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