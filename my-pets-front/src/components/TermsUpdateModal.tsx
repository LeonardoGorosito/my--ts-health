import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { LEGAL } from '../lib/legal'
import { Placo } from './brand/Placo'

// ==========================================================
// AVISO DE TÉRMINOS ACTUALIZADOS
// Aparece si la versión aceptada no es la vigente (o si el usuario se registró
// antes de que se guardara). El consentimiento tiene que ser expreso (Ley 25.326):
// para seguir usando la app hay que aceptar o cerrar sesión.
// ==========================================================
export function TermsUpdateModal() {
  const { user, acceptTerms, logout } = useAuth()
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!user?.currentTermsVersion || user.termsVersion === user.currentTermsVersion) return null

  const firstTime = !user.termsVersion

  const accept = async () => {
    setSaving(true)
    try {
      await acceptTerms()
      toast.success('¡Gracias! Ya podés seguir')
    } catch {
      toast.error('No se pudo guardar. Probá de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="terms-title" className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <Placo size={72} className="mx-auto" title="Placo" />
        <h2 id="terms-title" className="mt-4 text-center font-brand text-2xl font-bold text-gray-900 text-balance dark:text-white">
          {firstTime ? 'Confirmá los términos para seguir' : 'Actualizamos los términos'}
        </h2>
        <p className="mt-3 text-center text-gray-600 text-balance dark:text-gray-400">
          {firstTime
            ? 'Necesitamos registrar que aceptás los Términos y la Política de Privacidad de PetHealth.'
            : `Cambiamos los Términos y la Política de Privacidad el ${LEGAL.updatedAt}. Leelos y aceptalos para seguir usando la app.`}
        </p>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-black/20 dark:text-gray-300">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Leí y acepto los{' '}
            <Link to="/terminos" target="_blank" rel="noopener" className="font-semibold text-emerald-700 underline dark:text-emerald-400">Términos y Condiciones</Link>{' '}
            y la <Link to="/privacidad" target="_blank" rel="noopener" className="font-semibold text-emerald-700 underline dark:text-emerald-400">Política de Privacidad</Link>.
          </span>
        </label>

        <button
          type="button"
          onClick={accept}
          disabled={!checked || saving}
          className="mt-5 w-full rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Aceptar y continuar'}
        </button>
        <button type="button" onClick={logout} className="mt-3 w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
