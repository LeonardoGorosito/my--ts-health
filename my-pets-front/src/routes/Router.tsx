import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register' 
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../context/AuthContext'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import { PetsList } from '../pages/pets/PetList'

//  AuthGate ...
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Cargando...</div>
  // Corregido: Redirigir a /pets
  if (user) return <Navigate to="/pets" replace />
  return <>{children}</> 
}

export function AppRouter() {
  const { user } = useAuth(); // Para el catch-all inteligente

  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route 
        path="/login" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <AuthGate><Login /></AuthGate>
          </div>
        } 
      />

      <Route path="/register" element={<AuthGate><Register /></AuthGate>} />
      <Route path="/forgot-password" element={<AuthGate><ForgotPassword /></AuthGate>} />
      <Route path="/reset-password" element={<AuthGate><ResetPassword /></AuthGate>} />

      {/* 2. RUTAS PRIVADAS (CON NAVBAR) */}
      <Route element={<MainLayout />}>
        {/* Corregido: Path unificado a /pets */}
        <Route path="/pets" element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
      </Route>
      
      {/* 3. CATCH-ALL INTELIGENTE */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/pets" : "/login"} replace />} 
      />
    </Routes>
  )
}