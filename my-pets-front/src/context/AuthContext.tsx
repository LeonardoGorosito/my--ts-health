import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/axios'
import type { Tier } from '../lib/plans'

export type User = { 
  id: string; 
  email: string; 
  name: string;
  lastname: string;
  phone?: string | null; 
  address?: string | null;
  vetName?: string | null;
  vetPhone?: string | null;
  emergencyPhone?: string | null;
  emailReminders?: boolean;
  role: 'USER' | 'ADMIN'; 
  subscription?: Subscription;
  // Consentimiento: versión aceptada y versión vigente (si no coinciden, se pide aceptar de nuevo)
  termsVersion?: string | null;
  termsAcceptedAt?: string | null;
  currentTermsVersion?: string;
}

// Estado de la suscripción que devuelve /auth/me (ver my-pet-api/src/lib/subscription.ts)
export type Subscription = {
  tier: Tier;
  plan: 'STANDARD' | 'PRO' | null;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  limits: {
    maxPets: number | null; // null = ilimitadas
    reminders: boolean;
    attachments: boolean;
    readOnly: boolean;
  };
}

export type Preferences = {
  emailReminders: boolean;
}

// Campos editables desde "Mi Perfil" (PUT /auth/me)
export type ProfileUpdate = {
  name: string;
  lastname: string;
  phone?: string;
  address?: string;
  vetName?: string;
  vetPhone?: string;
  emergencyPhone?: string;
}

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (
    name: string,
    lastname: string,
    email: string,
    password: string,
    phone?: string 
  ) => Promise<void> 
  verifyEmail: (email: string, code: string) => Promise<void>
  updateProfile: (data: ProfileUpdate) => Promise<void>
  updatePreferences: (data: Preferences) => Promise<void>
  refreshUser: () => Promise<void>
  acceptTerms: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // <-- Este loading es SOLO para cuando abrís la app

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // CORRECCIÓN: Le sacamos el setLoading() global para que no te desmonte la pantalla
  const register = async (name: string, lastname: string, email: string, password: string, phone?: string) => {
    // Solo se llama después de marcar la casilla de Términos y Privacidad (AuthPage)
    await api.post('/auth/register', { name, lastname, email, password, phone, acceptTerms: true });
  }

  // CORRECCIÓN: Le sacamos el setLoading() global
  const verifyEmail = async (email: string, code: string) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    localStorage.setItem('token', data.token);
    const me = await api.get('/auth/me');
    setUser(me.data);
  }

  // Guarda el perfil y actualiza el usuario en memoria (no toca el loading global)
  const updateProfile = async (data: ProfileUpdate) => {
    const { data: me } = await api.put('/auth/me', data);
    setUser(me);
  }

  const updatePreferences = async (data: Preferences) => {
    const { data: me } = await api.put('/auth/me/preferences', data);
    setUser(me);
  }

  const refreshUser = async () => {
    const { data: me } = await api.get('/auth/me');
    setUser(me);
  }

  const acceptTerms = async () => {
    const { data: me } = await api.post('/auth/me/accept-terms');
    setUser(me);
  }

  // Borra la cuenta en el servidor y cierra la sesión local
  const deleteAccount = async (password: string) => {
    await api.delete('/auth/me', { data: { password } });
    logout();
  }

  const value = useMemo(() => ({ user, loading, login, logout, register, verifyEmail, updateProfile, updatePreferences, refreshUser, acceptTerms, deleteAccount }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}