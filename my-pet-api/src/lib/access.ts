import type { FastifyReply } from 'fastify'
import { prisma } from '../db.js'
import { getSubscription } from './subscription.js'

// ==========================================================
// ACCESO A UNA MASCOTA
// - OWNER: el dueño (Pet.ownerId).
// - CAREGIVER: un familiar que aceptó una invitación (PetMember).
// Escribir depende del plan del DUEÑO: los invitados no necesitan pagar,
// y si el plan del dueño vence, nadie puede editar (la placa sigue andando).
// ==========================================================

export type PetRole = 'OWNER' | 'CAREGIVER'

export async function petAccess(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { id: true, ownerId: true, members: { where: { userId }, select: { id: true } } },
  })
  if (!pet) return null
  const role: PetRole | null = pet.ownerId === userId ? 'OWNER' : pet.members.length > 0 ? 'CAREGIVER' : null
  return role ? { petId: pet.id, ownerId: pet.ownerId, role } : null
}

// Filtro de Prisma: mascotas propias o compartidas con el usuario
export const accessibleBy = (userId: string) => ({
  OR: [{ ownerId: userId }, { members: { some: { userId } } }],
})

type GuardOptions = {
  ownerOnly?: boolean // acciones que solo puede hacer el dueño (borrar la mascota, compartir)
  requirePlan?: boolean // crear/editar: el plan del dueño tiene que estar activo
  feature?: 'attachments' // función que debe incluir el plan del dueño
}

// Verifica el acceso y responde el error si no lo hay. Devuelve el acceso o null (ya respondió).
// 404 en vez de 403 cuando no tiene acceso, para no revelar que la mascota existe.
export async function guardPet(reply: FastifyReply, petId: string | undefined, userId: string, opts: GuardOptions = {}) {
  const access = petId ? await petAccess(petId, userId) : null
  if (!access) {
    reply.status(404).send({ message: 'Mascota no encontrada' })
    return null
  }
  if (opts.ownerOnly && access.role !== 'OWNER') {
    reply.status(403).send({ message: 'Solo el dueño de la mascota puede hacer esto' })
    return null
  }
  if (opts.requirePlan || opts.feature) {
    const sub = await getSubscription(access.ownerId)
    if (sub.limits.readOnly) {
      reply.code(402).send({
        code: 'SUBSCRIPTION_EXPIRED',
        message:
          access.role === 'OWNER'
            ? 'Tu prueba gratis terminó. Elegí un plan para seguir editando.'
            : 'El plan de la persona que te compartió esta mascota no está activo, así que por ahora no se puede editar.',
      })
      return null
    }
    if (opts.feature && !sub.limits[opts.feature]) {
      reply.code(402).send({
        code: 'PLAN_REQUIRED',
        feature: opts.feature,
        message:
          access.role === 'OWNER'
            ? 'Esta función está incluida en el plan Pro.'
            : 'El plan de la persona que te compartió esta mascota no incluye esta función.',
      })
      return null
    }
  }
  return access
}

// Qué puede hacer el usuario con la mascota (se manda al front junto con el perfil)
export async function petPermissions(ownerId: string, role: PetRole) {
  const sub = await getSubscription(ownerId)
  return {
    access: role,
    canEdit: !sub.limits.readOnly,
    canAttach: !sub.limits.readOnly && sub.limits.attachments,
  }
}
