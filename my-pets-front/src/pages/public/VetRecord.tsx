import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Download } from 'lucide-react'
import { api } from '../../lib/axios'
import { Loader } from '../../components/Loader'
import { Placo } from '../../components/brand/Placo'
import { PetRecordSheet } from '../../components/PetRecordSheet'
import type { PetRecordData, RecordContact } from '../../components/PetRecordSheet'

// ==========================================================
// FICHA PARA EL VETERINARIO (/vet/:token) — pública, de solo lectura y temporal.
// La familia genera el link desde "Compartir" en el perfil de la mascota.
// ==========================================================

type VetData = { pet: PetRecordData & { owner: RecordContact }; expiresAt: string }

export function VetRecord() {
  const { token } = useParams()
  const [data, setData] = useState<VetData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/shares/vet/${token}`)
      .then((res) => setData(res.data))
      .catch((e) => {
        const message = isAxiosError(e) ? e.response?.data?.message : null
        setError(message || 'No pudimos abrir la ficha. Revisá el link o pedile a la familia que te mande uno nuevo.')
      })
  }, [token])

  useEffect(() => {
    if (!data) return
    const previous = document.title
    document.title = `Ficha de ${data.pet.name} - PetHealth`
    return () => { document.title = previous }
  }, [data])

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center dark:bg-gray-950">
        <Placo size={110} mood="sad" title="Placo triste" />
        <h1 className="font-brand text-2xl font-bold text-gray-900 dark:text-white">No se puede abrir la ficha</h1>
        <p className="max-w-md text-gray-600 dark:text-gray-400">{error}</p>
      </main>
    )
  }
  if (!data) return <Loader text="Cargando la ficha..." />

  const expires = new Date(data.expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 print:bg-white">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            La familia de <strong className="text-gray-900 dark:text-white">{data.pet.name}</strong> compartió esta ficha con vos. Se puede ver hasta el {expires}.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Download size={18} aria-hidden="true" /> Descargar PDF
          </button>
        </div>
      </header>
      <main className="px-2 py-6 sm:px-4 print:p-0">
        <PetRecordSheet pet={data.pet} contact={data.pet.owner} />
      </main>
    </div>
  )
}
