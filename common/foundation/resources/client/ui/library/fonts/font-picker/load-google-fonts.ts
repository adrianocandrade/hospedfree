import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {FontConfig} from '@ui/fonts/font-picker/font-config';

export function loadGoogleFonts(fonts: FontConfig[], id: string) {
  const googleFonts = fonts.filter(f => f.google);
  if (googleFonts?.length) {
    const families = googleFonts
      .map(f => `${encodeURIComponent(f.family).replaceAll('%20', '+')}:400`)
      .join('|');
    lazyLoader.loadAsset(
      `https://fonts.googleapis.com/css?family=${families}&display=swap`,
      {type: 'css', id},
    );
  }
}
