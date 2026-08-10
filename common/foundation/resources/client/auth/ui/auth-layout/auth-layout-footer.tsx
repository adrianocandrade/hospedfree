import {UnstyledCustomMenuItem} from '@common/menus/custom-menu';
import {useCustomMenu} from '@common/menus/use-custom-menu';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Link} from 'react-router';

export function AuthLayoutFooter() {
  const {branding} = useSettings();
  const menu = useCustomMenu('auth-page-footer');
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-5 text-xs text-muted-foreground sm:text-sm">
      <Link className="transition-colors hover:text-foreground" to="/">
        <Trans
          message="© :year :siteName"
          values={{year, siteName: branding.site_name}}
        />
      </Link>
      {menu?.items.length ? (
        <nav className="flex flex-wrap items-center gap-5">
          {menu.items.map(item => (
            <UnstyledCustomMenuItem
              key={item.id}
              item={item}
              className="transition-colors hover:text-foreground"
            />
          ))}
        </nav>
      ) : null}
    </footer>
  );
}
