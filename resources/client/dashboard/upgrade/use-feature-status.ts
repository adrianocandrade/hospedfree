import {useUsage} from '@app/dashboard/use-usage';
import {GetUsage200DataBiolinks} from '@app/gen/schemas/get-usage200-data-biolinks';
import {GetUsage200DataLinks} from '@app/gen/schemas/get-usage200-data-links';
import {GetUsage200DataQrCodes} from '@app/gen/schemas/get-usage200-data-qr-codes';

export function useLinkFeatureStatus(
  feature: keyof Pick<
    GetUsage200DataLinks,
    'back_half' | 'password' | 'expiration' | 'utm' | 'retargeting'
  >,
): {disabled: boolean} {
  const {data} = useUsage();
  return {disabled: data ? !data.data.links[feature] : false};
}

export function useQrCodeFeatureStatus(
  feature: keyof Pick<GetUsage200DataQrCodes, 'style'>,
) {
  const {data} = useUsage();
  return {disabled: data ? !data.data.qr_codes[feature] : false};
}

export type BiolinkPlanFeature =
  | 'advanced_appearance'
  | 'desktop_layout'
  | 'model_gallery'
  | 'premium_models'
  | 'background_video'
  | 'profile_audio'
  | 'custom_cursor'
  | 'visual_effects'
  | 'badges'
  | 'custom_badges'
  | 'discord_presence'
  | 'hide_branding'
  | 'custom_css';

export function useBiolinkFeatureStatus(feature: BiolinkPlanFeature): {
  disabled: boolean;
} {
  const {data} = useUsage();
  const biolinks = data?.data.biolinks as
    | (GetUsage200DataBiolinks & Record<BiolinkPlanFeature, boolean>)
    | undefined;

  return {disabled: biolinks ? !biolinks[feature] : false};
}
