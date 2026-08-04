import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { Menu, X, ShieldCheck, Heart, Plus, Bell, Syringe, Pill } from 'lucide-react'
import { ProfileDropdown } from './ProfileDropdown'
import { NotificationsModal } from './NotificationsModal'

export type Alert = {
  id: string;
  petId?: string;
  petName: string;
  type: 'VACCINE' | 'DEWORMING';
  name: string;
  dueDate: Date;
  status: 'OVERDUE' | 'UPCOMING';
  daysLeft: number;
}

// --- 1. COMPONENTE AISLADO PARA LAS NOTIFICACIONES ---
// Esto soluciona el bug de escritorio vs móvil
const NotificationDropdown = ({ alerts, onOpenFullModal }: { alerts: Alert[], onOpenFullModal: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysText = (days: number) => {
    if (days < 0) return `Venció hace ${Math.abs(days)} días`
    if (days === 0) return 'Vence hoy'
    if (days === 1) return 'Vence mañana'
    return `Vence en ${days} días`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
      >
        <Bell size={22} />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shadow-red-500/50 animate-pulse">
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-bg-matte border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-gray-800 dark:text-white">Notificaciones</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Todo al día. No hay alertas pendientes. 🎉
              </div>
            ) : (
              <div className="flex flex-col">
                {alerts.map((alert) => (
                  <Link 
                    key={alert.id}
                    to={`/app/pets/${alert.petId}`} 
                    onClick={() => setIsOpen(false)}
                    className="p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex gap-3 items-start"
                  >
                    <div className={`p-2 rounded-full ${alert.type === 'VACCINE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {alert.type === 'VACCINE' ? <Syringe size={16} /> : <Pill size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-bold">{alert.petName}</span> necesita: {alert.name}
                      </p>
                      <p className={`text-xs font-semibold mt-1 ${alert.daysLeft <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {getDaysText(alert.daysLeft)}
                      </p>
                    </div>
                  </Link>
                ))}
                {alerts.length > 0 && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenFullModal();
                    }}
                    className="w-full text-center p-3 text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-t border-gray-100 dark:border-gray-800"
                  >
                    Ver todas las notificaciones
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- 2. NAVBAR PRINCIPAL ---
export default function Navbar() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullModalOpen, setIsFullModalOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)

  const { data: pets } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const r = await api.get('/pets')
      return r.data
    },
    enabled: !!user
  })

  const alerts = useMemo(() => {
    if (!pets) return []
    const newAlerts: Alert[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    pets.forEach((pet: any) => {
      // 1. Chequear Vacunas
      pet.vaccinations?.forEach((v: any) => {
        if (v.nextDueDate) {
          const dueDate = new Date(v.nextDueDate)
          dueDate.setHours(0, 0, 0, 0)
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays < 0) {
            newAlerts.push({ id: `vac-${v.id}`, petId: pet.id, petName: pet.name, type: 'VACCINE', name: v.name, dueDate, status: 'OVERDUE', daysLeft: diffDays })
          } else if (diffDays <= 15) {
            newAlerts.push({ id: `vac-${v.id}`, petId: pet.id, petName: pet.name, type: 'VACCINE', name: v.name, dueDate, status: 'UPCOMING', daysLeft: diffDays })
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
            newAlerts.push({ id: `dew-${d.id}`, petId: pet.id, petName: pet.name, type: 'DEWORMING', name: d.name || d.product || 'Desparasitación', dueDate, status: 'OVERDUE', daysLeft: diffDays })
          } else if (diffDays <= 15) {
            newAlerts.push({ id: `dew-${d.id}`, petId: pet.id, petName: pet.name, type: 'DEWORMING', name: d.name || d.product || 'Desparasitación', dueDate, status: 'UPCOMING', daysLeft: diffDays })
          }
        }
      })
    })

    return newAlerts.sort((a, b) => a.daysLeft - b.daysLeft)
  }, [pets])

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border-2 ${
      isActive
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400' 
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
    }`

  return (
    <nav className="bg-white dark:bg-bg-matte border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md bg-white/80 dark:bg-bg-matte/90">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-20">
          
          <Link to="/app" className="flex items-center gap-3 group" onClick={closeMenu}>
            <div className="relative flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <div className="flex gap-0.5 mb-[2px]">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full -mt-1"></div>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full -mt-1"></div>
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="relative">
                 <Heart className="w-8 h-8 text-emerald-600 fill-emerald-600" strokeWidth={0} />
                 <Plus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={16} strokeWidth={4} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl leading-none text-gray-900 dark:text-white tracking-tighter">
                Pet<span className="text-emerald-600">Health</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 ml-8">
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin/users" className={getNavLinkClass}>
                <ShieldCheck size={18} />
                Admin
              </NavLink>
            )}
          </div>

          {/* DERECHA DESKTOP */}
          <div className="hidden md:flex items-center ml-auto gap-3">
            {user ? (
              <>
                <NotificationDropdown alerts={alerts} onOpenFullModal={() => setIsFullModalOpen(true)} />
                <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div>
                <ProfileDropdown />
              </>
            ) : (
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* CONTROLES MOBILE */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <>
                <NotificationDropdown alerts={alerts} onOpenFullModal={() => setIsFullModalOpen(true)} />
                <ProfileDropdown />
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-bg-matte border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-300">
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin/users" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800" onClick={closeMenu}>
              <ShieldCheck size={20} /> Admin
            </NavLink>
          )}
          {!user && (
            <Link to="/login" className="block text-center p-4 bg-emerald-600 text-white rounded-xl font-bold mt-4" onClick={closeMenu}>
              Ingresar
            </Link>
          )}
        </div>
      )}

      <NotificationsModal 
        isOpen={isFullModalOpen} 
        onClose={() => setIsFullModalOpen(false)} 
        alerts={alerts} 
      />
    </nav>
  )
}
