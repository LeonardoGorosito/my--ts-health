import { Link } from 'react-router-dom'
import { Clock, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

// Aviso arriba de la app: días de prueba que quedan, o cuenta en solo lectura.
// Con un plan pago vigente no muestra nada.
export function SubscriptionBanner() {
  const { user } = useAuth()
  const { tier, trialDaysLeft } = useSubscription()

  if (!user?.subscription) return null

  if (tier === 'EXPIRED') {
    return (
      <div role="status" className="bg-red-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium">
          <Lock size={16} aria-hidden="true" />
          Tu prueba gratis terminó: podés ver tus datos pero no editarlos. Tu placa QR sigue funcionando.
          <Link to="/app/plan" className="underline font-bold">Elegir un plan</Link>
        </div>
      </div>
    )
  }

  if (tier === 'TRIAL') {
    const urgent = trialDaysLeft <= 5
    return (
      <div role="status" className={urgent ? 'bg-amber-500 text-gray-900' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100'}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium">
          <Clock size={16} aria-hidden="true" />
          {trialDaysLeft === 1 ? 'Te queda 1 día de prueba gratis.' : `Te quedan ${trialDaysLeft} días de prueba gratis.`}
          <Link to="/app/plan" className="underline font-bold">Ver planes</Link>
        </div>
      </div>
    )
  }

  return null
}
