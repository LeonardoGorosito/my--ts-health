import { SPECIES, SPECIES_ORDER } from '../lib/species'
import type { Species } from '../lib/species'

// Selector de especie (alta y edición de mascota): grilla de opciones con ícono, como un grupo de radios
export function SpeciesPicker({ value, onChange, name }: { value: Species; onChange: (s: Species) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label="Especie" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {SPECIES_ORDER.map((s) => {
        const { icon: Icon, label } = SPECIES[s]
        const selected = value === s
        return (
          <label
            key={s}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-xs font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-600 ${
              selected
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'border-transparent bg-gray-50 text-gray-600 hover:border-gray-200 dark:bg-bg-matte dark:text-gray-400 dark:hover:border-neutral-700'
            }`}
          >
            <input type="radio" name={name} value={s} checked={selected} onChange={() => onChange(s)} className="sr-only" />
            <Icon size={20} aria-hidden="true" />
            {label}
          </label>
        )
      })}
    </div>
  )
}
