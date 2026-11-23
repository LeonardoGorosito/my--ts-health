import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { ArrowLeft, Download, Printer, Share2, Siren } from 'lucide-react'
import { api } from '../../lib/axios'
import { todayInput } from '../../lib/dates'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../../components/Loader'
import { Placo } from '../../components/brand/Placo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { POSTER_HEIGHT, POSTER_WIDTH, drawPoster, loadImage, loadPosterFonts, svgToImage } from '../../lib/poster'
import type { PosterData, PosterTitle } from '../../lib/poster'

type PosterPet = {
  id: string
  name: string
  species: 'CAT' | 'DOG'
  breed: string | null
  gender: string | null
  birthDate: string | null
  specialNeeds: string | null
  profileImageUrl: string | null
  isLost: boolean
  lostSince: string | null
  lostMessage: string | null
}

type Form = {
  title: PosterTitle
  place: string
  lostDate: string // yyyy-mm-dd (input date)
  message: string
  phone: string
  showCare: boolean
  reward: boolean
  rewardText: string
}

const TITLES: PosterTitle[] = ['SE BUSCA', '¿ME VISTE?', 'PERDIDO']

// lostSince es un momento real: lo pasamos a la fecha local (no UTC)
const toInputDate = (iso: string | null) => todayInput(iso ? new Date(iso) : new Date())
const formatDate = (inputDate: string) => {
  if (!inputDate) return ''
  const [y, m, d] = inputDate.split('-')
  return `${d}/${m}/${y}`
}

