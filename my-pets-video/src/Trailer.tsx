import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {useVideoConfig} from 'remotion';
import {Health} from './scenes/Health';
import {Intro} from './scenes/Intro';
import {Lost} from './scenes/Lost';
import {Outro} from './scenes/Outro';
import {Problem} from './scenes/Problem';
import {Soundtrack} from './Soundtrack';

// Trailer de PetHealth. El mismo componente sirve para 9:16 y 16:9:
// cada escena acomoda su layout según la orientación.
// Duración: 2,5 + 3 + 4 + 4 + 4 s menos 4 transiciones de 0,4 s ≈ 15,9 s
export const Trailer = () => {
	const {fps} = useVideoConfig();
	return (
		<>
		<Soundtrack />
		<TransitionSeries name="Escenas">
			<TransitionSeries.Sequence name="Intro" durationInFrames={2.5 * fps}>
				<Intro
					style={{
						background: 'radial-gradient(circle at 50% 40%, #0F5F4C 0%, #052E2B 70%)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 0.4 * fps})} />
			<TransitionSeries.Sequence name="Problema" durationInFrames={3 * fps}>
				<Problem
					style={{
						background: 'radial-gradient(circle at 50% 60%, #134E4A 0%, #042521 75%)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={linearTiming({durationInFrames: 0.4 * fps})} />
			<TransitionSeries.Sequence name="Salud" durationInFrames={4 * fps}>
				<Health
					style={{
						background: 'radial-gradient(circle at 50% 30%, #0F5F4C 0%, #052E2B 70%)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 0.4 * fps})} />
			<TransitionSeries.Sequence name="Perdida" durationInFrames={4 * fps}>
				<Lost
					style={{
						background: 'radial-gradient(circle at 50% 60%, #5B1414 0%, #1F0A0A 75%)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 0.4 * fps})} />
			<TransitionSeries.Sequence name="Cierre" durationInFrames={4 * fps}>
				<Outro
					style={{
						background: 'radial-gradient(circle at 50% 35%, #0F6B55 0%, #064E3B 40%, #031F1C 100%)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</TransitionSeries.Sequence>
		</TransitionSeries>
		</>
	);
};
