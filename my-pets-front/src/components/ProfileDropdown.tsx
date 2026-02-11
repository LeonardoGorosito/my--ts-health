import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { 
  User, 
  Settings, 
  Monitor, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronRight 
} from 'lucide-react'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER: El Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none group"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white transition-all ${isOpen ? 'ring-2 ring-emerald-500' : ''} bg-emerald-600 shadow-lg shadow-emerald-900/20 group-hover:scale-105`}>
          {user?.name?.[0].toUpperCase()}
        </div>
      </button>

      {/* DROPDOWN MENU */}
      <div className={`
        absolute right-0 mt-3 w-72 p-2 rounded-3xl shadow-2xl dropdown-bounce z-50
        bg-white dark:bg-bg-card border border-gray-100 dark:border-neutral-800
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
      `}>
        
        {/* Links de Usuario */}
        <div className="space-y-1">
          <MenuLink to="/account" icon={<User size={18} />} label="Mi Perfil" onClick={() => setIsOpen(false)} />
          <MenuLink to="/settings" icon={<Settings size={18} />} label="Configuración" onClick={() => setIsOpen(false)} />
          <MenuLink to="/devices" icon={<Monitor size={18} />} label="Dispositivos" onClick={() => setIsOpen(false)} />
        </div>

        <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />

        {/* DARK MODE SWITCH (Estilo Atheros) */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Modo Oscuro</span>
          </div>
          <button 
            onClick={toggle}
            className={`w-10 h-5 rounded-full transition-colors relative ${isDark ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-neutral-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDark ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />

        {/* INFO DE CUENTA ACTUAL (Estilo imagen 006) */}
        <div className="px-4 py-3 flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-900 dark:text-gray-100 leading-none">{user?.name}</span>
              <span className="text-[9px] font-bold text-gray-400 truncate w-32 uppercase tracking-tighter mt-1">{user?.email}</span>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>

        <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />

        {/* SIGN OUT */}
        <button
          onClick={() => { logout(); setIsOpen(false); }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          <LogOut size={16} />
          Cerrar todas las sesiones
        </button>
      </div>
    </div>
  )
}

// Subcomponente para los links
function MenuLink({ to, icon, label, onClick }: { to: string, icon: any, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold uppercase tracking-widest text-[10px]">{label}</span>
      </div>
      <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  )
}