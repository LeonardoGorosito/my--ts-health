import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/axios'

const schema = z.object({ 
  email: z.string().email('Ingresa un email válido'), 
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [lastEmail, setLastEmail] = useState('') // Guardamos el email aquí
  const [countdown, setCountdown] = useState(0)  // Temporizador
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  })

  // Efecto para bajar el contador
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const onSubmit = async (d: FormData) => {
    try {
      await api.post('/auth/forgot-password', { email: d.email })
      setLastEmail(d.email)
      setIsEmailSent(true)
      setCountdown(60) // Iniciamos espera de 60s
      toast.success('Si el correo existe, recibirás un enlace.')
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al procesar la solicitud.')
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    
    try {
      // Reutilizamos el mismo endpoint
      await api.post('/auth/forgot-password', { email: lastEmail })
      setCountdown(60) // Reiniciamos contador
      toast.success('Correo reenviado correctamente.')
    } catch (error) {
      toast.error('No se pudo reenviar el correo.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-blue-50 animate-in fade-in zoom-in duration-300">
          
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.56 2.56 0 01-1.071.707l-2.071.518 1.518-2.071a2.56 2.56 0 01.707-1.071l5.464-5.464A6 6 0 0121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Recuperar Acceso</h2>
        </div>

        {!isEmailSent ? (
          <>
            <p className="text-center text-gray-600 mb-6 text-sm">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                <Input type="email" {...register('email')} className="w-full" placeholder="tu@email.com" />
                {errors.email && (<p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>)}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 text-sm border border-green-100">
              <p className="font-bold mb-1">¡Correo enviado!</p>
              <p>Revisa tu bandeja de entrada (y Spam) en los próximos minutos.</p>
            </div>
            
            {/* SECCIÓN DE REENVIAR */}
            <div className="mb-6 space-y-3">
                <p className="text-sm text-gray-500">¿No recibiste nada?</p>
                
                <button 
                    onClick={handleResend} 
                    disabled={countdown > 0}
                    className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                        countdown > 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar correo'}
                </button>
            </div>

            <button onClick={() => setIsEmailSent(false)} className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
              Probar con otro correo
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver al inicio de sesión
          </Link>
        </div>

      </div>
    </div>
  )
}