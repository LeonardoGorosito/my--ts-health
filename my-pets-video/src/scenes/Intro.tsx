import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placo} from '../brand/Placo';
import {brandFont, isVertical} from '../brand/theme';

// Escena 1: Placo cae, rebota, parpadea y se presenta
const IntroInner = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const vertical = isVertical(width, height);

	return (
		<>
			<div
				style={{
					display: 'flex',
					flexDirection: vertical ? 'column' : 'row',
					alignItems: 'center',
					gap: vertical ? 56 : 96,
				}}
			>
				<Interactive.Div
					name="Placo"
					style={{
						translate: interpolate(frame, [0, 0.9 * fps], ['0px -1400px', '0px 0px'], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.spring({damping: 11, stiffness: 120}),
						}),
						rotate: interpolate(frame, [0, 0.9 * fps], ['-14deg', '0deg'], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.spring({damping: 11, stiffness: 120}),
						}),
					}}
				>
					<Placo
						size={vertical ? 460 : 420}
						blink={interpolate(frame, [1.5 * fps, 1.6 * fps, 1.7 * fps], [0, 1, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						})}
					/>
				</Interactive.Div>
				<div style={{textAlign: vertical ? 'center' : 'left'}}>
					<Interactive.Div
						name="Saludo"
						style={{
							fontFamily: brandFont,
							fontWeight: 700,
							fontSize: vertical ? 112 : 128,
							lineHeight: 1,
							letterSpacing: '-0.03em',
							textWrap: 'balance',
							color: '#FFFFFF',
							opacity: interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
							translate: interpolate(frame, [0.7 * fps, 1.2 * fps], ['0px 40px', '0px 0px'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.16, 1, 0.3, 1),
							}),
						}}
					>
						Hola, soy Placo.
					</Interactive.Div>
					<Interactive.Div
						name="Bajada"
						style={{
							marginTop: 28,
							fontFamily: brandFont,
							fontWeight: 500,
							fontSize: vertical ? 52 : 56,
							color: '#A7F3D0',
							opacity: interpolate(frame, [1.1 * fps, 1.5 * fps], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
							translate: interpolate(frame, [1.1 * fps, 1.6 * fps], ['0px 30px', '0px 0px'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.16, 1, 0.3, 1),
							}),
						}}
					>
						La placa que cuida a tu mascota.
					</Interactive.Div>
				</div>
			</div>
		</>
	);
};

export const Intro = Interactive.create({
	Component: IntroInner,
	layout: 'absolute-fill',
	schema: {
		...Interactive.backgroundSchema,
	},
});
