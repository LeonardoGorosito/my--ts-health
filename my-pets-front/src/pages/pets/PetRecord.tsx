import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { api } from '../../lib/axios'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../../components/Loader'
import { PetRecordSheet, SECTIONS, ALL_SECTIONS } from '../../components/PetRecordSheet'
import type { PetRecordData, SectionKey } from '../../components/PetRecordSheet'

// ==========================================================
// FICHA DE SALUD PARA IMPRIMIR O GUARDAR EN PDF
// Se genera con el diálogo de impresión del navegador ("Guardar como PDF"):
// texto real y seleccionable, varias páginas, sin librerías extra.
// En pantalla se ve como una hoja; al imprimir solo queda la hoja.
// ==========================================================

export function PetRecord() {
  const { id } = useParams()
  const { user } = useAuth()
  const [pet, setPet] = useState<PetRecordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [include, setInclude] = useState<Record<SectionKey, boolean>>(ALL_SECTIONS)

  useEffect(() => {
    api.get(`/pets/${id}`)
      .then((res) => setPet(res.data))
      .catch(() => setPet(null))
      .finally(() => setLoading(false))
  }, [id])

  // El nombre del PDF guardado sale del título de la página
  useEffect(() => {
    if (!pet) return
    const previous = document.title
    document.title = `Ficha de ${pet.name} - PetHealth`
    return () => { document.title = previous }
  }, [pet])

  if (loading) return <Loader text="Armando la ficha..." />
  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600 dark:bg-gray-950 dark:text-gray-300">
        No encontramos a la mascota. <Link to="/app" className="font-semibold text-emerald-700 underline dark:text-emerald-400">Volver a mis mascotas</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 print:bg-white">
      {/* Barra de herramientas: no se imprime */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to={`/app/pets/${pet.id}`} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
            <ArrowLeft size={18} aria-hidden="true" /> Volver al perfil
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Download size={18} aria-hidden="true" /> Descargar PDF
          </button>
        </div>
        <fieldset className="mx-auto max-w-5xl px-4 pb-3">
          <legend className="sr-only">Secciones a incluir</legend>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(({ key, label }) => (
              <label
                key={key}
                className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
                  include[key]
                    ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800'
                    : 'bg-white text-gray-500 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={include[key]}
                  onChange={(e) => setInclude((s) => ({ ...s, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            En el celular, tocá “Descargar PDF” y elegí “Guardar como PDF” en la impresora para compartirlo por WhatsApp o email.
          </p>
        </fieldset>
      </header>

      {/* La hoja: siempre clara, en pantalla y en papel */}
      <main className="px-2 py-6 sm:px-4 print:p-0">
        <PetRecordSheet pet={pet} contact={user} include={include} />
      </main>
    </div>
  )
}
