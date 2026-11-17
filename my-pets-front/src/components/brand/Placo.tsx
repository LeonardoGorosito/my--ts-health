// Placo, la mascota de PetHealth: la placa del collar que une a cada mascota con su familia.
// `mood` cambia la expresión para usarlo en estados vacíos, errores o celebraciones.

interface PlacoProps {
  size?: number
  className?: string
  mood?: 'happy' | 'sad'
  title?: string
}

export function Placo({ size = 160, className = '', mood = 'happy', title = 'Placo, la mascota de PetHealth' }: PlacoProps) {
  const height = Math.round(size * 1.1)
  return (
    <svg width={size} height={height} viewBox="0 0 200 220" className={className} role="img" aria-label={title}>
      <circle cx="100" cy="30" r="16" fill="none" stroke="#F59E0B" strokeWidth="8" />
      <rect x="93" y="42" width="14" height="16" rx="4" fill="#F59E0B" />
      <ellipse cx="28" cy="146" rx="13" ry="11" fill="#10B981" stroke="#047857" strokeWidth="3" />
      <ellipse cx="172" cy="146" rx="13" ry="11" fill="#10B981" stroke="#047857" strokeWidth="3" />
      <ellipse cx="76" cy="206" rx="17" ry="9" fill="#047857" />
      <ellipse cx="124" cy="206" rx="17" ry="9" fill="#047857" />
      <circle cx="100" cy="128" r="76" fill="#10B981" />
      <circle cx="100" cy="128" r="64" fill="none" stroke="#6EE7B7" strokeWidth="4" opacity="0.7" />
      <ellipse cx="74" cy="114" rx="9" ry="12" fill="#052E2B" />
      <ellipse cx="126" cy="114" rx="9" ry="12" fill="#052E2B" />
      <circle cx="77" cy="109" r="3" fill="#FFFFFF" />
      <circle cx="129" cy="109" r="3" fill="#FFFFFF" />
      <ellipse cx="60" cy="138" rx="10" ry="6" fill="#FCA5A5" />
      <ellipse cx="140" cy="138" rx="10" ry="6" fill="#FCA5A5" />
      {mood === 'happy' ? (
        <path d="M84 140 Q100 156 116 140" fill="none" stroke="#052E2B" strokeWidth="5" strokeLinecap="round" />
      ) : (
        <path d="M86 150 Q100 138 114 150" fill="none" stroke="#052E2B" strokeWidth="5" strokeLinecap="round" />
      )}
      <g fill="#FFFFFF" opacity="0.85">
        <rect x="84" y="166" width="9" height="9" rx="1.5" />
        <rect x="107" y="166" width="9" height="9" rx="1.5" />
        <rect x="84" y="182" width="9" height="9" rx="1.5" />
        <rect x="97" y="173" width="5" height="5" />
        <rect x="107" y="182" width="5" height="5" />
        <rect x="112" y="187" width="4" height="4" />
      </g>
    </svg>
  )
}
