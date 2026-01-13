import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/axios'

// 1. Tipos actualizados al nuevo Schema
type User = { 
  id: string; 
  email: string; 
  name: string;
  lastname: string;
  role: 'USER' | 'ADMIN'; // Cambiado STUDENT por USER
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
    password: string
  ) => Promise<void> // Simplificado: sin masters, age ni telegram
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) return setLoading(false)
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

  // 2. Registro simplificado para Pet Health
  const register = async (
    name: string,
    lastname: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { 
        name, 
        lastname, 
        email, 
        password 
      });

      localStorage.setItem('token', data.token); 
      const me = await api.get('/auth/me');
      setUser(me.data);
    } catch (error) {
      throw error; 
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(() => ({ user, loading, login, logout, register }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}