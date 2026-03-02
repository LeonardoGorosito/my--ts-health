import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/axios' 
import { LockKeyhole } from 'lucide-react'

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

  const InputField = ({ ...props }) => (
    <input 
      className="bg-gray-100 border-none px-4 py-3 my-1.5 w-full rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-400 text-gray-800"
      {...props}
    />
  )

  const EyeIcon = () => (
    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 outline-none">
       {showPassword ? (
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
       ) : (
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.68 0 1.356-.06 2-.17"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
       )}
    </button>
  )

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
          <p className="text-sm text-gray-500 mb-6">El enlace expiró o es incorrecto. Por favor solicita uno nuevo.</p>
          <button onClick={() => navigate('/forgot-password')} className="bg-gray-900 text-white text-xs font-bold py-3 px-6 rounded-full uppercase tracking-wider hover:bg-black transition-colors w-full">
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[450px] p-10 text-center relative animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-emerald-900">Nueva Contraseña</h2>
          <p className="text-sm text-gray-400 mt-2">Ingresa tu nueva clave para recuperar el acceso</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col items-center">
          
          <div className="w-full relative">
            <InputField 
              type={showPassword ? "text" : "password"} 
              {...register('password')} 
              placeholder="Nueva Contraseña" 
            />
            <EyeIcon />
            {errors.password && <p className="text-xs text-red-500 text-left px-2 mt-1">{errors.password.message}</p>}
          </div>

          <div className="w-full relative">
            <InputField 
              type={showPassword ? "text" : "password"} 
              {...register('confirmPassword')} 
              placeholder="Confirmar Contraseña" 
            />
            <EyeIcon />
            {errors.confirmPassword && <p className="text-xs text-red-500 text-left px-2 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 bg-emerald-600 text-white text-xs font-bold py-3.5 px-10 rounded-full uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}