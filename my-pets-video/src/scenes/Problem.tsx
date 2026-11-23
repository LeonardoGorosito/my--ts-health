import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placo} from '../brand/Placo';
import {brandFont, isVertical} from '../brand/theme';

// Escena 2: la libreta de papel se pierde y Placo se pone triste
const ProblemInner = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const vertical = isVertical(width, height);

	return (
		<>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vertical ? 80 : 56}}>
				<Interactive.Div
					name="Pregunta"
					style={{
						maxWidth: vertical ? 880 : 1500,
						textAlign: 'center',
						fontFamily: brandFont,
						fontWeight: 700,
						fontSize: vertical ? 96 : 104,
						lineHeight: 1.05,
						letterSpacing: '-0.03em',
						textWrap: 'balance',
						color: '#FFFFFF',
						opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						}),
					}}
				>
					¿Dónde quedó la libreta de vacunas?
				</Interactive.Div>

				<div style={{position: 'relative', width: 560, height: 420, scale: vertical ? 1.35 : 1, marginTop: vertical ? 60 : 0}}>
					{/* La libreta de papel se va volando y se desvanece */}
					<Interactive.Div
						name="Libreta"
						style={{
							position: 'absolute',
							left: 40,
							top: 60,
							width: 240,
							height: 300,
							borderRadius: 18,
							backgroundColor: '#FDE68A',
							boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
							padding: 32,
							translate: interpolate(frame, [0.8 * fps, 2.4 * fps], ['0px 0px', '-420px -260px'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.55, 0, 0.75, 0.2),
							}),
							rotate: interpolate(frame, [0.8 * fps, 2.4 * fps], ['-6deg', '-70deg'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.55, 0, 0.75, 0.2),
							}),
							opacity: interpolate(frame, [1.6 * fps, 2.4 * fps], [1, 0], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}
					>
						<div style={{height: 22, width: 140, borderRadius: 6, backgroundColor: '#B45309'}} />
						<div style={{marginTop: 34, height: 12, width: 170, borderRadius: 6, backgroundColor: '#D97706', opacity: 0.6}} />
						<div style={{marginTop: 18, height: 12, width: 130, borderRadius: 6, backgroundColor: '#D97706', opacity: 0.6}} />
						<div style={{marginTop: 18, height: 12, width: 160, borderRadius: 6, backgroundColor: '#D97706', opacity: 0.6}} />
						<div style={{marginTop: 18, height: 12, width: 110, borderRadius: 6, backgroundColor: '#D97706', opacity: 0.6}} />
					</Interactive.Div>

					<Interactive.Div
						name="Placo triste"
						style={{
							position: 'absolute',
							right: 0,
							bottom: 0,
							translate: interpolate(frame, [0.2 * fps, 0.8 * fps], ['0px 80px', '0px 0px'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.16, 1, 0.3, 1),
							}),
						}}
					>
						<Placo size={300} mood={frame > 1.6 * fps ? 'sad' : 'happy'} />
					</Interactive.Div>
				</div>
			</div>
		</>
	);
};

export const Problem = Interactive.create({
	Component: ProblemInner,
	layout: 'absolute-fill',
	schema: {
		...Interactive.backgroundSchema,
	},
});
