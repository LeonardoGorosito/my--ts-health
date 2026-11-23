import {Composition, Folder} from 'remotion';
import {Trailer} from './Trailer';

// Dos formatos del mismo trailer: 9:16 para Reels/TikTok/historias y 16:9 para YouTube y la web
export const RemotionRoot = () => {
	return (
		<Folder name="Trailer">
			<Composition id="Trailer-Vertical" component={Trailer} durationInFrames={477} fps={30} width={1080} height={1920} />
			<Composition id="Trailer-Horizontal" component={Trailer} durationInFrames={477} fps={30} width={1920} height={1080} />
		</Folder>
	);
};
