import { useSyncExternalStore } from 'react'

// ==========================================================
// TEMA (claro / oscuro)
// - 'system' (por defecto): sigue al dispositivo, también si cambia con la página abierta.
// - 'light' / 'dark': elección explícita del usuario, guardada en localStorage.theme.
// Un solo estado para toda la app (landing, login, app), sincronizado entre pestañas.
// El script en index.html aplica el tema antes de que cargue React, para que no parpadee.
// ==========================================================

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

let preference: ThemePreference = readPreference()
const listeners = new Set<() => void>()

const resolveDark = () => preference === 'dark' || (preference === 'system' && !!media?.matches)

function apply() {
  const dark = resolveDark()
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  listeners.forEach((l) => l())
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY) // sin elección: seguimos al sistema
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* modo privado o storage bloqueado: igual se aplica en esta pestaña */
  }
  apply()
}

if (typeof window !== 'undefined') {
  // El sistema cambió de tema (ej: modo noche automático): solo importa si el usuario no eligió uno
  media?.addEventListener('change', () => {
    if (preference === 'system') apply()
  })
  // Otra pestaña cambió la preferencia
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      preference = readPreference()
      apply()
    }
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference, () => 'system' as ThemePreference)
  const isDark = useSyncExternalStore(subscribe, resolveDark, () => false)
  return { preference: pref, isDark, setPreference: setThemePreference }
}
