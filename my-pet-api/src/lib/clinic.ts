import type { FastifyReply } from 'fastify'
import type { MultipartFile } from '@fastify/multipart'
import { prisma } from '../db.js'
import cloudinary from './cloudinary.js'

// ==========================================================
// ACCESO A UNA CLÍNICA
// - OWNER: todo, incluido el equipo y los datos de la clínica.
// - VET: clientes, pacientes e historia clínica.
// - STAFF (recepción): clientes y pacientes; ve la historia pero no la carga.
// La matrícula pendiente no frena la carga de datos (en la etapa 2 va a hacer
// falta aprobada para firmar recetas y certificados).
// ==========================================================

export type ClinicRole = 'OWNER' | 'VET' | 'STAFF'

// Quién puede hacer qué
export const CAN = {
  manageClinic: ['OWNER'] as ClinicRole[],
  clinical: ['OWNER', 'VET'] as ClinicRole[], // historia clínica, vacunas, estudios
  deleteRecords: ['OWNER', 'VET'] as ClinicRole[], // borrar clientes, pacientes y registros
  any: ['OWNER', 'VET', 'STAFF'] as ClinicRole[],
}

export async function guardClinic(reply: FastifyReply, clinicId: string | undefined, userId: string, roles: ClinicRole[] = CAN.any) {
  const member = clinicId
    ? await prisma.clinicMember.findUnique({ where: { clinicId_userId: { clinicId, userId } } })
    : null
  if (!member) {
    reply.status(404).send({ message: 'Clínica no encontrada' })
    return null
  }
  if (!roles.includes(member.role)) {
    reply.status(403).send({
      message: member.role === 'STAFF' ? 'Esta acción la hace un veterinario de la clínica' : 'Solo quien administra la clínica puede hacer esto',
    })
    return null
  }
  return member
}

// Paciente de la clínica (404 si no es de esta clínica)
export async function findClinicPatient(reply: FastifyReply, clinicId: string, patientId: string) {
  const patient = await prisma.clinicPatient.findFirst({ where: { id: patientId, clinicId } })
  if (!patient) reply.status(404).send({ message: 'Paciente no encontrado' })
  return patient
}

// ---------- Carnet de matrícula: archivo privado en Cloudinary ----------

export async function uploadLicensePhoto(file: MultipartFile): Promise<string> {
  const buffer = await file.toBuffer()
  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'pet-health/licenses', type: 'authenticated', resource_type: 'image' },
      (error, res) => (error || !res ? reject(error) : resolve(res as { public_id: string })),
    )
    stream.end(buffer)
  })
  return result.public_id
}

// URL firmada y temporal para que el admin vea el carnet
export function licensePhotoUrl(publicId: string | null) {
  if (!publicId) return null
  return cloudinary.url(publicId, { type: 'authenticated', sign_url: true, secure: true, resource_type: 'image' })
}

export async function destroyLicensePhoto(publicId: string | null) {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { type: 'authenticated', resource_type: 'image' })
  } catch (error) {
    console.error('Error borrando carnet de Cloudinary', publicId, error)
  }
}

// Sube un archivo público (logo de la clínica, estudios) y devuelve la URL
export async function uploadPublicFile(file: MultipartFile, folder: string) {
  const buffer = await file.toBuffer()
  return new Promise<{ secure_url: string; format?: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `pet-health/${folder}`, resource_type: 'auto' },
      (error, res) => (error || !res ? reject(error) : resolve(res as { secure_url: string; format?: string })),
    )
    stream.end(buffer)
  })
}

// Lee un formulario multipart: campos de texto + archivos por nombre de campo
export async function readMultipart(parts: AsyncIterableIterator<import('@fastify/multipart').Multipart>) {
  const fields: Record<string, string> = {}
  const files: Record<string, MultipartFile> = {}
  for await (const part of parts) {
    if (part.type === 'file') {
      // Hay que consumir el archivo para seguir leyendo: lo guardamos como buffer en memoria
      const buffer = await part.toBuffer()
      files[part.fieldname] = { ...part, toBuffer: async () => buffer } as MultipartFile
    } else {
      fields[part.fieldname] = String(part.value ?? '')
    }
  }
  return { fields, files }
}
