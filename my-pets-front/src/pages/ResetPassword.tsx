import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/axios' 

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 1. Estado para controlar la visibilidad
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token inválido o expirado')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/auth/reset-password', {
        token: token,
        newPassword: data.password
      })

      toast.success('¡Contraseña restablecida! Ahora puedes iniciar sesión.')
      navigate('/login')
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Error al restablecer contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Componente auxiliar para el icono (para no repetir código SVG)
  const EyeIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
      tabIndex={-1} // Para que no moleste al tabular
    >
      {showPassword ? (
        // Ojo Abierto
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      ) : (
        // Ojo Cerrado (El que me pasaste)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.68 0 1.356-.06 2-.17"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
      )}
    </button>
  )

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-red-600 font-semibold">
          Error: Enlace inválido. Por favor solicita uno nuevo.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-blue-50">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Nueva Contraseña</h2>
          <p className="text-gray-500 text-sm mt-2">Ingresa tu nueva clave para recuperar el acceso</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Campo: Nueva Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                {...register('password')} 
                placeholder="••••••••" 
                className="pr-10"
              />
              <EyeIcon />
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          {/* Campo: Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                {...register('confirmPassword')} 
                placeholder="••••••••" 
                className="pr-10"
              />
              <EyeIcon />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
          >
            {isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}