import { useState } from 'react'
import { Check } from 'lucide-react'
import { PLAN_INFO, PRICES, TRIAL_DAYS, defaultCurrency, formatPrice } from '../lib/plans'
import type { Currency, PaidPlan } from '../lib/plans'

interface PricingTableProps {
  // Plan vigente del usuario (para marcarlo); vacío en la página pública
  currentPlan?: PaidPlan | null
  // Botón de cada plan: lo decide la página que usa la tabla
  renderAction: (plan: PaidPlan) => React.ReactNode
}

const PLANS: PaidPlan[] = ['STANDARD', 'PRO']

export function PricingTable({ currentPlan, renderAction }: PricingTableProps) {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)

  return (
    <div className="space-y-6">
      {/* Selector de moneda */}
      <div className="flex justify-center">
        <div role="group" aria-label="Moneda" className="inline-flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1">
          {(['ARS', 'USD'] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                currency === c
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {c === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PLANS.map((plan) => {
          const info = PLAN_INFO[plan]
          const highlighted = plan === 'PRO'
          const isCurrent = currentPlan === plan
          return (
            <div
              key={plan}
              className={`relative rounded-3xl p-6 flex flex-col bg-white dark:bg-zinc-900 border-2 ${
                highlighted ? 'border-emerald-500 shadow-xl shadow-emerald-900/10' : 'border-gray-200 dark:border-zinc-800'
              }`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Recomendado
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-6 bg-amber-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Tu plan
                </span>
              )}

              <h3 className="font-brand text-2xl font-bold text-gray-900 dark:text-white">{info.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{info.tagline}</p>

              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-brand text-4xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(PRICES[plan][currency], currency)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">/ mes</span>
              </p>

              <ul className="mt-6 space-y-3 flex-grow">
                {info.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check size={18} aria-hidden="true" className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">{renderAction(plan)}</div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Probá todo lo de Pro gratis durante {TRIAL_DAYS} días, sin tarjeta. Tu placa QR y el modo mascota perdida funcionan siempre, aunque no tengas plan.
      </p>
    </div>
  )
}
