import {cn} from '@ui/utils/cn';
import {type ComponentProps} from 'react';

export const meulinkbioAssetIconNames = [
  'link',
  'profile-phone',
  'apps-phone',
  'qr-code',
  'shopping-cart',
  'shopping-bag',
  'package',
  'storefront',
  'discount-tag',
  'discount-ticket',
  'growth-chart',
  'analytics-dashboard',
  'cursor-click',
  'trend-line',
  'target',
  'audience',
  'chat',
  'whatsapp',
  'email',
  'newsletter',
  'calendar',
  'notification',
  'share',
  'megaphone',
  'rocket',
  'trophy',
  'medal',
  'star',
  'shield-check',
  'lock',
  'verified',
  'paint-brush',
  'palette',
  'magic-wand',
  'webpage',
  'content-page',
  'menu',
  'image',
  'video',
  'music',
  'microphone',
  'podcast',
  'location',
  'world',
  'domain',
  'integration-puzzle',
  'plugin',
  'cloud-sync',
  'network',
  'payment-card',
  'coins',
  'gift',
  'crown',
] as const;

export type MeuLinkBioAssetIconName = (typeof meulinkbioAssetIconNames)[number];
export type MeuLinkBioAssetIconVariant = 'auto' | 'v2' | 'v3';

const v2IconNames = new Set<MeuLinkBioAssetIconName>(
  meulinkbioAssetIconNames.filter(name => name !== 'content-page'),
);

const v3IconNames = new Set<MeuLinkBioAssetIconName>([
  'link',
  'profile-phone',
  'apps-phone',
  'qr-code',
  'shopping-cart',
  'shopping-bag',
  'package',
  'storefront',
  'discount-tag',
  'discount-ticket',
  'growth-chart',
  'analytics-dashboard',
  'cursor-click',
  'target',
  'audience',
  'chat',
  'whatsapp',
  'email',
  'newsletter',
  'calendar',
  'notification',
  'share',
  'megaphone',
  'rocket',
  'trophy',
  'medal',
  'star',
  'shield-check',
  'lock',
  'verified',
  'paint-brush',
  'palette',
  'magic-wand',
  'webpage',
  'content-page',
  'image',
  'video',
  'music',
  'microphone',
  'location',
  'world',
  'coins',
  'gift',
  'cloud-sync',
  'crown',
]);

export function resolveMeuLinkBioAssetIcon(
  name: MeuLinkBioAssetIconName,
  variant: MeuLinkBioAssetIconVariant = 'auto',
) {
  const resolvedVariant =
    variant === 'v2'
      ? v2IconNames.has(name)
        ? 'v2'
        : 'v3'
      : variant === 'v3'
        ? v3IconNames.has(name)
          ? 'v3'
          : 'v2'
        : v2IconNames.has(name)
          ? 'v2'
          : 'v3';

  return {
    variant: resolvedVariant,
    src: `/images/icons/meulinkbio/${resolvedVariant}/${name}.webp`,
  } as const;
}

type Props = Omit<ComponentProps<'img'>, 'alt' | 'height' | 'src' | 'width'> & {
  name: MeuLinkBioAssetIconName;
  variant?: MeuLinkBioAssetIconVariant;
  alt?: string;
  decorative?: boolean;
};

/**
 * Product illustration from the MeuLinkBio 3D asset library.
 * Keep Lucide icons for interactive controls; use this component for media,
 * feature highlights and empty states.
 */
export function MeuLinkBioAssetIcon({
  name,
  variant = 'auto',
  alt,
  decorative = alt == null,
  className,
  loading = 'lazy',
  ...props
}: Props) {
  const asset = resolveMeuLinkBioAssetIcon(name, variant);

  return (
    <img
      {...props}
      src={asset.src}
      alt={decorative ? '' : (alt ?? name)}
      aria-hidden={decorative || undefined}
      width={160}
      height={160}
      loading={loading}
      decoding="async"
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
