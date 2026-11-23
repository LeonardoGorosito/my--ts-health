import type React from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {brandFont, isVertical} from '../brand/theme';

// Una fila de la ficha, que entra deslizándose desde abajo en `start` (segundos)
const Row: React.FC<{
	readonly start: number;
	readonly dot: string;
	readonly title: string;
	readonly detail: string;
	readonly detailColor: string;
	readonly progress?: number;
}> = ({start, dot, title, detail, detailColor, progress}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = interpolate(frame, [start * fps, (start + 0.5) * fps], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	return (
		<div
			style={{
				opacity: t,
				translate: `0px ${(1 - t) * 40}px`,
				backgroundColor: '#F9FAFB',
				border: '2px solid #E5E7EB',
				borderRadius: 26,
				padding: '26px 30px',
				display: 'flex',
				alignItems: 'center',
				gap: 24,
			}}
		>
			<div style={{width: 22, height: 22, borderRadius: 11, backgroundColor: dot, flexShrink: 0}} />
			<div style={{flex: 1}}>
				<div style={{fontFamily: brandFont, fontWeight: 700, fontSize: 38, color: '#111827'}}>{title}</div>
				<div style={{fontFamily: brandFont, fontWeight: 500, fontSize: 30, color: detailColor, marginTop: 4}}>{detail}</div>
				{progress !== undefined ? (
					<div style={{marginTop: 14, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', overflow: 'hidden'}}>
						<div
							style={{
								height: '100%',
								borderRadius: 6,
								backgroundColor: '#059669',
								width: `${interpolate(frame, [(start + 0.3) * fps, (start + 1.3) * fps], [0, progress], {
									extrapolateLeft: 'clamp',
									extrapolateRight: 'clamp',
									easing: Easing.bezier(0.16, 1, 0.3, 1),
								})}%`,
							}}
						/>
					</div>
				) : null}
			</div>
		</div>
	);
};

// Escena 3: la ficha de salud en el celular
const HealthInner = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const vertical = isVertical(width, height);

	return (
		<>
			<div
				style={{
					display: 'flex',
					flexDirection: vertical ? 'column' : 'row-reverse',
					alignItems: 'center',
					gap: vertical ? 72 : 120,
				}}
			>
				<Interactive.Div
					name="Titular salud"
					style={{
						maxWidth: vertical ? 900 : 720,
						textAlign: vertical ? 'center' : 'left',
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
					Su salud, ordenada en tu celular.
				</Interactive.Div>

				{/* Celular */}
				<Interactive.Div
					name="Celular"
					style={{
						width: vertical ? 760 : 640,
						borderRadius: 72,
						backgroundColor: '#0B0F0E',
						padding: 22,
						boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
						translate: interpolate(frame, [0, 0.7 * fps], ['0px 140px', '0px 0px'], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
							easing: Easing.bezier(0.16, 1, 0.3, 1),
						}),
					}}
				>
					<div style={{borderRadius: 54, backgroundColor: '#FFFFFF', overflow: 'hidden'}}>
						<div style={{background: 'linear-gradient(180deg, #10B981, #047857)', padding: '44px 40px 36px'}}>
							<div style={{fontFamily: brandFont, fontWeight: 700, fontSize: 56, color: '#FFFFFF'}}>Mora</div>
							<div style={{fontFamily: brandFont, fontWeight: 500, fontSize: 30, color: '#D1FAE5'}}>Mestiza · 3 años · 5,2 kg</div>
						</div>
						<div style={{padding: 28, display: 'flex', flexDirection: 'column', gap: 18}}>
							<Row start={0.6} dot="#F59E0B" title="Antirrábica" detail="Vence en 12 días" detailColor="#B45309" />
							<Row start={1.0} dot="#3B82F6" title="Desparasitación" detail="Próxima: 16 de febrero" detailColor="#1D4ED8" />
							<Row start={1.4} dot="#10B981" title="Antibiótico" detail="1 comprimido · Día 3 de 7" detailColor="#047857" progress={43} />
						</div>
					</div>
				</Interactive.Div>
			</div>
		</>
	);
};

export const Health = Interactive.create({
	Component: HealthInner,
	layout: 'absolute-fill',
	schema: {
		...Interactive.backgroundSchema,
	},
});
