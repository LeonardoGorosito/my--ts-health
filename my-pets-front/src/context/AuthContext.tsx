import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/axios'

// 1. Tipos actualizados al nuevo Schema
type User = { 
  id: string; 
  email: string; 
  name: string;
  lastname: string;
  phone?: string | null; // <--- NUEVO: Agregamos el teléfono al tipo de usuario
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
    phone?: string // <--- NUEVO: Aceptamos el teléfono como parámetro opcional
  ) => Promise<void> 
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  // 2. Registro actualizado para enviar el celular
  const register = async (
    name: string,
    lastname: string,
    email: string,
    password: string,
    phone?: string // <--- NUEVO: Lo recibimos acá
  ) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { 
        name, 
        lastname, 
        email, 
        password,
        phone // <--- NUEVO: Lo enviamos a la API
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