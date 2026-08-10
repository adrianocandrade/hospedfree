import {useAuth} from '@common/auth/use-auth';
import {ColorSchemeContext} from '@common/core/color-scheme-provider';
import {MenuItemConfig} from '@common/menus/menu-config';
import {UnstyledCustomMenuItem} from '@common/menus/custom-menu';
import {useCustomMenu} from '@common/menus/use-custom-menu';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {Button} from '@shadcn/button/button';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Tooltip} from '@shadcn/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {ArrowRightIcon, MenuIcon, MoonIcon, SunIcon} from 'lucide-react';
import {use, useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router';

const landingNavFallback = {
  id: 'meulinkbio-landing-navbar',
  name: 'Landing page navbar',
  positions: ['landing-page-navbar'] as string[],
  items: [
    {
      id: 'nav-features',
      type: 'link' as const,
      order: 1,
      label: 'Recursos',
      action: '#features',
    },
    {
      id: 'nav-templates',
      type: 'link' as const,
      order: 2,
      label: 'Templates',
      action: '#templates',
    },
    {
      id: 'nav-pricing',
      type: 'link' as const,
      order: 3,
      label: 'Preços',
      action: '#pricing-section',
    },
    {
      id: 'nav-business',
      type: 'link' as const,
      order: 4,
      label: 'Para Empresas',
      action: '#enterprise',
    },
    {
      id: 'nav-blog',
      type: 'route' as const,
      order: 5,
      label: 'Blog',
      action: '/blog',
    },
  ],
};

export function LpHeader() {
  const menu = useCustomMenu('landing-page-navbar') ?? landingNavFallback;
  const {pathname} = useLocation();
  const {isLoggedIn} = useAuth();
  const {colorScheme, setColorScheme} = use(ColorSchemeContext);
  const {trans} = useTrans();
  const {registration} = useSettings();
  const canRegister = !registration?.disable;
  const [scrolled, setScrolled] = useState(false);
  const isLightMode = colorScheme === 'light';
  const nextScheme = isLightMode ? 'dark' : 'light';
  const themeLabel = isLightMode
    ? trans({message: 'Dark mode'})
    : trans({message: 'Light mode'});
  const menuItems = menu.items.map(item => {
    if (
      pathname !== '/' &&
      item.type === 'link' &&
      item.action.startsWith('#')
    ) {
      return {...item, action: `/${item.action}`};
    }
    return item;
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, {passive: true});
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={cn(
        'lp sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-[var(--lp-border)] bg-[var(--lp-surface)]/95 py-3 shadow-[var(--lp-shadow-sm)] backdrop-blur-md'
          : 'bg-[var(--lp-surface)] py-5',
      )}
    >
      <div className="lp-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Logo
          logoType="wide"
          className="h-8 max-w-[168px] justify-self-start"
        />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 justify-self-center lg:flex xl:gap-7">
          {menuItems.map(item => (
            <UnstyledCustomMenuItem
              key={item.id}
              item={item}
              className={({isActive}) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-[var(--lp-primary)]',
                  isActive
                    ? 'text-[var(--lp-primary)]'
                    : 'text-[var(--lp-ink)]',
                )
              }
            />
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 justify-self-end lg:flex">
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  variant="outline"
                  color="default"
                  size="icon"
                  className="border-[var(--lp-border)] bg-[var(--lp-surface-soft)] text-[var(--lp-ink)] hover:bg-[var(--lp-purple-soft)]"
                  aria-label={themeLabel}
                  onClick={() => setColorScheme(nextScheme)}
                >
                  {isLightMode ? <MoonIcon /> : <SunIcon />}
                </Button>
              }
            />
            <Tooltip.Content>
              {isLightMode ? (
                <Trans message="Dark mode" />
              ) : (
                <Trans message="Light mode" />
              )}
            </Tooltip.Content>
          </Tooltip.Root>
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="lp-btn lp-btn--primary px-5 py-2.5 text-sm"
            >
              <span>
                <Trans message="Dashboard" />
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          ) : canRegister ? (
            <Link
              to="/login"
              className="lp-btn lp-btn--primary px-5 py-2.5 text-sm"
            >
              <span>
                <Trans message="Entrar ou criar conta" />
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="lp-btn lp-btn--primary px-5 py-2.5 text-sm"
            >
              <span>
                <Trans message="Entrar" />
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 justify-self-end lg:hidden">
          <Button
            variant="outline"
            color="default"
            size="icon"
            className="border-[var(--lp-border)] bg-[var(--lp-surface-soft)] text-[var(--lp-ink)] hover:bg-[var(--lp-purple-soft)]"
            aria-label={themeLabel}
            onClick={() => setColorScheme(nextScheme)}
          >
            {isLightMode ? <MoonIcon /> : <SunIcon />}
          </Button>
          <Dropdown.Root>
            <Dropdown.Trigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--lp-ink)] hover:bg-[var(--lp-ink)]/10"
                  aria-label={trans({message: 'Menu'})}
                />
              }
            >
              <MenuIcon />
            </Dropdown.Trigger>
            <Dropdown.Content align="end" className="w-64">
              {menuItems.map(item => (
                <MobileMenuItem key={item.id} item={item} />
              ))}
              <Dropdown.Separator />
              {isLoggedIn ? (
                <Dropdown.LinkItem render={<Link to="/dashboard" />}>
                  <Trans message="Dashboard" />
                </Dropdown.LinkItem>
              ) : canRegister ? (
                <Dropdown.LinkItem render={<Link to="/login" />}>
                  <Trans message="Entrar ou criar conta" />
                </Dropdown.LinkItem>
              ) : (
                <Dropdown.LinkItem render={<Link to="/login" />}>
                  <Trans message="Entrar" />
                </Dropdown.LinkItem>
              )}
            </Dropdown.Content>
          </Dropdown.Root>
        </div>
      </div>
    </header>
  );
}

function MobileMenuItem({item}: {item: MenuItemConfig}) {
  if (item.type === 'link') {
    return (
      <Dropdown.LinkItem render={<a href={item.action} target={item.target} />}>
        {item.label}
      </Dropdown.LinkItem>
    );
  }

  return (
    <Dropdown.LinkItem render={<Link to={item.action} target={item.target} />}>
      {item.label}
    </Dropdown.LinkItem>
  );
}
