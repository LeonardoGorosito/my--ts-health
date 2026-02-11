import { useRef, useState } from 'react'
import { toast } from 'sonner' // O la librería de alertas que uses
import { uploadPetAttachment } from '../lib/axios'

interface Props {
  petId: string
  onUploadSuccess?: () => void // Para recargar la lista después de subir
}

export function UploadButton({ petId, onUploadSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (ej. 10MB) antes de enviar
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy pesado (máx 10MB)')
      return
    }

    try {
      setIsUploading(true)
      toast.info('Subiendo archivo...')
      
      await uploadPetAttachment(petId, file)
      
      toast.success('¡Estudio guardado correctamente!')
      if (onUploadSuccess) onUploadSuccess()
      
    } catch (error) {
      console.error(error)
      toast.error('Error al subir el archivo')
    } finally {
      setIsUploading(false)
      // Limpiar el input para permitir subir el mismo archivo de nuevo si falla
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Input oculto (el truco para personalizar el botón) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf" // Acepta imágenes y PDFs
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Subiendo...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Subir Estudio
          </>
        )}
      </button>
    </>
  )
}