import { X, Printer, QrCode, ExternalLink } from 'lucide-react'
import QRCode from 'react-qr-code'

interface PetQrModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  petName: string
}

export function PetQrModal({ isOpen, onClose, petId, petName }: PetQrModalProps) {
  if (!isOpen) return null

  // Esta será la URL pública dinámica
  const publicUrl = `${window.location.origin}/public/pet/${petId}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative">
        
        {/* Botón cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-500 mb-4">
          <QrCode size={32} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 text-center">
          Identificador de {petName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Escaneá este código para acceder a la placa pública de tu mascota.
        </p>

        {/* CONTENEDOR DEL QR */}
        <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100 mb-6" id="qr-printable-area">
          <QRCode 
            value={publicUrl} 
            size={180} // Lo achiqué un poquito para que entre bien el link
            level="H" 
            className="rounded-lg"
          />
        </div>

        {/* --- NUEVO: CONTENEDOR DEL LINK --- */}
        <div className="w-full bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 flex items-center gap-2 mb-6">
          <div className="flex-1 truncate text-xs text-gray-500 dark:text-gray-400 font-mono px-2">
            {publicUrl}
          </div>
          <a 
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Abrir <ExternalLink size={12} />
          </a>
        </div>

        <button 
          onClick={handlePrint}
          className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black py-3.5 rounded-xl font-bold transition-colors"
        >
          <Printer size={18} />
          Imprimir QR
        </button>
      </div>
    </div>
  )
}