// "Gata · Mestiza · 3 años"
function describePet(pet: PosterPet) {
  const female = pet.gender === 'Hembra'
  const species = pet.species === 'CAT' ? (female ? 'Gata' : 'Gato') : female ? 'Perra' : 'Perro'
  const breed = pet.breed || (female ? 'Mestiza' : 'Mestizo')
  let age = ''
  if (pet.birthDate) {
    const months = Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    if (months >= 24) age = `${Math.floor(months / 12)} años`
    else if (months >= 12) age = '1 año'
    else if (months > 0) age = `${months} ${months === 1 ? 'mes' : 'meses'}`
  }
  return [species, breed, age].filter(Boolean).join(' · ')
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
const labelClass = 'mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200'
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50'

// Afiche "Se busca" (/app/pets/:id/afiche): se edita a la izquierda y se ve en vivo a la derecha
export function LostPoster() {
  const { id } = useParams()
  const { user } = useAuth()
  const [pet, setPet] = useState<PosterPet | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Form | null>(null)
  const [ready, setReady] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const placoRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<{ photo: HTMLImageElement | null; qr: HTMLImageElement; placo: HTMLImageElement } | null>(null)

  const publicUrl = `${window.location.origin}/public/pet/${id}`

  // 1. Datos de la mascota y valores iniciales del formulario
  useEffect(() => {
    api
      .get(`/pets/${id}`)
      .then(({ data }: { data: PosterPet }) => {
        setPet(data)
        setForm({
          title: 'SE BUSCA',
          place: '',
          lostDate: toInputDate(data.lostSince),
          message: data.lostMessage ?? '',
          phone: user?.phone ?? '',
          showCare: Boolean(data.specialNeeds),
          reward: false,
          rewardText: '',
        })
      })
      .catch(() => toast.error('No se pudo cargar la mascota'))
      .finally(() => setLoading(false))
    // Solo al entrar: el teléfono del usuario es un valor inicial, después lo edita en el formulario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 2. Imágenes (foto, QR y Placo) y tipografía: se cargan una sola vez
  useEffect(() => {
    if (!pet) return
    let cancelled = false
    ;(async () => {
      await loadPosterFonts()
      const qrSvg = qrRef.current?.querySelector('svg')
      const placoSvg = placoRef.current?.querySelector('svg')
      if (!qrSvg || !placoSvg) return
      const [qr, placo] = await Promise.all([svgToImage(qrSvg), svgToImage(placoSvg)])
      let photo: HTMLImageElement | null = null
      if (pet.profileImageUrl) {
        photo = await loadImage(pet.profileImageUrl).catch(() => {
          toast.info('No pudimos cargar la foto: el afiche usa a Placo en su lugar')
          return null
        })
      }
      if (cancelled) return
      imagesRef.current = { photo, qr, placo }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [pet])

  const posterData: PosterData | null = useMemo(() => {
    if (!pet || !form) return null
    return {
      title: form.title,
      petName: pet.name,
      details: describePet(pet),
      lostDate: formatDate(form.lostDate),
      place: form.place.trim(),
      message: form.message,
      careNote: form.showCare ? pet.specialNeeds ?? '' : '',
      phone: form.phone,
      reward: form.reward,
      rewardText: form.rewardText,
    }
  }, [pet, form])

  // 3. Redibujar en cada cambio del formulario
  useEffect(() => {
    if (!ready || !posterData || !canvasRef.current || !imagesRef.current) return
    drawPoster(canvasRef.current, posterData, imagesRef.current)
  }, [ready, posterData])

  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))

  const fileName = `se-busca-${(pet?.name ?? 'mascota').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, '-')}.jpg`

  const toBlob = () =>
    new Promise<Blob>((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) return reject(new Error('Sin afiche'))
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/jpeg', 0.92)
    })

  const download = async () => {
    try {
      const url = URL.createObjectURL(await toBlob())
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error('No se pudo descargar la imagen')
    }
  }

  const share = async () => {
    try {
      const file = new File([await toBlob()], fileName, { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Se busca a ${pet?.name}`,
          text: `Se busca a ${pet?.name}. Si la/o viste, mirá su ficha y avisá a su familia: ${publicUrl}`,
        })
      } else {
        await download()
        toast.info('Tu navegador no permite compartir directo: descargamos la imagen para que la mandes')
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') toast.error('No se pudo compartir')
    }
  }

  if (loading) return <Loader text="Preparando el afiche..." />
  if (!pet || !form) {
    return <div className="p-10 text-center text-gray-600 dark:text-gray-300">No encontramos a la mascota.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 print:bg-white">
      {/* Al imprimir: hoja A4 sin márgenes y solo el afiche */}
      <style>{'@page { size: A4 portrait; margin: 0; }'}</style>

      {/* Fuentes del QR y de Placo para dibujarlos en el canvas (invisibles) */}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[9999px] top-0">
        <div ref={qrRef}><QRCode value={publicUrl} size={512} level="M" /></div>
        <div ref={placoRef}><Placo size={200} /></div>
      </div>

      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={`/app/pets/${pet.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            <ArrowLeft size={18} aria-hidden="true" /> Volver a {pet.name}
          </Link>
          <ThemeToggle compact />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] print:block print:p-0">
        {/* --- Opciones --- */}
        <section aria-labelledby="afiche-titulo" className="space-y-5 print:hidden">
          <div>
            <h1 id="afiche-titulo" className="font-brand text-3xl font-bold">Afiche &quot;Se busca&quot;</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Imprimilo para pegar en la zona o compartilo por WhatsApp y redes. El QR lleva a la ficha de {pet.name}.
            </p>
          </div>

          {!pet.isLost && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <Siren size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
              <p>
                El modo mascota perdida está apagado: quien escanee el QR va a ver la ficha normal, sin el aviso de búsqueda.{' '}
                <Link to={`/app/pets/${pet.id}`} className="font-bold underline">Activalo desde el perfil</Link> antes de repartir el afiche.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={share} disabled={!ready} className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <Share2 size={18} aria-hidden="true" /> Compartir
            </button>
            <button type="button" onClick={download} disabled={!ready} className={`${buttonClass} bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800`}>
              <Download size={18} aria-hidden="true" /> Descargar imagen
            </button>
            <button type="button" onClick={() => window.print()} disabled={!ready} className={`${buttonClass} bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800`}>
              <Printer size={18} aria-hidden="true" /> Imprimir o guardar PDF
            </button>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <span className={labelClass}>Título</span>
              <div role="group" aria-label="Título del afiche" className="flex flex-wrap gap-2">
                {TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.title === t}
                    onClick={() => update('title', t)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 transition-colors ${
                      form.title === t
                        ? 'bg-red-600 text-white ring-red-600'
                        : 'text-gray-700 ring-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="afiche-lugar" className={labelClass}>Dónde se perdió</label>
                <input id="afiche-lugar" className={inputClass} value={form.place} maxLength={80} onChange={(e) => update('place', e.target.value)} placeholder="Ej: Barrio Candioti" />
              </div>
              <div>
                <label htmlFor="afiche-fecha" className={labelClass}>Cuándo</label>
                <input id="afiche-fecha" type="date" className={inputClass} value={form.lostDate} onChange={(e) => update('lostDate', e.target.value)} />
              </div>
            </div>

            <div>
              <label htmlFor="afiche-mensaje" className={labelClass}>Mensaje</label>
              <textarea
                id="afiche-mensaje"
                rows={3}
                maxLength={220}
                className={inputClass}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Ej: Es asustadiza, no la persigan. Tiene collar rojo."
              />
              <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">{form.message.length}/220</p>
            </div>

            <div>
              <label htmlFor="afiche-telefono" className={labelClass}>Teléfono de contacto</label>
              <input id="afiche-telefono" type="tel" className={inputClass} value={form.phone} maxLength={30} onChange={(e) => update('phone', e.target.value)} placeholder="Ej: 342 555-0123" />
              {!form.phone.trim() && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Sin teléfono, el afiche invita a escanear el QR para contactarte.</p>
              )}
            </div>

            {pet.specialNeeds && (
              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" checked={form.showCare} onChange={(e) => update('showCare', e.target.checked)} />
                <span>Mostrar sus cuidados especiales: <em>{pet.specialNeeds}</em></span>
              </label>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={form.reward} onChange={(e) => update('reward', e.target.checked)} />
                Ofrecer recompensa
              </label>
              {form.reward && (
                <input aria-label="Detalle de la recompensa (opcional)" className={inputClass} value={form.rewardText} maxLength={60} onChange={(e) => update('rewardText', e.target.value)} placeholder="Opcional, ej: $50.000" />
              )}
            </div>
          </div>
        </section>

        {/* --- Vista previa (y lo único que se imprime) --- */}
        <section aria-label="Vista previa del afiche" className="lg:sticky lg:top-6 lg:self-start">
          <div className="relative mx-auto w-full max-w-[520px] print:max-w-none">
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white text-sm text-gray-500 dark:bg-gray-900">
                Dibujando el afiche...
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={POSTER_WIDTH}
              height={POSTER_HEIGHT}
              role="img"
              aria-label={`Afiche ${form.title} de ${pet.name}`}
              className="block h-auto w-full rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 print:h-screen print:w-auto print:rounded-none print:shadow-none print:ring-0"
            />
          </div>
        </section>
      </main>
    </div>
  )
}
