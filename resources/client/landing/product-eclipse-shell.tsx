import {useAuth} from '@common/auth/use-auth';
import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {
  ArrowRightIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react';
import {ComponentProps, ReactNode, useState} from 'react';
import {Link, useLocation} from 'react-router';

interface ProductEclipseShellProps extends ComponentProps<'div'> {
  children: ReactNode;
  mainClassName?: string;
}

export function ProductEclipseShell({
  children,
  className,
  mainClassName,
  ...props
}: ProductEclipseShellProps) {
  return (
    <div
      className={cn('hf-landing min-h-screen overflow-x-hidden', className)}
      {...props}
    >
      <a className="hf-skip-link" href="#conteudo-principal">
        <Trans message="Ir para o conteúdo" />
      </a>
      <ProductEclipseHeader />
      <main id="conteudo-principal" className={mainClassName}>
        {children}
      </main>
      <ProductEclipseFooter />
    </div>
  );
}

function ProductEclipseHeader() {
  const {isLoggedIn} = useAuth();
  const {registration} = useSettings();
  const {trans} = useTrans();
  const {pathname} = useLocation();
  const [open, setOpen] = useState(false);
  const onHome = pathname === '/';
  const nav = [
    {href: onHome ? '#recursos' : '/#recursos', label: 'Recursos'},
    {
      href: onHome ? '#como-funciona' : '/#como-funciona',
      label: 'Como funciona',
    },
    {href: '/construtor-de-sites', label: 'Criador de sites'},
    {href: '/planos', label: 'Planos'},
    {href: '/faq', label: 'Ajuda'},
    {href: '/blog', label: 'Blog'},
  ];

  return (
    <header className="hf-header">
      <div className="hf-shell flex h-[72px] items-center justify-between gap-5">
        <Link
          to="/"
          aria-label={trans({message: 'HospedFree, página inicial'})}
        >
          <img
            src="/images/logo-white.png"
            alt="HospedFree"
            width="180"
            height="35"
            className="h-8 w-auto"
          />
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm text-white/62 lg:flex"
          aria-label={trans({message: 'Navegação principal'})}
        >
          {nav.map(item =>
            item.href.startsWith('#') ? (
              <a key={item.href} href={item.href} className="hf-nav-link">
                <Trans message={item.label} />
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'hf-nav-link',
                  pathname.startsWith(item.href) && 'hf-nav-link-active',
                )}
                aria-current={
                  pathname.startsWith(item.href) ? 'page' : undefined
                }
              >
                <Trans message={item.label} />
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn ? (
            <Button
              nativeButton={false}
              render={<Link to="/dashboard/hosting" />}
              variant="outline"
              className="hf-button-secondary"
            >
              <LayoutDashboardIcon />
              <Trans message="Abrir painel" />
            </Button>
          ) : (
            <>
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                variant="ghost"
                className="hf-button-ghost"
              >
                <Trans message="Entrar" />
              </Button>
              {!registration?.disable && (
                <Button
                  nativeButton={false}
                  render={<Link to="/register" />}
                  className="hf-button-primary"
                >
                  <Trans message="Criar conta grátis" />
                  <ArrowRightIcon />
                </Button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="hf-menu-button lg:hidden"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
          aria-label={trans({message: open ? 'Fechar menu' : 'Abrir menu'})}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div className="hf-mobile-menu lg:hidden">
          <nav
            className="hf-shell flex flex-col py-4"
            aria-label={trans({message: 'Navegação móvel'})}
          >
            {nav.map(item =>
              item.href.startsWith('#') ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="hf-mobile-link"
                  onClick={() => setOpen(false)}
                >
                  <Trans message={item.label} />
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'hf-mobile-link',
                    pathname.startsWith(item.href) && 'hf-mobile-link-active',
                  )}
                  aria-current={
                    pathname.startsWith(item.href) ? 'page' : undefined
                  }
                  onClick={() => setOpen(false)}
                >
                  <Trans message={item.label} />
                </Link>
              ),
            )}
            {!isLoggedIn && (
              <Link
                to="/login"
                className="hf-mobile-link"
                onClick={() => setOpen(false)}
              >
                <Trans message="Entrar" />
              </Link>
            )}
            {isLoggedIn ? (
              <Link
                to="/dashboard/hosting"
                className="hf-mobile-primary"
                onClick={() => setOpen(false)}
              >
                <Trans message="Abrir painel" />
                <ArrowRightIcon />
              </Link>
            ) : (
              !registration?.disable && (
                <Link
                  to="/register"
                  className="hf-mobile-primary"
                  onClick={() => setOpen(false)}
                >
                  <Trans message="Criar conta grátis" />
                  <ArrowRightIcon />
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ProductEclipseFooter() {
  const year = new Date().getFullYear();
  const columns = [
    {
      title: 'Produto',
      links: [
        ['/#recursos', 'Recursos'],
        ['/construtor-de-sites', 'Criador de sites'],
        ['/planos', 'Planos'],
        ['/#como-funciona', 'Como funciona'],
      ],
    },
    {
      title: 'Publicar',
      links: [
        ['/register', 'Criar conta'],
        ['/faq', 'Central de ajuda'],
        ['/dashboard/support', 'Abrir chamado'],
      ],
    },
    {
      title: 'Institucional',
      links: [
        ['/contact', 'Contato'],
        ['/pages/terms-of-service', 'Termos de uso'],
        ['/pages/privacy-policy', 'Privacidade'],
        ['/pages/cookies', 'Política de cookies'],
        ['/blog', 'Blog'],
      ],
    },
  ];

  return (
    <footer className="hf-footer">
      <div className="hf-shell grid gap-10 md:grid-cols-[1.25fr_2fr]">
        <div>
          <img
            src="/images/logo-white.png"
            alt="HospedFree"
            width="180"
            height="35"
            className="h-8 w-auto"
          />
          <p className="mt-5 max-w-[34ch] text-sm leading-6 text-white/42">
            <Trans message="Hospedagem gratuita para publicar com clareza e evoluir no mesmo painel." />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map(column => (
            <div key={column.title}>
              <h3>
                <Trans message={column.title} />
              </h3>
              <ul>
                {column.links.map(([href, label]) => (
                  <li key={label}>
                    <Link to={href}>
                      <Trans message={label} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="hf-shell hf-footer-bottom">
        <span>
          © {year} HospedFree. <Trans message="Todos os direitos reservados." />
        </span>
        <Link to="/faq">
          <BookOpenIcon />
          <Trans message="Documentação e ajuda" />
        </Link>
      </div>
    </footer>
  );
}
