import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cat, LayoutDashboard, Menu, X, ShieldCheck } from 'lucide-react'
import { ProfileDropdown } from './ProfileDropdown'

export default function Navbar() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
      isActive
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none'
        : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
    }`

  return (
    <nav className="bg-white dark:bg-bg-matte border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-18">
          
                      {/* --- 1. LOGO --- */}
                      <Link to="/pets" className="flex items-center gap-2 group" onClick={closeMenu}>
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                <Cat className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl leading-none text-gray-900 dark:text-white tracking-tighter uppercase">
                  Pet<span className="text-emerald-600">Health</span>
                </span>
                {/* La barra verde decorativa */}
                <div className="h-1 w-full bg-emerald-600 rounded-full mt-1 transform origin-left scale-x-100 group-hover:scale-x-110 transition-transform duration-300" />
              </div>
            </Link>

          {/* --- 2. LINKS DESKTOP --- */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/pets" className={getNavLinkClass}>
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

          {/* --- 3. ACCIONES USUARIO (Solo Dropdown) --- */}
          <div className="hidden md:flex items-center">
            {user ? (
              <ProfileDropdown />
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
            {/* Si está logueado en móvil, mostramos el dropdown también */}
            {user && <ProfileDropdown />}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 5. MENÚ MÓVIL (Links) --- */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-bg-matte border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-300">
          <NavLink to="/pets" className="flex items-center gap-3 p-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={closeMenu}>
            <LayoutDashboard size={20} /> Mis Mascotas
          </NavLink>
          
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin/users" className="flex items-center gap-3 p-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={closeMenu}>
              <ShieldCheck size={20} /> Admin
            </NavLink>
          )}

          {!user && (
            <Link to="/login" className="block text-center p-4 bg-emerald-600 text-white rounded-xl font-bold" onClick={closeMenu}>
              Ingresar
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}