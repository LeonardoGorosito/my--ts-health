import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import  UserProfile  from '../pages/UserProfile'
import { Settings } from '../pages/Settings'

// --- 4. PÁGINAS PÚBLICAS ---
import { PublicPetProfile } from '../pages/public/PublicPetProfile' 
import LandingPage from '../pages/public/LandingPage'
import { Terms } from '../pages/public/Terms'
import { Privacy } from '../pages/public/Privacy'
import { MyPlan } from '../pages/MyPlan'
import { LostPoster } from '../pages/pets/LostPoster'
import { PetRecord } from '../pages/pets/PetRecord'
import { VetRecord } from '../pages/public/VetRecord'
import { AcceptInvite } from '../pages/AcceptInvite'
import { ClinicSignup } from '../pages/clinic/ClinicSignup'
import { ClinicShell } from '../pages/clinic/ClinicShell'
import { ClinicHome } from '../pages/clinic/ClinicHome'
import { ClinicClients, ClinicClientDetail } from '../pages/clinic/ClinicClients'
import { ClinicPatient } from '../pages/clinic/ClinicPatient'
import { ClinicRecordForm } from '../pages/clinic/ClinicRecordForm'
import { ClinicTeam, ClinicInviteAccept } from '../pages/clinic/ClinicTeam'
import { ClinicSettings } from '../pages/clinic/ClinicSettings'
import { AdminPlans } from '../pages/AdminPlans'

// ------------------------------------------------------------------
// COMPONENTE BARRERA: Evita que un usuario logueado vuelva al Login
// ------------------------------------------------------------------
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="p-6 text-emerald-600 font-bold text-center mt-20">Cargando...</div>
  if (user) {
    // Si ya entró, lo mandamos a donde venía (?next=/ruta interna) o a la app
    const next = new URLSearchParams(location.search).get('next')
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app'
    return <Navigate to={safeNext} replace />
  }
  
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
      <Route path="/terminos" element={<Terms />} />
      <Route path="/privacidad" element={<Privacy />} />
      {/* Los precios están en la landing; /precios queda como atajo a esa sección */}
      <Route path="/precios" element={<Navigate to={{ pathname: '/', hash: '#precios' }} replace />} />
      
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
      {/* Ficha de solo lectura para el veterinario (link temporal, sin cuenta) */}
      <Route path="/vet/:token" element={<VetRecord />} />
      {/* Invitación de la familia: funciona con o sin sesión iniciada */}
      <Route path="/invitacion/:token" element={<AcceptInvite />} />
      {/* Invitación al equipo de una veterinaria (con o sin sesión) */}
      <Route path="/clinica/invitacion/:token" element={<ClinicInviteAccept />} />

      {/* =================================================================
          ZONA PRIVADA (Requiere iniciar sesión)
          ================================================================= */}
      {/* Todo lo que esté acá adentro tendrá el Navbar superior (MainLayout) */}
      <Route path="/app" element={<MainLayout />}>
        {/* Lista de todas las mascotas del usuario */}
        <Route index element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
        
        {/* QR Code Page */}
        <Route path="qr" element={<ProtectedRoute><PetQrPage /></ProtectedRoute>} />

        {/* Plan y suscripción */}
        <Route path="plan" element={<ProtectedRoute><MyPlan /></ProtectedRoute>} />

        {/* Perfil detallado de una mascota en particular */}
        <Route path="pets/:id" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
      </Route>

      {/* Afiche "Se busca": pantalla completa, sin navbar (para imprimir limpio) */}
      <Route path="/app/pets/:id/afiche" element={<ProtectedRoute><LostPoster /></ProtectedRoute>} />
      <Route path="/app/pets/:id/ficha" element={<ProtectedRoute><PetRecord /></ProtectedRoute>} />

      {/* Otras rutas con el Layout Principal */}
      <Route element={<MainLayout />}>
        <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminPlans /></ProtectedRoute>} />

        {/* VETERINARIAS: alta con matrícula y sección de gestión de la clínica */}
        <Route path="/veterinarias/registro" element={<ProtectedRoute><ClinicSignup /></ProtectedRoute>} />
        <Route path="/clinica" element={<ProtectedRoute><ClinicShell /></ProtectedRoute>}>
          <Route index element={<ClinicHome />} />
          <Route path="clientes" element={<ClinicClients />} />
          <Route path="clientes/:clientId" element={<ClinicClientDetail />} />
          <Route path="pacientes/:patientId" element={<ClinicPatient />} />
          <Route path="pacientes/:patientId/consulta/nueva" element={<ClinicRecordForm />} />
          <Route path="pacientes/:patientId/consulta/:recordId" element={<ClinicRecordForm />} />
          <Route path="equipo" element={<ClinicTeam />} />
          <Route path="datos" element={<ClinicSettings />} />
        </Route>
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
