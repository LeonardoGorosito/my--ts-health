import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { X, Siren, PartyPopper, FileImage } from 'lucide-react'
import { api } from '../lib/axios'

interface LostModeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  pet: {
    id: string
    name: string
    isLost?: boolean
    lostSince?: string | null
    lostMessage?: string | null
  }
}

const MAX_MESSAGE = 500

export function LostModeModal({ isOpen, onClose, onSuccess, pet }: LostModeModalProps) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Al abrir, cargamos el mensaje actual (si ya estaba perdida)
  useEffect(() => {
    if (isOpen) setMessage(pet.lostMessage ?? '')
  }, [isOpen, pet.lostMessage])

  if (!isOpen) return null

  const save = async (isLost: boolean) => {
    setSaving(true)
    try {
      await api.put(`/pets/${pet.id}/lost`, { isLost, lostMessage: isLost ? message : undefined })
      if (isLost) {
        toast.success(pet.isLost ? 'Aviso actualizado' : `Modo perdida activado para ${pet.name}`)
      } else {
        toast.success(`¡Qué alegría que ${pet.name} haya aparecido!`)
      }
      onSuccess()
      onClose()
    } catch (e) {
      const msg = isAxiosError(e) ? e.response?.data?.message : undefined
      toast.error(msg || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Siren className="text-red-500" aria-hidden="true" />
            {pet.isLost ? `${pet.name} está perdida/o` : 'Reportar como perdida/o'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" className="text-gray-400" />
          </button>
        </div>

        {pet.isLost && pet.lostSince && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Perdida/o desde el <strong>{new Date(pet.lostSince).toLocaleDateString()}</strong>.
          </p>
        )}

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4 text-sm text-red-800 dark:text-red-300 mb-4 space-y-1">
          <p>Mientras esté activo, quien escanee la placa QR verá un aviso de <strong>mascota perdida</strong>.</p>
          <p>Tu <strong>teléfono se va a mostrar</strong> en la placa aunque lo tengas oculto, para que puedan contactarte rápido.</p>
        </div>

        <label htmlFor="lost-message" className="block text-xs font-bold text-gray-500 mb-1">
          Mensaje para quien la/o encuentre (opcional)
        </label>
        <textarea
          id="lost-message"
          value={message}
          maxLength={MAX_MESSAGE}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-gray-50 dark:bg-zinc-800 dark:text-white rounded-xl p-3 text-sm border-2 border-transparent focus:border-red-500 outline-none min-h-[100px]"
          placeholder="Ej: Se perdió en Palermo el sábado. Es asustadiza, no la persigan. ¡Recompensa!"
        />
        <p className="text-[10px] text-gray-400 text-right mt-1">{message.length}/{MAX_MESSAGE}</p>

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase tracking-wide transition-colors"
          >
            {saving ? 'Guardando...' : pet.isLost ? 'Actualizar mensaje' : 'Activar modo perdida'}
          </button>

          {pet.isLost && (
            <Link
              to={`/app/pets/${pet.id}/afiche`}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 text-red-700 dark:text-red-300 ring-2 ring-red-600 hover:bg-red-50 dark:hover:bg-zinc-700 py-3 rounded-xl font-bold uppercase tracking-wide transition-colors"
            >
              <FileImage size={18} aria-hidden="true" /> Crear afiche &quot;Se busca&quot;
            </Link>
          )}

          {pet.isLost && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase tracking-wide transition-colors"
            >
              <PartyPopper size={18} aria-hidden="true" /> ¡Ya apareció!
            </button>
          )}

          <button type="button" onClick={onClose} className="py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
            CANCELAR
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
