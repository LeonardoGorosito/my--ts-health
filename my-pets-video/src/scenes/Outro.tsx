import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placo, PlacoIcon} from '../brand/Placo';
import {brandFont, isVertical} from '../brand/theme';

// Escena 5: logo, propuesta y llamado a la acción
const OutroInner = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const vertical = isVertical(width, height);

	return (
		<>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
				<Interactive.Div
					name="Placo saludando"
					style={{
						scale: interpolate(frame, [0, 0.6 * fps], [0.4, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							output: 'perceptual-scale',
							easing: Easing.spring({damping: 12, stiffness: 140}),
						}),
						rotate: interpolate(frame, [1.2 * fps, 1.45 * fps, 1.7 * fps, 1.95 * fps], ['0deg', '-8deg', '8deg', '0deg'], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					}}
				>
					<Placo size={vertical ? 400 : 260} />
				</Interactive.Div>

				<Interactive.Div
					name="Logo"
					style={{
						marginTop: vertical ? 56 : 36,
						display: 'flex',
						alignItems: 'center',
						gap: 28,
						opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
						translate: interpolate(frame, [0.4 * fps, 0.9 * fps], ['0px 30px', '0px 0px'], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.bezier(0.16, 1, 0.3, 1),
						}),
					}}
				>
					<PlacoIcon size={vertical ? 120 : 110} />
					<div style={{fontFamily: brandFont, fontSize: vertical ? 130 : 120, lineHeight: 1, letterSpacing: '-0.03em'}}>
						<span style={{fontWeight: 700, color: '#FFFFFF'}}>Pet</span>
						<span style={{fontWeight: 500, color: '#6EE7B7'}}>Health</span>
					</div>
				</Interactive.Div>

				<Interactive.Div
					name="Propuesta"
					style={{
						marginTop: 28,
						maxWidth: vertical ? 860 : 1400,
						fontFamily: brandFont,
						fontWeight: 500,
						fontSize: vertical ? 50 : 52,
						textWrap: 'balance',
						color: '#D1FAE5',
						opacity: interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					}}
				>
					Historia clínica y placa QR para tus mascotas.
				</Interactive.Div>

				<Interactive.Div
					name="Llamado a la acción"
					style={{
						marginTop: vertical ? 64 : 48,
						borderRadius: 999,
						backgroundColor: '#FFFFFF',
						color: '#065F46',
						fontFamily: brandFont,
						fontWeight: 700,
						fontSize: vertical ? 52 : 48,
						padding: vertical ? '30px 64px' : '26px 60px',
						scale: interpolate(frame, [1.3 * fps, 1.8 * fps], [0.85, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							output: 'perceptual-scale',
							easing: Easing.spring({damping: 14, stiffness: 160}),
						}),
						opacity: interpolate(frame, [1.3 * fps, 1.6 * fps], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					}}
				>
					Probalo 30 días gratis
				</Interactive.Div>
			</div>
		</>
	);
};

export const Outro = Interactive.create({
	Component: OutroInner,
	layout: 'absolute-fill',
	schema: {
		...Interactive.backgroundSchema,
	},
});
