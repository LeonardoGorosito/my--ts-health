import { prisma } from '../db.js'

// ==========================================================
// DE LA VETERINARIA A LA APP DEL DUEÑO
// Si el paciente está vinculado a una mascota de PetHealth (código del dueño):
// - Vacunas y desparasitaciones de la clínica se copian a la libreta del dueño
//   (Vaccination / Deworming con clinicPreventiveId), así entran en recordatorios,
//   la campana y la ficha PDF. Si la clínica las edita o borra, se actualizan.
// - Las consultas solo se copian si el vete marca "Compartir con la familia":
//   el dueño ve el motivo y las indicaciones (ownerNote), nunca las notas clínicas.
// Si el dueño deja de compartir, lo que ya recibió queda en su libreta.
// Ningún error de sincronización frena la carga en la clínica: se registra y sigue.
// ==========================================================

const RECORD_TYPE_LABEL: Record<string, string> = {
  CONSULTATION: 'Consulta',
  CONTROL: 'Control',
  EMERGENCY: 'Urgencia',
  SURGERY: 'Cirugía',
  OTHER: 'Atención',
}

export async function syncPreventive(preventiveId: string) {
  try {
    const p = await prisma.clinicPreventive.findUnique({
      where: { id: preventiveId },
      include: { patient: { select: { petId: true } }, clinic: { select: { name: true } } },
    })
    if (!p) return
    const petId = p.patient.petId
    if (!petId) return unsyncPreventive(preventiveId)

    const common = {
      name: p.name,
      dateApplied: p.dateApplied,
      nextDueDate: p.nextDueDate,
      sourceClinic: p.clinic.name,
      petId,
    }
    if (p.kind === 'VACCINE') {
      await prisma.deworming.deleteMany({ where: { clinicPreventiveId: p.id } })
      const existing = await prisma.vaccination.findUnique({ where: { clinicPreventiveId: p.id } })
      // Si cambió la próxima dosis, el recordatorio por email vuelve a quedar pendiente
      const sameDue = existing?.nextDueDate?.getTime() === p.nextDueDate?.getTime()
      await prisma.vaccination.upsert({
        where: { clinicPreventiveId: p.id },
        create: { ...common, clinicPreventiveId: p.id, notes: p.lot ? `Lote ${p.lot}` : null },
        update: { ...common, notes: p.lot ? `Lote ${p.lot}` : null, ...(sameDue ? {} : { reminderSentAt: null }) },
      })
    } else {
      await prisma.vaccination.deleteMany({ where: { clinicPreventiveId: p.id } })
      const existing = await prisma.deworming.findUnique({ where: { clinicPreventiveId: p.id } })
      const sameDue = existing?.nextDueDate?.getTime() === p.nextDueDate?.getTime()
      await prisma.deworming.upsert({
        where: { clinicPreventiveId: p.id },
        create: { ...common, clinicPreventiveId: p.id, type: p.route ?? 'INTERNA' },
        update: { ...common, type: p.route ?? 'INTERNA', ...(sameDue ? {} : { reminderSentAt: null }) },
      })
    }
  } catch (error) {
    console.error('No se pudo sincronizar la vacuna/desparasitación con la app del dueño', preventiveId, error)
  }
}

export async function unsyncPreventive(preventiveId: string) {
  try {
    await prisma.vaccination.deleteMany({ where: { clinicPreventiveId: preventiveId } })
    await prisma.deworming.deleteMany({ where: { clinicPreventiveId: preventiveId } })
  } catch (error) {
    console.error('No se pudo quitar la vacuna/desparasitación de la app del dueño', preventiveId, error)
  }
}

export async function syncRecord(recordId: string) {
  try {
    const r = await prisma.clinicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: { select: { petId: true } }, clinic: { select: { name: true } } },
    })
    if (!r) return
    const petId = r.patient.petId
    if (!petId || !r.sharedWithOwner) return unsyncRecord(recordId)

    const data = {
      petId,
      date: r.date,
      title: `${RECORD_TYPE_LABEL[r.type] ?? 'Consulta'} en ${r.clinic.name}: ${r.reason}`.slice(0, 200),
      description: r.ownerNote?.trim() || 'Sin indicaciones adicionales.',
      sourceClinic: r.clinic.name,
    }
    await prisma.medicalRecord.upsert({
      where: { clinicalRecordId: r.id },
      create: { ...data, clinicalRecordId: r.id },
      update: data,
    })
  } catch (error) {
    console.error('No se pudo compartir la consulta con la app del dueño', recordId, error)
  }
}

export async function unsyncRecord(recordId: string) {
  try {
    await prisma.medicalRecord.deleteMany({ where: { clinicalRecordId: recordId } })
  } catch (error) {
    console.error('No se pudo quitar la consulta de la app del dueño', recordId, error)
  }
}
