import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from '../pages/AuthPage' 
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../components/MainLayout'
import { useAuth } from '../context/AuthContext'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import { PetsList } from '../pages/pets/PetList'
import { PetProfile } from '../pages/pets/PetProfile' // <--- 1. IMPORTAR ESTO

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Cargando...</div>
  if (user) return <Navigate to="/pets" replace />
  return <>{children}</> 
}

export function AppRouter() {
  const { user } = useAuth(); 

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route 
        path="/login" 
        element={
          <AuthGate>
            <AuthPage initialRegister={false} />
          </AuthGate>
        } 
      />

      <Route 
        path="/register" 
        element={
          <AuthGate>
            <AuthPage initialRegister={true} />
          </AuthGate>
        } 
      />

      <Route path="/forgot-password" element={<AuthGate><ForgotPassword /></AuthGate>} />
      <Route path="/reset-password" element={<AuthGate><ResetPassword /></AuthGate>} />

      <Route element={<MainLayout />}>
        {/* Lista de mascotas */}
        <Route path="/pets" element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
        
        {/* 2. NUEVA RUTA: Perfil individual */}
        <Route path="/pets/:id" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
      </Route>
      
      <Route 
        path="*" 
        element={<Navigate to={user ? "/pets" : "/login"} replace />} 
      />
    </Routes>
  )
}