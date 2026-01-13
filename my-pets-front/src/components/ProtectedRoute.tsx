import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'  

export default function ProtectedRoute(
  { children, roles }: { children: ReactNode; roles?: Array<'USER' | 'ADMIN'> }
) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}
