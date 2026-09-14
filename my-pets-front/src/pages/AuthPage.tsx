import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext' 
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import '../index.css' 

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres')
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  lastname: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  passwordConfirm: z.string().min(6, 'Confirma tu contraseña'),
}).superRefine(({ password, passwordConfirm }, ctx) => {
  if (password !== passwordConfirm) {
    ctx.addIssue({ code: "custom", message: "Las contraseñas no coinciden", path: ['passwordConfirm'] });
  }
});

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

export default function AuthPage({ initialRegister = false }: { initialRegister?: boolean }) {
  const [isRegisterActive, setIsRegisterActive] = useState(initialRegister)
  const [showPassword, setShowPassword] = useState(false)
  
  // ESTADOS PARA LA VERIFICACIÓN OTP
  const [isVerifying, setIsVerifying] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const { login, register: registerUser, verifyEmail } = useAuth()
  const nav = useNavigate()

  const { 
    register: regLogin, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors, isSubmitting: loginLoading } 
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  const { 
    register: regRegister, 
    handleSubmit: handleRegisterSubmit, 
    formState: { errors: regErrors, isSubmitting: registerLoading } 
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  const onLogin = async (d: LoginData) => {
    try {
      await login(d.email.trim(), d.password)
      nav('/account') 
    } catch (e: any) {
      if (e?.response?.status === 403 && e?.response?.data?.message === 'PENDING_VERIFICATION') {
        setRegisteredEmail(e.response.data.email || d.email.trim())
        setIsVerifying(true)
        toast.info('Debes verificar tu cuenta primero')
        return
      }
      toast.error(e?.response?.data?.message || 'Credenciales inválidas')
    }
  }

  const onRegister = async (d: RegisterData) => {
    try {
      await registerUser(d.name, d.lastname, d.email.trim(), d.password, d.phone)
      setRegisteredEmail(d.email.trim())
      setIsVerifying(true)
      toast.success('Revisa tu correo para obtener el código')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al registrarse')
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; 
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Ingresa los 6 dígitos');
    
    setVerifyLoading(true);
    try {
      await verifyEmail(registeredEmail, code);
      toast.success('¡Cuenta verificada! Bienvenido');
      nav('/account');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Código inválido o expirado');
    } finally {
      setVerifyLoading(false);
    }
  };

  const InputField = ({ ...props }) => (
    <input 
      className="bg-gray-100 border-none px-4 py-3 my-1.5 w-full rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-400 text-gray-800"
      {...props}
    />
  )

  const EyeIcon = ({ visible, onClick }: { visible: boolean, onClick: () => void }) => (
     <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600">
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.68 0 1.356-.06 2-.17"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        )}
     </button>
  )

  // =========================================
  // VISTA 1: VERIFICACIÓN (SOLO CUADRADITOS)
  // =========================================
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-[450px] text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>
          </div>
          
          <h2 className="text-3xl font-bold text-emerald-900 mb-2">Verifica tu email</h2>
          <p className="text-sm text-gray-500 mb-8">
            Ingresa el código de 6 dígitos que enviamos a <strong className="text-gray-800">{registeredEmail}</strong>
          </p>

          <form onSubmit={onVerify} className="flex flex-col items-center">
            <div className="flex gap-2 sm:gap-3 mb-8 justify-center w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-gray-900"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={verifyLoading}
              className="w-full bg-emerald-600 text-white text-xs font-bold py-4 px-10 rounded-full uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
              {verifyLoading ? 'Verificando...' : 'Confirmar código'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setIsVerifying(false)}
              className="mt-6 text-xs text-gray-400 font-bold uppercase tracking-wider hover:text-emerald-600 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================
  // VISTA 2: LOGIN / REGISTRO NORMAL
  // =========================================
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className={`container-auth bg-white rounded-3xl shadow-2xl w-full max-w-[900px] md:min-h-[600px] relative overflow-hidden ${isRegisterActive ? "right-panel-active" : ""}`}>
        
        {/* --- FORMULARIO DE REGISTRO --- */}
        <div className="form-container sign-up-container bg-white p-8 md:p-10 flex flex-col items-center justify-center h-full text-center py-12 md:py-10">
          <form onSubmit={handleRegisterSubmit(onRegister)} className="w-full max-w-xs flex flex-col items-center mt-4">
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">Crear Cuenta</h1>
            <p className="text-sm text-gray-400 mb-4">Usa tu email para registrarte</p>

            <div className="flex gap-2 w-full">
              <div className="w-1/2">
                <InputField type="text" placeholder="Nombre" {...regRegister('name')} />
                {regErrors.name && <span className="text-xs text-red-500 block text-left">{regErrors.name.message}</span>}
              </div>
              <div className="w-1/2">
                <InputField type="text" placeholder="Apellido" {...regRegister('lastname')} />
                {regErrors.lastname && <span className="text-xs text-red-500 block text-left">{regErrors.lastname.message}</span>}
              </div>
            </div>

            <div className="w-full">
                <InputField type="email" placeholder="Email" {...regRegister('email')} />
                {regErrors.email && <span className="text-xs text-red-500 block text-left">{regErrors.email.message}</span>}
            </div>

            <div className="w-full">
                <InputField type="tel" placeholder="Celular (Ej: +54 9...)" {...regRegister('phone')} />
                <span className="text-[10px] text-gray-400 block text-left ml-2 mb-1">Se usará para emergencias en tu placa QR.</span>
                {regErrors.phone && <span className="text-xs text-red-500 block text-left">{regErrors.phone.message}</span>}
            </div>

            <div className="w-full relative">
                <InputField type={showPassword ? "text" : "password"} placeholder="Contraseña" {...regRegister('password')} />
                <EyeIcon visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
            </div>
            {regErrors.password && <span className="text-xs text-red-500 block text-left w-full">{regErrors.password.message}</span>}

            <div className="w-full relative">
                <InputField type={showPassword ? "text" : "password"} placeholder="Confirmar pass" {...regRegister('passwordConfirm')} />
            </div>
            {regErrors.passwordConfirm && <span className="text-xs text-red-500 block text-left w-full">{regErrors.passwordConfirm.message}</span>}
            
            <button 
                type="submit" 
                disabled={registerLoading}
                className="mt-6 bg-emerald-600 text-white text-xs font-bold py-3 px-10 rounded-full uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
              {registerLoading ? 'Creando...' : 'Registrarse'}
            </button>

            <div className="md:hidden mt-6 text-sm text-gray-500">
              ¿Ya tienes cuenta? <button type="button" onClick={() => setIsRegisterActive(false)} className="text-emerald-600 font-bold hover:underline">Inicia Sesión</button>
            </div>
          </form>
        </div>

        {/* --- FORMULARIO DE LOGIN --- */}
        <div className="form-container sign-in-container bg-white p-8 md:p-10 flex flex-col items-center justify-center h-full text-center py-12 md:py-10">
          <form onSubmit={handleLoginSubmit(onLogin)} className="w-full max-w-xs flex flex-col items-center">
            <div className="mb-6 bg-emerald-100 p-3 rounded-full text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A4.335 4.335 0 0 1 6.938 10c.333.004.588.024.767.064.424.094.885.114 1.254.123h6.082c.49-.012.83-.029 1.254-.123.18-.04.435-.06.767-.064a4.335 4.335 0 0 1 2.518 1.247c-.828 2.05-3.002 4.154-4.88 5.626a5.27 5.27 0 0 1-5.4 0c-1.877-1.472-4.052-3.576-4.88-5.626Z"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-emerald-900 mb-4">¡Hola de nuevo!</h1>
            
            <div className="w-full">
                <InputField type="email" placeholder="Email" {...regLogin('email')} />
                {loginErrors.email && <span className="text-xs text-red-500 block text-left">{loginErrors.email.message}</span>}
            </div>
            
            <div className="w-full relative">
                <InputField type={showPassword ? "text" : "password"} placeholder="Contraseña" {...regLogin('password')} />
                <EyeIcon visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
            </div>
            {loginErrors.password && <span className="text-xs text-red-500 block text-left w-full">{loginErrors.password.message}</span>}

            <Link to="/forgot-password" className="text-xs text-gray-500 my-4 hover:text-emerald-600 transition-colors border-b border-transparent hover:border-emerald-600">
              ¿Olvidaste tu contraseña?
            </Link>

            <button 
                type="submit" 
                disabled={loginLoading}
                className="bg-emerald-600 text-white text-xs font-bold py-3 px-10 rounded-full uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
               {loginLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <div className="md:hidden mt-6 text-sm text-gray-500">
              ¿Eres nuevo aquí? <button type="button" onClick={() => setIsRegisterActive(true)} className="text-emerald-600 font-bold hover:underline">Regístrate</button>
            </div>
          </form>
        </div>

        {/* --- OVERLAY --- */}
        <div className="overlay-container">
          <div className="overlay bg-gradient-to-r from-emerald-500 to-teal-700">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-bold text-white mb-4">¿Ya tienes cuenta?</h1>
              <p className="text-sm font-light text-emerald-50 mb-8 leading-relaxed">
                Para mantenerte conectado con tus mascotas, inicia sesión con tus datos personales.
              </p>
              <button 
                className="bg-transparent border border-white text-white text-xs font-bold py-3 px-10 rounded-full uppercase tracking-wider hover:bg-white hover:text-emerald-700 transition-all"
                onClick={() => setIsRegisterActive(false)}
              >
                Iniciar Sesión
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold text-white mb-4">¿Eres nuevo aquí?</h1>
              <p className="text-sm font-light text-emerald-50 mb-8 leading-relaxed">
                Ingresa tus datos personales y comienza a gestionar la salud de tus mascotas hoy mismo.
              </p>
              <button 
                className="bg-transparent border border-white text-white text-xs font-bold py-3 px-10 rounded-full uppercase tracking-wider hover:bg-white hover:text-emerald-700 transition-all"
                onClick={() => setIsRegisterActive(true)}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}