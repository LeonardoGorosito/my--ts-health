import { useAuth } from '../context/AuthContext'
import type { Subscription } from '../context/AuthContext'

// Mientras no llegó el plan desde /auth/me, asumimos acceso completo:
// el backend igual controla los límites, esto solo decide qué botones mostrar.
const FALLBACK: Subscription = {
  tier: 'TRIAL',
  plan: null,
  planExpiresAt: null,
  trialEndsAt: null,
  trialDaysLeft: 0,
  limits: { maxPets: null, reminders: true, attachments: true, readOnly: false },
}

export function useSubscription(): Subscription {
  const { user } = useAuth()
  return user?.subscription ?? FALLBACK
}
