// Ícono de la marca: la placa de collar (Placo) con una huella adentro.
// Se adapta solo al modo oscuro. `inverted` = versión blanca para usar sobre fondo verde.

interface PlacoIconProps {
  size?: number
  className?: string
  inverted?: boolean
}

export function PlacoIcon({ size = 32, className = '', inverted = false }: PlacoIconProps) {
  const ring = inverted ? 'stroke-white' : 'stroke-amber-500 dark:stroke-amber-400'
  const body = inverted ? 'fill-white' : 'fill-emerald-500 dark:fill-emerald-400'
  const paw = inverted ? 'fill-emerald-500' : 'fill-white dark:fill-[#052E2B]'

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="13" r="9" fill="none" strokeWidth="6" className={ring} />
      <circle cx="50" cy="58" r="38" className={body} />
      <g transform="translate(29 37) scale(0.42)" className={paw}>
        <path d="M50 48 C66 48 80 62 80 74 C80 86 70 90 62 88 C56 86 54 84 50 84 C46 84 44 86 38 88 C30 90 20 86 20 74 C20 62 34 48 50 48 Z" />
        <ellipse cx="24" cy="40" rx="8" ry="10" transform="rotate(-20 24 40)" />
        <ellipse cx="40" cy="24" rx="9" ry="11" />
        <ellipse cx="60" cy="24" rx="9" ry="11" />
        <ellipse cx="76" cy="40" rx="8" ry="10" transform="rotate(20 76 40)" />
      </g>
    </svg>
  )
}
