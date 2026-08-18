import {SettingsNavItem} from '@common/admin/settings/settings-nav-config';
import {message} from '@ui/i18n/message';
import {
  CircleDollarSignIcon,
  CreditCardIcon,
  SettingsIcon,
  SquareStackIcon,
  UserIcon,
  ServerCogIcon,
  LifeBuoyIcon,
  BookOpenIcon,
  NewspaperIcon,
  SparklesIcon,
} from 'lucide-react';
import {ComponentProps, ReactElement} from 'react';

// icons
export const AdminSidebarIcons: Record<
  string,
  ReactElement<ComponentProps<'svg'>>
> = {
  '/admin/settings': <SettingsIcon />,
  '/admin/settings/general': <SettingsIcon />,
  '/admin/settings/subscriptions': <CreditCardIcon />,
  '/admin/subscriptions': <CircleDollarSignIcon />,
  '/admin/users': <UserIcon />,
  '/admin/hosting': <ServerCogIcon />,
  '/admin/hosting/plans': <SquareStackIcon />,
  '/admin/hosting/premium-subdomains': <SparklesIcon />,
  '/admin/settings/hosting': <ServerCogIcon />,
  '/admin/support': <LifeBuoyIcon />,
  '/admin/knowledge': <BookOpenIcon />,
  '/admin/blog': <NewspaperIcon />,
};

// settings nav config
export const AppSettingsNavConfig: SettingsNavItem[] = [
  {label: message('Hosting'), to: 'hosting', position: 2},
];

// docs urls
const base = '/documentation.html';
export const AdminDocsUrls = {
  manualUpdate: `${base}#operations`,
  settings: {
    uploading: `${base}#uploads`,
    s3: `${base}#uploads`,
    backblaze: `${base}#uploads`,
    authentication: `${base}#authentication`,
  } as any,
  pages: {
    roles: `${base}#roles`,
    translations: `${base}#localization`,
  } as any,
};
