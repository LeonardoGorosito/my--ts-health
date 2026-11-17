import { PlacoIcon } from './PlacoIcon'

// Logo completo: ícono de Placo + "PetHealth". Los tamaños mantienen la proporción del diseño.
const SIZES = {
  sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
  md: { icon: 36, text: 'text-2xl', gap: 'gap-2' },
  lg: { icon: 48, text: 'text-4xl', gap: 'gap-3' },
} as const

interface LogoProps {
  size?: keyof typeof SIZES
  className?: string
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <PlacoIcon size={s.icon} />
      <span className={`font-brand ${s.text} leading-none tracking-tight`}>
        <span className="font-bold text-[#052E2B] dark:text-white">Pet</span>
        <span className="font-medium text-emerald-700 dark:text-emerald-300">Health</span>
      </span>
    </span>
  )
}
