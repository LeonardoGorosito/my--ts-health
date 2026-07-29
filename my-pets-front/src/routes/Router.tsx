import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// --- 1. LAYOUTS Y PROTECCIÓN ---
import MainLayout from '../components/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'

// --- 2. PÁGINAS DE AUTENTICACIÓN ---
import AuthPage from '../pages/AuthPage' 
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'

// --- 3. PÁGINAS PRIVADAS (App Principal) ---
import { PetsList } from '../pages/pets/PetList'
import { PetProfile } from '../pages/pets/PetProfile'
import { PetQrPage } from '../pages/pets/PetQrPage'

// --- 4. PÁGINAS PÚBLICAS ---
import { PublicPetProfile } from '../pages/public/PublicPetProfile' 
import LandingPage from '../pages/public/LandingPage'

// ------------------------------------------------------------------
// COMPONENTE BARRERA: Evita que un usuario logueado vuelva al Login
// ------------------------------------------------------------------
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="p-6 text-emerald-600 font-bold text-center mt-20">Cargando...</div>
  if (user) return <Navigate to="/app" replace /> // Si ya entró, lo mandamos a la app
  
  return <>{children}</> 
}

// ------------------------------------------------------------------
// ENRUTADOR PRINCIPAL DE LA APP
// ------------------------------------------------------------------
export function AppRouter() {
  const { user } = useAuth(); 

  return (
    <Routes>
      {/* --- RUTA RAÍZ PÚBLICA --- */}
      <Route path="/" element={<LandingPage />} />
      
      {/* =================================================================
          ZONA DE AUTENTICACIÓN (Solo para visitantes)
          ================================================================= */}
      <Route path="/login" element={<AuthGate><AuthPage initialRegister={false} /></AuthGate>} />
      <Route path="/register" element={<AuthGate><AuthPage initialRegister={true} /></AuthGate>} />
      <Route path="/forgot-password" element={<AuthGate><ForgotPassword /></AuthGate>} />
      <Route path="/reset-password" element={<AuthGate><ResetPassword /></AuthGate>} />

      {/* =================================================================
          ZONA PÚBLICA (Accesible por cualquier persona en el mundo)
          ================================================================= */}
      {/* La placa digital del collar (QR) */}
      <Route path="/public/pet/:id" element={<PublicPetProfile />} />

      {/* =================================================================
          ZONA PRIVADA (Requiere iniciar sesión)
          ================================================================= */}
      {/* Todo lo que esté acá adentro tendrá el Navbar superior (MainLayout) */}
      <Route path="/app" element={<MainLayout />}>
        {/* Lista de todas las mascotas del usuario */}
        <Route index element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
        
        {/* QR Code Page */}
        <Route path="qr" element={<ProtectedRoute><PetQrPage /></ProtectedRoute>} />

        {/* Perfil detallado de una mascota en particular */}
        <Route path="pets/:id" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
      </Route>
      
      {/* --- RUTA SALVAVIDAS (Catch-all) --- */}
      {/* Si alguien escribe una URL que no existe, lo mandamos a un lugar seguro */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/app" : "/"} replace />} 
      />
    </Routes>
  )
}
