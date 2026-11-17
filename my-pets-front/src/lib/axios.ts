import axios from 'axios'
import { toast } from 'sonner'

export const api = axios.create({
  // Asegúrate de que esta variable de entorno esté bien definida en Vercel Frontend
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // CAMBIO IMPORTANTE: Esto debe ser true para coincidir con el backend
  withCredentials: true, 
})

// 402 = el plan no alcanza (prueba vencida, límite de mascotas o función Pro).
// Mostramos el motivo con un acceso a "Mi plan"; el componente igual recibe el error.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 402) {
      toast.warning(error.response.data?.message || 'Tu plan no incluye esta acción', {
        id: 'plan-required', // un solo aviso aunque fallen varios pedidos juntos
        action: { label: 'Ver planes', onClick: () => window.location.assign('/app/plan') },
      })
    }
    return Promise.reject(error)
  }
)

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token')
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`
  }
  return cfg
})


export const uploadPetAttachment = async (petId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file); // 'file' debe coincidir con lo que espera el backend

  // Nota: No hace falta poner Content-Type manualmente, Axios lo detecta al ver FormData
  // Pero necesitamos pasarle el petId como query param
  const response = await api.post(`/upload?petId=${petId}`, formData);
  return response.data;
};