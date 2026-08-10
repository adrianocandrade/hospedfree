import {sharedDashboardIcons} from '@app/dashboard/layout/sidenav/dashboard-sidebar-icons';
import {SettingsNavItem} from '@common/admin/settings/settings-nav-config';
import {message} from '@ui/i18n/message';
import {
  ChartColumnBigIcon,
  CircleDollarSignIcon,
  ClipboardClockIcon,
  FilesIcon,
  GlobeIcon,
  NewspaperIcon,
  NotebookTextIcon,
  SettingsIcon,
  SquareStackIcon,
  TagsIcon,
  UserIcon,
  UserRoundKeyIcon,
} from 'lucide-react';
import {ComponentProps, ReactElement} from 'react';

// icons
export const AdminSidebarIcons: Record<
  string,
  ReactElement<ComponentProps<'svg'>>
> = {
  '/admin/insights': <ChartColumnBigIcon />,
  '/admin/settings': <SettingsIcon />,
  '/admin/settings/general': <SettingsIcon />,
  '/admin/subscriptions': <CircleDollarSignIcon />,
  '/admin/plans': <SquareStackIcon />,
  '/admin/users': <UserIcon />,
  '/admin/roles': <UserRoundKeyIcon />,
  '/admin/custom-pages': <NotebookTextIcon />,
  '/admin/blog': <NewspaperIcon />,
  '/admin/tags': <TagsIcon />,
  '/admin/files': <FilesIcon />,
  '/admin/localizations': <GlobeIcon />,
  '/admin/logs': <ClipboardClockIcon />,
};

for (const [key, value] of Object.entries(sharedDashboardIcons)) {
  AdminSidebarIcons[`/admin/${key}`] = value;
}

// settings nav config
export const AppSettingsNavConfig: SettingsNavItem[] = [
  {label: message('Links'), to: 'links', position: 2},
  {label: message('Biolinks'), to: 'biolinks', position: 2},
  {label: message('Biolink themes'), to: 'biolink-themes', position: 2},
  {label: message('Landing page'), to: 'landing-page', position: 2},
  {label: message('Ads'), to: 'ads', position: 20},
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
