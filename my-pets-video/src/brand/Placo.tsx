import type React from 'react';

// Placo, la mascota de PetHealth (copia del SVG de my-pets-front/src/components/brand/Placo.tsx).
// `mood` cambia la boca; `blink` (0 a 1) cierra los ojos para animar un parpadeo.
export const Placo: React.FC<{
	readonly size: number;
	readonly mood?: 'happy' | 'sad';
	readonly blink?: number;
	readonly style?: React.CSSProperties;
}> = ({size, mood = 'happy', blink = 0, style}) => {
	const eyeRy = 12 * (1 - blink * 0.9);
	return (
		<svg width={size} height={size * 1.1} viewBox="0 0 200 220" style={style}>
			<circle cx="100" cy="30" r="16" fill="none" stroke="#F59E0B" strokeWidth="8" />
			<rect x="93" y="42" width="14" height="16" rx="4" fill="#F59E0B" />
			<ellipse cx="28" cy="146" rx="13" ry="11" fill="#10B981" stroke="#047857" strokeWidth="3" />
			<ellipse cx="172" cy="146" rx="13" ry="11" fill="#10B981" stroke="#047857" strokeWidth="3" />
			<ellipse cx="76" cy="206" rx="17" ry="9" fill="#047857" />
			<ellipse cx="124" cy="206" rx="17" ry="9" fill="#047857" />
			<circle cx="100" cy="128" r="76" fill="#10B981" />
			<circle cx="100" cy="128" r="64" fill="none" stroke="#6EE7B7" strokeWidth="4" opacity="0.7" />
			<ellipse cx="74" cy="114" rx="9" ry={eyeRy} fill="#052E2B" />
			<ellipse cx="126" cy="114" rx="9" ry={eyeRy} fill="#052E2B" />
			{blink < 0.5 ? (
				<>
					<circle cx="77" cy="109" r="3" fill="#FFFFFF" />
					<circle cx="129" cy="109" r="3" fill="#FFFFFF" />
				</>
			) : null}
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
	);
};

// Ícono del logo: la placa con una huella (versión para fondo oscuro).
export const PlacoIcon: React.FC<{readonly size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx="50" cy="13" r="9" fill="none" strokeWidth="6" stroke="#FBBF24" />
		<circle cx="50" cy="58" r="38" fill="#34D399" />
		<g transform="translate(29 37) scale(0.42)" fill="#052E2B">
			<path d="M50 48 C66 48 80 62 80 74 C80 86 70 90 62 88 C56 86 54 84 50 84 C46 84 44 86 38 88 C30 90 20 86 20 74 C20 62 34 48 50 48 Z" />
			<ellipse cx="24" cy="40" rx="8" ry="10" transform="rotate(-20 24 40)" />
			<ellipse cx="40" cy="24" rx="9" ry="11" />
			<ellipse cx="60" cy="24" rx="9" ry="11" />
			<ellipse cx="76" cy="40" rx="8" ry="10" transform="rotate(20 76 40)" />
		</g>
	</svg>
);
