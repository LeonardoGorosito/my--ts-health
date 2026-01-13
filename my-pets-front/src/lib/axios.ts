import axios from 'axios'

export const api = axios.create({
  // Asegúrate de que esta variable de entorno esté bien definida en Vercel Frontend
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // CAMBIO IMPORTANTE: Esto debe ser true para coincidir con el backend
  withCredentials: true, 
})

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token')
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`
  }
  return cfg
})