import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';

// Fuente de la marca (la misma que usa la app)
export const {fontFamily: brandFont} = loadFont('normal', {
	weights: ['500', '700'],
	subsets: ['latin', 'latin-ext'],
});

// true en 9:16 (redes), false en 16:9
export const isVertical = (width: number, height: number) => height > width;
