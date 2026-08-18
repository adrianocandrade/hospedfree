import {LinkButton} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {ComponentProps} from 'react';

export function UpgradeButton(
  props: Partial<ComponentProps<typeof LinkButton>>,
) {
  return (
    <LinkButton
      to="/dashboard/hosting/plans"
      variant="outline"
      color="primary"
      {...props}
    >
      <Trans message="Upgrade" />
    </LinkButton>
  );
}
