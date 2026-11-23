import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placo} from '../brand/Placo';
import {brandFont, isVertical} from '../brand/theme';

// Escena 4: alguien escanea la placa y aparece el aviso de mascota perdida
const LostInner = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const vertical = isVertical(width, height);

	return (
		<>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: vertical ? 72 : 48}}>
				<Interactive.Div
					name="Titular perdida"
					style={{
						maxWidth: vertical ? 900 : 1500,
						textAlign: 'center',
						fontFamily: brandFont,
						fontWeight: 700,
						fontSize: vertical ? 92 : 96,
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
					Si se pierde, un escaneo la trae de vuelta.
				</Interactive.Div>

				<div style={{display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? 40 : 96}}>
					{/* Placo con el anillo de escaneo */}
					<div style={{position: 'relative', width: 360, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Interactive.Div
							name="Onda de escaneo"
							style={{
								position: 'absolute',
								width: 360,
								height: 360,
								borderRadius: 180,
								border: '6px solid #FCA5A5',
								scale: interpolate(frame, [0.4 * fps, 1.4 * fps], [0.6, 1.5], {
									extrapolateLeft: 'clamp',
									extrapolateRight: 'clamp',
									output: 'perceptual-scale',
									easing: Easing.bezier(0.16, 1, 0.3, 1),
								}),
								opacity: interpolate(frame, [0.4 * fps, 1.4 * fps], [0.9, 0], {
									extrapolateLeft: 'clamp',
									extrapolateRight: 'clamp',
								}),
							}}
						/>
						<Placo size={vertical ? 340 : 320} />
					</div>

					{/* Aviso que ve quien la encuentra */}
					<Interactive.Div
						name="Aviso perdida"
						style={{
							width: vertical ? 760 : 620,
							borderRadius: 40,
							backgroundColor: '#DC2626',
							padding: '40px 40px 36px',
							textAlign: 'center',
							boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
							translate: interpolate(frame, [0.9 * fps, 1.5 * fps], ['0px 90px', '0px 0px'], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: Easing.bezier(0.16, 1, 0.3, 1),
							}),
							opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							}),
						}}
					>
						<div style={{fontFamily: brandFont, fontWeight: 700, fontSize: 60, color: '#FFFFFF', letterSpacing: '0.02em'}}>¡ESTOY PERDIDA!</div>
						<div style={{fontFamily: brandFont, fontWeight: 500, fontSize: 32, color: '#FEE2E2', marginTop: 10, textWrap: 'balance'}}>Si me encontraste, avisale a mi familia.</div>
						<div style={{display: 'flex', gap: 20, marginTop: 32}}>
							<div style={{flex: 1, borderRadius: 20, backgroundColor: '#FFFFFF', color: '#DC2626', fontFamily: brandFont, fontWeight: 700, fontSize: 34, padding: '20px 0'}}>Llamar</div>
							<div style={{flex: 1, borderRadius: 20, backgroundColor: '#25D366', color: '#FFFFFF', fontFamily: brandFont, fontWeight: 700, fontSize: 34, padding: '20px 0'}}>WhatsApp</div>
						</div>
					</Interactive.Div>
				</div>
			</div>
		</>
	);
};

export const Lost = Interactive.create({
	Component: LostInner,
	layout: 'absolute-fill',
	schema: {
		...Interactive.backgroundSchema,
	},
});
