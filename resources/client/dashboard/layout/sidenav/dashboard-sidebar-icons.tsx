import {
  BookOpenIcon,
  CircleDollarSignIcon,
  ServerIcon,
  UserIcon,
  LifeBuoyIcon,
  LayoutDashboardIcon,
} from 'lucide-react';
import {ComponentProps, ReactElement} from 'react';

export const sharedDashboardIcons: Record<
  string,
  ReactElement<ComponentProps<'svg'>>
> = {};

export const dashboardSidebarIcons: Record<
  string,
  ReactElement<ComponentProps<'svg'>>
> = {
  '/dashboard': <LayoutDashboardIcon />,
  '/dashboard/hosting': <ServerIcon />,
  '/dashboard/hosting/plans': <CircleDollarSignIcon />,
  '/dashboard/support': <LifeBuoyIcon />,
  '/faq': <BookOpenIcon />,
  '/account-settings': <UserIcon />,
};
