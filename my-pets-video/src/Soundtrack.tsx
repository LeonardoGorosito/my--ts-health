import {Audio} from '@remotion/media';
import {interpolate, staticFile, Track, useVideoConfig} from 'remotion';

// Audio del trailer. Los tiempos siguen a las escenas de Trailer.tsx
// (cada transición de 0,4 s superpone las escenas):
// Intro 0–2,5 s · Problema 2,1–5,1 s · Salud 4,7–8,7 s · Perdida 8,3–12,3 s · Cierre 11,9–15,9 s
export const Soundtrack = () => {
	const {fps, durationInFrames} = useVideoConfig();
	return (
		<>
			<Track name="Voz">
				<Audio name="Voz: hola" src={staticFile('audio/vo-1-hola.mp3')} from={0.35 * fps} />
				<Audio name="Voz: libreta" src={staticFile('audio/vo-2-libreta.mp3')} from={2.3 * fps} />
				<Audio name="Voz: salud" src={staticFile('audio/vo-3-salud.mp3')} from={5 * fps} />
				<Audio name="Voz: perdida" src={staticFile('audio/vo-4-perdida.mp3')} from={8.6 * fps} />
				<Audio name="Voz: cierre" src={staticFile('audio/vo-5-cierre.mp3')} from={12.4 * fps} />
			</Track>
			<Track name="Efectos">
				<Audio name="Libreta volando" src={staticFile('audio/sfx-page-turn.wav')} from={2.9 * fps} volume={0.7} />
				<Audio name="Transición a salud" src={staticFile('audio/sfx-whoosh.wav')} from={4.6 * fps} volume={0.5} />
				<Audio name="Aviso de perdida" src={staticFile('audio/sfx-snapchat-notification.wav')} from={9.2 * fps} volume={0.6} />
				<Audio name="Llamado a la acción" src={staticFile('audio/sfx-ding.wav')} from={13.2 * fps} volume={0.5} />
			</Track>
			<Audio
				name="Música"
				src={staticFile('audio/music-1.mp3')}
				durationInFrames={durationInFrames}
				volume={(f) =>
					interpolate(f, [0, 0.5 * fps, durationInFrames - 1 * fps, durationInFrames], [0, 0.28, 0.28, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})
				}
			/>
		</>
	);
};
