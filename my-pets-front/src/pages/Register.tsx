import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler, Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio'),
  lastname: z.string().min(2, 'El apellido es obligatorio'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  passwordConfirm: z.string().min(6, 'Confirma la contraseña'),
})
.superRefine(({ password, passwordConfirm }, ctx) => {
  if (password !== passwordConfirm) {
    ctx.addIssue({
      code: "custom",
      message: "Las contraseñas no coinciden",
      path: ['passwordConfirm']
    });
  }
});

type RegisterFormData = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth() 
  const nav = useNavigate()
  
  // 2. Estado para ver contraseña en el registro también
  const [showPassword, setShowPassword] = useState(false)



  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema) as Resolver<RegisterFormData>,
    mode: 'onBlur',
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (d) => {
    try { 
      // 3. IMPORTANTISIMO: Trim al registrarse también.
      // Así guardamos el email limpio en la base de datos.
      const cleanEmail = d.email.trim()
      
      await registerUser(d.name, d.lastname, cleanEmail, d.password)
      
      toast.success('Registro exitoso. ¡Bienvenid@!')
      nav('/account') 
    }
    catch (e: any) { 
      toast.error(e?.response?.data?.message || 'Error al registrar. Intenta de nuevo.') 
    }
  }

  // Helper para el icono del ojo (para no repetir código)
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <button
      type="button"
      onClick={() => setShowPassword(!visible)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
      tabIndex={-1} // Para que no moleste al tabular
    >
      {visible ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.68 0 1.356-.06 2-.17"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
      )}
    </button>
  )

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Crea tu cuenta!
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <Input type="text" {...register('name')} placeholder="Tu nombre" />
                  {errors.name && (<p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>)}
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <Input type="text" {...register('lastname')} placeholder="Tu apellido" />
                  {errors.lastname && (<p className="mt-1.5 text-xs text-red-600">{errors.lastname.message}</p>)}
              </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
            <Input type="email" {...register('email')} placeholder="tu@email.com" />
            {errors.email && (<p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>)}
          </div>
          

          
          {/* Contraseñas con OJITO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  {...register('password')} 
                  placeholder="••••••••" 
                  className="pr-10"
                />
                <EyeIcon visible={showPassword} />
              </div>
              {errors.password && (<p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  {...register('passwordConfirm')} 
                  placeholder="••••••••" 
                  className="pr-10"
                />
                <EyeIcon visible={showPassword} />
              </div>
              {errors.passwordConfirm && (<p className="mt-1.5 text-xs text-red-600">{errors.passwordConfirm.message}</p>)}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                Registrando...
              </span>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 mt-6">
        © 2025 My Pet Health. Todos los derechos reservados.
      </p>
    </div>
  )
}