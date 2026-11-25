import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Stethoscope } from 'lucide-react'
import { api } from '../lib/axios'

// ==========================================================
// CÓDIGO PARA MI VETERINARIA (Mi Perfil, #codigo-veterinaria)
// El dueño genera un código de 6 caracteres y se lo pasa a su veterinaria:
// así la clínica carga sus datos de contacto y sus mascotas sin tipearlos.
// Un solo uso, vence a los 30 minutos.
// ==========================================================
export function ClinicCodeCard() {
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Si se llegó desde el menú (/perfil#codigo-veterinaria), bajamos hasta la tarjeta
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#codigo-veterinaria') document.getElementById('codigo-veterinaria')?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  // Cuenta regresiva mientras el código está vigente
  useEffect(() => {
    if (!code) return
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [code])

  const minutesLeft = code ? Math.max(0, Math.ceil((new Date(code.expiresAt).getTime() - now) / 60_000)) : 0
  const expired = code !== null && minutesLeft === 0

  const generate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/auth/me/clinic-code')
      setCode(res.data)
      setNow(Date.now())
    } catch {
      toast.error('No se pudo generar el código. Probá de nuevo en un rato.')
    } finally {
      setLoading(false)
    }
  }

  const share = `Mi código de PetHealth para que cargues mis datos y mis mascotas: ${code?.code}`

  return (
    <section id="codigo-veterinaria" aria-labelledby="clinic-code-title" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex gap-3">
        <Stethoscope className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" size={22} aria-hidden="true" />
        <div className="flex-1">
          <h2 id="clinic-code-title" className="text-lg font-semibold text-gray-800 dark:text-white">Código para mi veterinaria</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Si tu veterinaria usa PetHealth, pasale este código: carga tus datos de contacto y las mascotas que elija sin que tengas que dictarlos, y puede ver su ficha de salud (vacunas, tratamientos, historial y estudios). Las vacunas que te apliquen y las consultas que te compartan aparecen solas en tu app. Podés dejar de compartir cada mascota desde “Compartir” en su perfil. El código sirve una sola vez y vence a los 30 minutos.
          </p>

          {code && !expired ? (
            <div className="mt-4">
              <p className="font-brand text-4xl font-bold tracking-[0.3em] text-gray-900 tabular-nums dark:text-white" aria-live="polite">{code.code}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Vence en {minutesLeft} {minutesLeft === 1 ? 'minuto' : 'minutos'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => { try { await navigator.clipboard.writeText(code.code); toast.success('Código copiado') } catch { /* sin portapapeles */ } }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50 dark:text-gray-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
                >
                  <Copy size={16} aria-hidden="true" /> Copiar
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#073b1d] hover:bg-[#1fbd5a]">
                  WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <button type="button" onClick={generate} disabled={loading} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">
              {loading ? 'Generando...' : expired ? 'Generar otro código' : 'Generar código'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
