import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Search, ShieldCheck } from 'lucide-react'
import { api } from '../lib/axios'
import { TIER_LABEL } from '../lib/plans'
import type { Subscription } from '../context/AuthContext'

type AdminUser = {
  email: string
  name?: string
  lastname?: string
  isVerified?: boolean
  _count?: { pets: number }
  subscription: Subscription
}

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none'
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '—')
const errorMessage = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback

// Administración de planes (/admin, solo ADMIN): mientras no haya pago online,
// acá se asigna un plan a mano a quien pagó por otro medio.
export function AdminPlans() {
  const [email, setEmail] = useState('')
  const [found, setFound] = useState<AdminUser | null>(null)
  const [plan, setPlan] = useState<'STANDARD' | 'PRO'>('PRO')
  const [months, setMonths] = useState(1)
  const [busy, setBusy] = useState(false)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.get('/admin/user', { params: { email } })
      setFound(data)
    } catch (err) {
      setFound(null)
      toast.error(errorMessage(err, 'No se pudo buscar'))
    } finally {
      setBusy(false)
    }
  }

  const assign = async (newPlan: 'STANDARD' | 'PRO' | null) => {
    if (!found) return
    if (!newPlan && !window.confirm(`¿Quitar el plan de ${found.email}?`)) return
    setBusy(true)
    try {
      const { data } = await api.put('/admin/plan', { email: found.email, plan: newPlan, months })
      setFound({ ...found, subscription: data.subscription })
      toast.success(newPlan ? `Plan ${TIER_LABEL[newPlan]} asignado` : 'Plan quitado')
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo actualizar el plan'))
    } finally {
      setBusy(false)
    }
  }

  const sub = found?.subscription

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-emerald-600" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administrar planes</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        Asigná un plan a mano a quien te pagó por transferencia u otro medio. Si ya tiene ese plan vigente, se suman los meses.
      </p>

      <form onSubmit={search} className="flex gap-2">
        <label htmlFor="admin-email" className="sr-only">Email del usuario</label>
        <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@del-usuario.com" className={inputClass} />
        <button type="submit" disabled={busy} className="flex items-center gap-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold">
          <Search size={18} aria-hidden="true" /> Buscar
        </button>
      </form>

      {found && sub && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-5">
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{found.name} {found.lastname}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {found.email} · {found._count?.pets ?? 0} mascotas · {found.isVerified ? 'verificado' : 'sin verificar'}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-600 dark:text-gray-400">Estado</dt><dd className="font-bold text-gray-900 dark:text-white">{TIER_LABEL[sub.tier]}</dd></div>
            <div><dt className="text-gray-600 dark:text-gray-400">Plan pago hasta</dt><dd className="font-bold text-gray-900 dark:text-white">{fmtDate(sub.planExpiresAt)}</dd></div>
            <div><dt className="text-gray-600 dark:text-gray-400">Prueba gratis hasta</dt><dd className="font-bold text-gray-900 dark:text-white">{fmtDate(sub.trialEndsAt)}</dd></div>
          </dl>

          <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-5">
            <div>
              <label htmlFor="admin-plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select id="admin-plan" value={plan} onChange={(e) => setPlan(e.target.value as 'STANDARD' | 'PRO')} className={inputClass}>
                <option value="STANDARD">Standard</option>
                <option value="PRO">Pro</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-months" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meses</label>
              <input id="admin-months" type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value) || 1)} className={`${inputClass} w-24`} />
            </div>
            <button type="button" disabled={busy} onClick={() => assign(plan)} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold">
              Asignar plan
            </button>
            <button type="button" disabled={busy || !sub.plan} onClick={() => assign(null)} className="px-5 py-2 rounded-xl border border-red-300 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 font-bold">
              Quitar plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
