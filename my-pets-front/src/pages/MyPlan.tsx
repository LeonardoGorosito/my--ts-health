import { useEffect } from 'react'
import { BadgeCheck, Clock, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { PricingTable } from '../components/PricingTable'
import { TIER_LABEL } from '../lib/plans'

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '')

// "Mi plan" (/app/plan): estado de la suscripción y planes disponibles
export function MyPlan() {
  const { refreshUser } = useAuth()
  const sub = useSubscription()

  // El plan puede haber cambiado (ej: lo asignó un admin): lo recargamos al entrar
  useEffect(() => {
    refreshUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { tier, limits } = sub

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi plan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Tu suscripción y lo que incluye.</p>
      </div>

      {/* Estado actual */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          {tier === 'EXPIRED' ? (
            <Lock className="text-red-600 flex-shrink-0" aria-hidden="true" />
          ) : tier === 'TRIAL' ? (
            <Clock className="text-amber-500 flex-shrink-0" aria-hidden="true" />
          ) : (
            <BadgeCheck className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{TIER_LABEL[tier]}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tier === 'TRIAL' && `Todo lo de Pro hasta el ${fmtDate(sub.trialEndsAt)} (${sub.trialDaysLeft} días).`}
              {(tier === 'STANDARD' || tier === 'PRO') &&
                (sub.planExpiresAt ? `Vigente hasta el ${fmtDate(sub.planExpiresAt)}.` : 'Vigente.')}
              {tier === 'EXPIRED' && 'Tu cuenta está en solo lectura. La placa QR y el modo mascota perdida siguen funcionando.'}
            </p>
          </div>
        </div>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 md:text-right">
          <li>Mascotas: <strong>{limits.readOnly ? 'solo lectura' : limits.maxPets === null ? 'ilimitadas' : `hasta ${limits.maxPets}`}</strong></li>
          <li>Recordatorios por email: <strong>{limits.reminders ? 'sí' : 'no'}</strong></li>
          <li>Archivos adjuntos: <strong>{limits.attachments ? 'sí' : 'no'}</strong></li>
        </ul>
      </div>

      <PricingTable
        currentPlan={tier === 'STANDARD' || tier === 'PRO' ? tier : null}
        renderAction={(plan) =>
          tier === plan ? (
            <p className="text-center text-sm font-bold text-emerald-700 dark:text-emerald-300 py-3">Es tu plan actual</p>
          ) : (
            <button
              type="button"
              disabled
              className="w-full bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed"
            >
              Pago online próximamente
            </button>
          )
        }
      />
    </div>
  )
}
