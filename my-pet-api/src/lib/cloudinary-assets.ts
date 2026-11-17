import cloudinary from './cloudinary.js'

// Extrae el public_id y el tipo de recurso de una URL de Cloudinary, por ejemplo:
//   https://res.cloudinary.com/<cloud>/image/upload/v1712345/pet-health-attachments/abc.pdf
//   -> { resourceType: 'image', publicId: 'pet-health-attachments/abc' }
// El segmento de versión (v123...) no forma parte del public_id. En los archivos "raw"
// la extensión SÍ es parte del public_id, así que no se quita.
export function parseCloudinaryUrl(url: string) {
  const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?([^?#]+)$/)
  if (!match) return null
  const resourceType = match[1] as 'image' | 'video' | 'raw'
  const path = decodeURIComponent(match[2])
  const publicId = resourceType === 'raw' ? path : path.replace(/\.[^/.]+$/, '')
  return { resourceType, publicId }
}

// Borra de Cloudinary el archivo de esa URL. Nunca tira error: si falla, lo registra
// y sigue, para no impedir que se borre el registro en la base.
export async function destroyCloudinaryUrl(url: string | null | undefined) {
  if (!url) return
  const parsed = parseCloudinaryUrl(url)
  if (!parsed) {
    console.error('URL de Cloudinary no reconocida, no se pudo borrar:', url)
    return
  }
  try {
    const res = await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType })
    if (res?.result !== 'ok' && res?.result !== 'not found') {
      console.error('Cloudinary no borró el archivo', parsed, res)
    }
  } catch (error) {
    console.error('Error borrando de Cloudinary', parsed, error)
  }
}
