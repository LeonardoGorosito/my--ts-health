import { useEffect, useId } from 'react'
import type React from 'react'
import { X } from 'lucide-react'

// ==========================================================
// PIEZAS DE FORMULARIO DE LA SECCIÓN CLÍNICA
// Campos con etiqueta visible, error y ayuda, y un modal simple.
// ==========================================================

export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500'

export function Field({ label, hint, error, children, className = '' }: {
  label: string
  hint?: string
  error?: string
  children: (id: string) => React.ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-7 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-brand text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60'
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-800 ring-1 ring-gray-300 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:ring-zinc-700 dark:hover:bg-zinc-800'
export const dangerLink = 'text-sm font-semibold text-red-700 hover:underline dark:text-red-400'

export const card = 'rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none'
