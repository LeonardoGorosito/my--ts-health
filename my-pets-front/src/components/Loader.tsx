import { Cat } from 'lucide-react'

type LoaderProps = {
  text?: string
  fullScreen?: boolean
}

export function Loader({ text = 'Cargando...', fullScreen = false }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      
      <div className="relative flex items-center justify-center">
        {/* Círculo de fondo (Grisáceo/Verde claro) */}
        <div className="w-20 h-20 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
        
        {/* Círculo animado (Gira) */}
        <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0 shadow-lg shadow-emerald-500/20"></div>

        {/* Icono en el centro (Fijo) */}
        <div className="absolute inset-0 flex items-center justify-center">
           <Cat size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Texto opcional */}
      <p className="mt-6 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 animate-pulse">
        {text}
      </p>
    </div>
  )
}