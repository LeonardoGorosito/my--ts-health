// Compara la fecha guardada con la que manda el front ("YYYY-MM-DD" o vacío)
export const sameDate = (stored: Date | null, incoming?: string) => {
  const next = incoming ? new Date(incoming) : null
  if (!stored || !next) return stored === next
  return stored.getTime() === next.getTime()
}
