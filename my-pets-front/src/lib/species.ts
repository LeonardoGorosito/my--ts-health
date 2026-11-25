import { Bird, Cat, Dog, Fish, PawPrint, Rabbit, Rat, Squirrel, Turtle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ==========================================================
// ESPECIES — único lugar donde se definen (el enum Species vive en
// my-pet-api/prisma/schema.prisma: si agregás una, agregala en los dos lados).
// ==========================================================

export type Species = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'RODENT' | 'FERRET' | 'REPTILE' | 'FISH' | 'HORSE' | 'OTHER'

type SpeciesInfo = {
  label: string // para elegir en el formulario ("Perro")
  male: string // ficha y afiche, según el sexo
  female: string
  icon: LucideIcon
  breedHint: string // ejemplo para el campo "Raza / tipo"
}

export const SPECIES: Record<Species, SpeciesInfo> = {
  DOG: { label: 'Perro', male: 'Perro', female: 'Perra', icon: Dog, breedHint: 'Ej: Labrador, mestizo' },
  CAT: { label: 'Gato', male: 'Gato', female: 'Gata', icon: Cat, breedHint: 'Ej: Siamés, común europeo' },
  BIRD: { label: 'Ave', male: 'Ave', female: 'Ave', icon: Bird, breedHint: 'Ej: canario, cotorra, loro' },
  RABBIT: { label: 'Conejo', male: 'Conejo', female: 'Coneja', icon: Rabbit, breedHint: 'Ej: belier, enano' },
  RODENT: { label: 'Roedor', male: 'Roedor', female: 'Roedora', icon: Rat, breedHint: 'Ej: hámster, cobayo, chinchilla' },
  FERRET: { label: 'Hurón', male: 'Hurón', female: 'Hurona', icon: Squirrel, breedHint: 'Ej: hurón doméstico' },
  REPTILE: { label: 'Reptil', male: 'Reptil', female: 'Reptil', icon: Turtle, breedHint: 'Ej: tortuga, iguana, gecko' },
  FISH: { label: 'Pez', male: 'Pez', female: 'Pez', icon: Fish, breedHint: 'Ej: betta, goldfish' },
  HORSE: { label: 'Caballo', male: 'Caballo', female: 'Yegua', icon: PawPrint, breedHint: 'Ej: criollo, petiso' },
  OTHER: { label: 'Otra', male: 'Otra especie', female: 'Otra especie', icon: PawPrint, breedHint: 'Contanos qué animal es' },
}

// Orden en el formulario: las más comunes primero
export const SPECIES_ORDER: Species[] = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'FERRET', 'REPTILE', 'FISH', 'HORSE', 'OTHER']

// Datos de una especie, tolerando valores desconocidos (ej: una especie nueva del backend)
export const speciesInfo = (s: string | null | undefined): SpeciesInfo => SPECIES[(s as Species) ?? 'OTHER'] ?? SPECIES.OTHER

// "Gata", "Perro", "Coneja"...
export const speciesName = (s: string | null | undefined, gender?: string | null) => {
  const info = speciesInfo(s)
  return gender === 'Hembra' ? info.female : info.male
}

// Texto para la raza cuando no se cargó: "Mestiza" en perros y gatos, la especie en el resto
export const breedOrDefault = (breed: string | null | undefined, s: string | null | undefined, gender?: string | null) => {
  if (breed) return breed
  if (s === 'DOG' || s === 'CAT') return gender === 'Hembra' ? 'Mestiza' : 'Mestizo'
  return speciesName(s, gender)
}
