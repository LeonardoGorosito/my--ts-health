import { useEffect, useState } from 'react'
import { SpeciesIcon } from '../components/SpeciesIcon'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { api } from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/Loader'
import { Placo } from '../components/brand/Placo'
import { AuthTopBar } from '../components/AuthTopBar'

// ==========================================================
// ACEPTAR INVITACIÓN (/invitacion/:token)
// Muestra quién invita y a qué mascota. Sin sesión, ofrece entrar o crear cuenta
// y vuelve acá después (?next=). Con sesión, un toque y la mascota aparece en su lista.
// ==========================================================

type InviteInfo = {
  pet: { id: string; name: string; species: string; profileImageUrl: string | null }
  owner: { name: string; lastname: string }
  expiresAt: string
}

export function AcceptInvite() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    api.get(`/shares/invite/${token}`)
      .then((res) => setInfo(res.data))
      .catch((e) => setError((isAxiosError(e) && e.response?.data?.message) || 'No pudimos abrir la invitación.'))
  }, [token])

  const accept = async () => {
    setAccepting(true)
    try {
      const res = await api.post(`/shares/invite/${token}/accept`)
      await queryClient.invalidateQueries({ queryKey: ['pets'] })
      toast.success(`Listo, ya podés cuidar a ${info?.pet.name}`)
      navigate(`/app/pets/${res.data.petId}`, { replace: true })
    } catch (e) {
      toast.error((isAxiosError(e) && e.response?.data?.message) || 'No se pudo aceptar la invitación')
      setAccepting(false)
    }
  }

  if (authLoading || (!info && !error)) return <Loader text="Abriendo la invitación..." />

  const next = encodeURIComponent(`/invitacion/${token}`)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AuthTopBar />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center">
        {error || !info ? (
          <>
            <Placo size={110} mood="sad" title="Placo triste" />
            <h1 className="mt-4 font-brand text-2xl font-bold text-gray-900 dark:text-white">La invitación no está disponible</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <Link to={user ? '/app' : '/'} className="mt-6 font-semibold text-emerald-700 underline dark:text-emerald-400">
              {user ? 'Ir a mis mascotas' : 'Ir al inicio'}
            </Link>
          </>
        ) : (
          <>
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-emerald-50 ring-4 ring-white shadow-lg dark:bg-emerald-900/30 dark:ring-gray-900">
              {info.pet.profileImageUrl ? (
                <img src={info.pet.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <SpeciesIcon species={info.pet.species} size={48} className="text-emerald-600" />
              )}
            </div>
            <h1 className="mt-6 font-brand text-3xl font-bold text-gray-900 text-balance dark:text-white">
              {info.owner.name} te invitó a cuidar a {info.pet.name}
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-balance">
              Vas a ver su ficha de salud y vas a poder cargar vacunas, peso, tratamientos y consultas. No necesitás pagar nada.
            </p>

            {user ? (
              <button
                type="button"
                onClick={accept}
                disabled={accepting}
                className="mt-8 w-full rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {accepting ? 'Aceptando...' : 'Aceptar invitación'}
              </button>
            ) : (
              <div className="mt-8 flex w-full flex-col gap-3">
                <Link to={`/register?next=${next}`} className="rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-700">
                  Crear cuenta gratis
                </Link>
                <Link to={`/login?next=${next}`} className="rounded-xl px-6 py-3.5 font-semibold text-gray-800 ring-1 ring-gray-300 transition-colors hover:bg-white dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-900">
                  Ya tengo cuenta
                </Link>
              </div>
            )}
            {user && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Vas a aceptar como {user.email}</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
