import {
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserPenIcon,
} from 'lucide-react';
import {ComponentProps, ReactElement} from 'react';

export const authDropdownIcons: Record<
  string,
  ReactElement<ComponentProps<'svg'>>
> = {
  '/admin/insights': <SettingsIcon />,
  '/admin/hosting': <ShieldCheckIcon />,
  '/account-settings': <UserPenIcon />,
  '/dashboard': <LayoutDashboardIcon />,
  '/dashboard/hosting': <LayoutDashboardIcon />,
};
