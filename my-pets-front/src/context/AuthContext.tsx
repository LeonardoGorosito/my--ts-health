import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/axios'

type User = { 
  id: string; 
  email: string; 
  name: string;
  lastname: string;
  phone?: string | null; 
  role: 'USER' | 'ADMIN'; 
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
    await api.post('/auth/register', { name, lastname, email, password, phone });
  }

  // CORRECCIÓN: Le sacamos el setLoading() global
  const verifyEmail = async (email: string, code: string) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    localStorage.setItem('token', data.token);
    const me = await api.get('/auth/me');
    setUser(me.data);
  }

  const value = useMemo(() => ({ user, loading, login, logout, register, verifyEmail }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}