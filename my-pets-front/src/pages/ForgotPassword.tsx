import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/axios'
import { KeyRound, MailCheck, ArrowLeft } from 'lucide-react'

const schema = z.object({ 
  email: z.string().email('Ingresa un email válido'), 
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [lastEmail, setLastEmail] = useState('') 
  const [countdown, setCountdown] = useState(0)  
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  })

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
      setCountdown(60) 
      toast.success('Si el correo existe, recibirás un enlace.')
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al procesar la solicitud.')
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await api.post('/auth/forgot-password', { email: lastEmail })
      setCountdown(60) 
      toast.success('Correo reenviado correctamente.')
    } catch (error) {
      toast.error('No se pudo reenviar el correo.')
    }
  }

  // Input idéntico al del Login
  const InputField = ({ ...props }) => (
    <input 
      className="bg-gray-100 border-none px-4 py-3 my-1.5 w-full rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-400 text-gray-800"
      {...props}
    />
  )

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[450px] p-10 text-center relative animate-in fade-in zoom-in duration-300">
          
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            {isEmailSent ? <MailCheck size={32} className="text-emerald-500" /> : <KeyRound size={32} className="text-emerald-500" />}
          </div>
          <h2 className="text-3xl font-bold text-emerald-900">
            {isEmailSent ? 'Revisa tu correo' : 'Recuperar Acceso'}
          </h2>
        </div>

        {!isEmailSent ? (
          <>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>

            <form className="space-y-2 flex flex-col items-center" onSubmit={handleSubmit(onSubmit)}>
              <div className="w-full">
                <InputField type="email" {...register('email')} placeholder="Email (ej. tu@email.com)" />
                {errors.email && (<p className="mt-1 text-xs text-red-500 text-left px-2">{errors.email.message}</p>)}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-4 bg-emerald-600 text-white text-xs font-bold py-3.5 px-10 rounded-full uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando enlace...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Hemos enviado un enlace a <strong className="text-gray-800">{lastEmail}</strong>. Revisa tu bandeja de entrada (y la carpeta de Spam) en los próximos minutos.
            </p>
            
            {/* SECCIÓN DE REENVIAR */}
            <div className="mb-6 space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿No recibiste nada?</p>
                <button 
                    onClick={handleResend} 
                    disabled={countdown > 0}
                    className={`text-xs font-bold px-6 py-2.5 rounded-full uppercase tracking-wider transition-colors ${
                        countdown > 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'
                    }`}
                >
                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar correo'}
                </button>
            </div>

            <button onClick={() => setIsEmailSent(false)} className="text-xs font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-wider transition-colors">
              Probar con otro correo
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link to="/login" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-600 transition-colors">
            <ArrowLeft size={14} className="mr-2" />
            Volver al inicio de sesión
          </Link>
        </div>

      </div>
    </div>
  )
}