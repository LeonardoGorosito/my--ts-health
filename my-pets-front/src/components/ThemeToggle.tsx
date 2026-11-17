import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { ThemePreference } from '../hooks/useTheme'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', Icon: Monitor },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
]

// Selector de tema con las tres opciones a la vista (Sistema / Claro / Oscuro).
// `compact` muestra solo íconos, para encabezados; el nombre queda como tooltip y para lectores de pantalla.
export function ThemeToggle({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Tema de la página"
      className={`inline-flex items-center gap-0.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={compact ? `Tema: ${label}` : undefined}
            title={compact ? label : undefined}
            onClick={() => setPreference(value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
              compact ? 'h-8 w-8' : 'flex-1 px-3 py-1.5'
            } ${
              active
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-950 dark:text-emerald-300'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {!compact && label}
          </button>
        )
      })}
    </div>
  )
}
