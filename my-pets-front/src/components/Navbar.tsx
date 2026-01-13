import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false) 

  const closeMenu = () => setIsOpen(false)

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
    }`
  
  const getMobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-base font-medium flex items-center ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
  }`

  return (
    <nav className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* --- 1. LOGO --- */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
            onClick={closeMenu}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <img className="w-6 h-6" src="/img/logo-blu_7eam.png" alt="Logo" />
            </div>
            <span className="font-bold text-xl text-blue-600 group-hover:text-gray-900 transition-colors">
              Blue 7eam Alumnas
            </span>
          </Link>

          {/* --- 2. LINKS DESKTOP --- */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/courses" className={getNavLinkClass}>
              Masters
            </NavLink>

            {/* --- SECCIÓN ADMIN --- */}
            {user?.role === 'ADMIN' && (
              <>
                {/* Botón VENTAS */}
                <NavLink to="/admin/orders" className={getNavLinkClass}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ventas
                </NavLink>

                {/* Botón ALUMNAS */}
                <NavLink to="/admin/students" className={getNavLinkClass}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Alumnas
                </NavLink>

                {/* NUEVO: Botón INGRESOS (Revenue) */}
                <NavLink to="/admin/revenue" className={getNavLinkClass}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Ingresos
                </NavLink>
              </>
            )}
          </div>

          {/* --- 3. LOGIN / USUARIO DESKTOP --- */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NavLink to="/account" className={getNavLinkClass}>
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  Mi cuenta
                </NavLink>
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                Ingresar
              </Link>
            )}
          </div>

          {/* --- 4. HAMBURGUESA --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-blue-100"
            >
              {isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- 5. MENÚ MÓVIL --- */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-16 left-0 w-full z-40 border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/courses" className={getMobileNavLinkClass} onClick={closeMenu}>
              Masters
            </NavLink>
            
            {/* ADMIN LINKS MÓVIL */}
            {user?.role === 'ADMIN' && (
              <>
                <NavLink to="/admin/orders" className={getMobileNavLinkClass} onClick={closeMenu}>
                  <span className="mr-2">💰</span> Ventas
                </NavLink>
                <NavLink to="/admin/students" className={getMobileNavLinkClass} onClick={closeMenu}>
                  <span className="mr-2">👥</span> Alumnas
                </NavLink>
                {/* NUEVO LINK MÓVIL */}
                <NavLink to="/admin/revenue" className={getMobileNavLinkClass} onClick={closeMenu}>
                  <span className="mr-2">📈</span> Ingresos
                </NavLink>
              </>
            )}

            {user ? (
              <>
                <NavLink to="/account" className={getMobileNavLinkClass} onClick={closeMenu}>
                  Mi Cuenta
                </NavLink>
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Salir
                </button>
              </>
            ) : (
              <NavLink to="/login" className={getMobileNavLinkClass} onClick={closeMenu}>
                Ingresar
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}