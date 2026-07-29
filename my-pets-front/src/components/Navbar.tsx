import { useState, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'
import { LayoutDashboard, Menu, X, ShieldCheck, Heart, Plus, Bell } from 'lucide-react'
import { ProfileDropdown } from './ProfileDropdown'

export default function Navbar() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  // 1. Buscamos las mascotas (React Query lo saca del caché si ya estamos en el Home)
  const { data: pets } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const r = await api.get('/pets')
      return r.data
    },
    enabled: !!user // Solo lo ejecutamos si el usuario ya inició sesión
  })

  // 2. Calculamos las notificaciones globalmente
  const alertCount = useMemo(() => {
    if (!pets) return 0
    let count = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    pets.forEach((pet: any) => {
      // Contar vacunas por vencer (o vencidas)
      pet.vaccinations?.forEach((v: any) => {
        if (v.nextDueDate) {
          const diff = Math.ceil((new Date(v.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (diff <= 15) count++
        }
      })
      // Contar desparasitaciones por vencer (o vencidas)
      pet.dewormings?.forEach((d: any) => {
        if (d.nextDueDate) {
          const diff = Math.ceil((new Date(d.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (diff <= 15) count++
        }
      })
    })
    return count
  }, [pets])

  // Estilos de los links
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border-2 ${
      isActive
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400' 
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
    }`

  // Mini componente para no repetir el icono de la campana
  const NotificationBell = () => (
    <Link 
      to="/app" 
      onClick={closeMenu}
      className="relative p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
    >
      <Bell size={22} />
      {alertCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shadow-red-500/50 animate-pulse">
          {alertCount}
        </span>
      )}
    </Link>
  )

  return (
    <nav className="bg-white dark:bg-bg-matte border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300 backdrop-blur-md bg-white/80 dark:bg-bg-matte/90">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* --- 1. LOGO --- */}
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

          {/* --- 2. LINKS DESKTOP --- */}
          <div className="hidden md:flex items-center gap-2 ml-8">
            <NavLink to="/app" end className={getNavLinkClass}>
              <LayoutDashboard size={18} />
              Mis Mascotas
            </NavLink>

            {user?.role === 'ADMIN' && (
              <NavLink to="/admin/users" className={getNavLinkClass}>
                <ShieldCheck size={18} />
                Admin
              </NavLink>
            )}
          </div>

          {/* --- 3. DERECHA (Dropdown o Login) --- */}
          <div className="hidden md:flex items-center ml-auto gap-3">
            {user ? (
              <>
                <NotificationBell />
                <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div> {/* Separador sutil */}
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

          {/* --- 4. CONTROLES MOBILE --- */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <>
                <NotificationBell />
                <ProfileDropdown />
              </>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 5. MENÚ MÓVIL --- */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-bg-matte border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-300">
          <NavLink 
            to="/app"
            end
            className={({ isActive }) => `flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50'
            }`}
            onClick={closeMenu}
          >
            <LayoutDashboard size={20} /> Mis Mascotas
          </NavLink>
          
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
    </nav>
  )
}