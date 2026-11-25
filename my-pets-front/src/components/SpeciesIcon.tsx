import { speciesInfo } from '../lib/species'

// Ícono de la especie (perro, gato, ave, conejo...) para fotos vacías y listas
export function SpeciesIcon({ species, size, className }: { species: string | null | undefined; size: number; className?: string }) {
  const Icon = speciesInfo(species).icon
  return <Icon size={size} aria-hidden="true" className={className} />
}
