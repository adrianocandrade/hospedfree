import {SocialsType} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';

export type SocialConfig = {
  enabled?: boolean;
  mobilePlacement?: 'header' | 'footer' | 'hidden';
  desktopPlacement?: 'badge' | 'footer' | 'hidden';
  style?: 'icons' | 'buttons' | 'pills';
  colorMode?: 'theme' | 'brand' | 'monochrome';
  links?: Partial<Record<SocialsType, string>>;
};
