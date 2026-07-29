import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { PetCard } from '../../components/PetCard'
import { AddPetModal } from '../../components/AddPetModal'
import { useAuth } from '../../context/AuthContext'
import { Plus, BellRing, AlertTriangle, Syringe, Pill, CheckCircle2 } from 'lucide-react'
import { Loader } from '../../components/Loader'

// Tipo para estructurar nuestras alertas
type Alert = {
  id: string;
  petName: string;
  type: 'VACCINE' | 'DEWORMING';
  name: string;
  dueDate: Date;
  status: 'OVERDUE' | 'UPCOMING';
  daysLeft: number;
}

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

  // --- LÓGICA DE ALERTAS (Magia pura ✨) ---
  const alerts = useMemo(() => {
    if (!pets) return []
    const newAlerts: Alert[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalizamos a las 00:00 para comparar bien

    pets.forEach((pet: any) => {
      // 1. Chequear Vacunas
      pet.vaccinations?.forEach((v: any) => {
        if (v.nextDueDate) {
          const dueDate = new Date(v.nextDueDate)
          dueDate.setHours(0, 0, 0, 0)
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
            newAlerts.push({ id: `vac-${v.id}`, petName: pet.name, type: 'VACCINE', name: v.name, dueDate, status: 'OVERDUE', daysLeft: diffDays })
          } else if (diffDays <= 15) { // Avisa con 15 días de anticipación
            newAlerts.push({ id: `vac-${v.id}`, petName: pet.name, type: 'VACCINE', name: v.name, dueDate, status: 'UPCOMING', daysLeft: diffDays })
          }
        }
      })

      // 2. Chequear Desparasitaciones
      pet.dewormings?.forEach((d: any) => {
        if (d.nextDueDate) {
          const dueDate = new Date(d.nextDueDate)
          dueDate.setHours(0, 0, 0, 0)
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
            newAlerts.push({ id: `dew-${d.id}`, petName: pet.name, type: 'DEWORMING', name: d.name, dueDate, status: 'OVERDUE', daysLeft: diffDays })
          } else if (diffDays <= 15) {
            newAlerts.push({ id: `dew-${d.id}`, petName: pet.name, type: 'DEWORMING', name: d.name, dueDate, status: 'UPCOMING', daysLeft: diffDays })
          }
        }
      })
    })

    // Ordenamos: Las más urgentes primero (los números más negativos o cercanos a cero)
    return newAlerts.sort((a, b) => a.daysLeft - b.daysLeft)
  }, [pets])


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

        {/* --- PANEL DE ALERTAS --- */}
        {(pets?.length ?? 0) > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <BellRing size={16} /> Notificaciones
            </h2>
            
            {alerts.length === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">¡Todo al día!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Tus mascotas no tienen vacunas ni desparasitaciones pendientes.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                      alert.status === 'OVERDUE' 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                        : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                    }`}
                  >
                    <div className={`p-2 rounded-full mt-0.5 ${
                      alert.status === 'OVERDUE' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-500' 
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500'
                    }`}>
                      {alert.status === 'OVERDUE' ? <AlertTriangle size={18} /> : (alert.type === 'VACCINE' ? <Syringe size={18} /> : <Pill size={18} />)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 dark:text-gray-100">{alert.petName}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          {alert.type === 'VACCINE' ? 'Vacuna' : 'Desparasitación'}
                        </span>
                      </div>
                      <p className={`text-sm font-medium mt-0.5 ${alert.status === 'OVERDUE' ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`}>
                         {alert.name} {alert.status === 'OVERDUE' ? 'está vencida' : 'vence pronto'}
                      </p>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">
                        {alert.status === 'OVERDUE' 
                          ? `Venció hace ${Math.abs(alert.daysLeft)} día${Math.abs(alert.daysLeft) !== 1 ? 's' : ''}` 
                          : `Toca en ${alert.daysLeft} día${alert.daysLeft !== 1 ? 's' : ''}`
                        } ({alert.dueDate.toLocaleDateString()})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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