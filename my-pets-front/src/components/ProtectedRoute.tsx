import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'
// Asumiendo que ProtectedRoute y Loader están en la misma carpeta "components"
// Si están en carpetas distintas, ajustá la ruta (ej: '../components/Loader')
import { Loader } from './Loader' 

export default function ProtectedRoute(
  { children, roles }: { children: ReactNode; roles?: Array<'USER' | 'ADMIN'> }
) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // CAMBIO AQUÍ: Usamos el Loader con fullScreen
  if (loading) return <Loader text="Verificando sesión..." fullScreen={true} />

  // Después de iniciar sesión vuelve a esta página (ver AuthGate)
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}