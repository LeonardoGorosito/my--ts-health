import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from './brand/Logo'
import { ThemeToggle } from './ThemeToggle'
import { LEGAL } from '../lib/legal'

export type LegalSection = { id: string; title: string; body: React.ReactNode }

// Valor legal pendiente: se ve resaltado para que no se publique sin completar
export function Fill({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>
  return (
    <mark className="rounded bg-amber-200 px-1 font-semibold text-amber-950 dark:bg-amber-400/30 dark:text-amber-100">
      [{label}: a completar]
    </mark>
  )
}

// Estructura común de Términos y Privacidad: índice con anclas, secciones numeradas y fecha de vigencia.
export function LegalLayout({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  const { hash } = useLocation()

  useEffect(() => {
    const previous = document.title
    document.title = `${title} | PetHealth`
    return () => { document.title = previous }
  }, [title])

  // Con ancla (ej: /privacidad#placa) bajamos a esa sección; si no, arrancamos arriba
  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash, title])

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="PetHealth, volver al inicio"><Logo size="sm" /></Link>
          <ThemeToggle compact />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-brand text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Última actualización: {LEGAL.updatedAt}</p>
        <div className="mt-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">{intro}</div>

        <nav aria-label="Índice" className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Contenido</p>
          <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-6">
              <h2 id={`${s.id}-t`} className="font-brand text-2xl font-bold">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-gray-700 dark:text-gray-300 [&_a]:text-emerald-700 [&_a]:underline dark:[&_a]:text-emerald-400 [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-gray-100 pt-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          ¿Dudas sobre este documento? Escribinos a <Fill value={LEGAL.email} label="email de contacto" />. Ver también los{' '}
          <Link to="/terminos" className="text-emerald-700 underline dark:text-emerald-400">Términos y Condiciones</Link> y la{' '}
          <Link to="/privacidad" className="text-emerald-700 underline dark:text-emerald-400">Política de Privacidad</Link>.
        </p>
      </main>
    </div>
  )
}
