import {MenuItemConfig} from '@common/menus/menu-config';
import {useCustomMenu} from '@common/menus/use-custom-menu';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';
import {Link, useLocation} from 'react-router';

type FooterLink = {
  label: ReactNode;
  href: string;
};

const footerColumns: Array<{
  id: string;
  title: ReactNode;
  links: FooterLink[];
}> = [
  {
    id: 'product',
    title: <Trans message="Hospedagem" />,
    links: [
      {label: <Trans message="Como funciona" />, href: '#como-funciona'},
      {label: <Trans message="Recursos" />, href: '#recursos'},
      {label: <Trans message="Criador de Sites" />, href: '#criador-de-sites'},
      {label: <Trans message="Planos e preços" />, href: '#planos'},
      {label: <Trans message="Dúvidas frequentes" />, href: '#faq'},
    ],
  },
  {
    id: 'start',
    title: <Trans message="Comece agora" />,
    links: [
      {label: <Trans message="Criar conta grátis" />, href: '/register'},
      {label: <Trans message="Entrar no painel" />, href: '/login'},
      {label: <Trans message="Minha hospedagem" />, href: '/dashboard/hosting'},
    ],
  },
  {
    id: 'information',
    title: <Trans message="Ajuda & Suporte" />,
    links: [
      {
        label: <Trans message="Base de conhecimento" />,
        href: '/faq',
      },
      {
        label: <Trans message="Suporte técnico" />,
        href: '/dashboard/support',
      },
      {
        label: <Trans message="Termos de Uso" />,
        href: '/pages/terms-of-service',
      },
      {
        label: <Trans message="Política de Privacidade" />,
        href: '/pages/privacy-policy',
      },
      {label: <Trans message="Política de Cookies" />, href: '/pages/cookies'},
    ],
  },
];

export function LpFooter() {
  const currentYear = new Date().getFullYear();
  const {pathname} = useLocation();
  const socialMenu = useCustomMenu('footer-secondary');
  const socialItems =
    socialMenu?.items.filter(
      item =>
        typeof item.icon === 'string' &&
        ['facebook', 'twitter', 'instagram', 'youtube'].includes(item.icon),
    ) ?? [];

  return (
    <footer
      className="lp pt-8 pb-8 lg:pt-12 lg:pb-10"
      style={{
        background: 'var(--lp-footer-bg)',
        color: 'var(--lp-footer-text)',
      }}
    >
      <div className="lp-container">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 pb-14 md:grid-cols-3 lg:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))] lg:gap-x-14 lg:pb-16">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
              <Logo logoType="wide" color="auto" className="h-9" />
            </div>
            <p className="mt-5 max-w-[34ch] text-sm leading-6 text-[var(--lp-footer-muted)]">
              <Trans message="Hospedagem gratuita e profissional, com clareza, segurança e estabilidade para o seu projeto." />
            </p>
            {socialItems.length ? (
              <nav aria-labelledby="footer-social" className="mt-7">
                <h2 id="footer-social" className="sr-only">
                  <Trans message="Redes sociais" />
                </h2>
                <div className="flex items-center gap-2">
                  {socialItems.map(item => (
                    <SocialMenuItem key={item.id} item={item} />
                  ))}
                </div>
              </nav>
            ) : null}
          </div>

          {footerColumns.map(column => (
            <nav
              key={column.id}
              aria-labelledby={`footer-${column.id}`}
              className="last:col-span-2 md:last:col-span-1"
            >
              <h2
                id={`footer-${column.id}`}
                className="text-sm font-semibold text-[var(--lp-footer-text)]"
              >
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map(link => {
                  const href =
                    link.href.startsWith('#') && pathname !== '/'
                      ? `/${link.href}`
                      : link.href;

                  return (
                    <li key={link.href}>
                      <a
                        href={href}
                        className="inline-flex min-h-11 min-w-11 items-center rounded-sm text-sm leading-6 text-[var(--lp-footer-muted)] transition-colors hover:text-[var(--lp-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lp-primary)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--lp-footer-border)] pt-7 text-sm text-[var(--lp-footer-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            <Trans
              message="© :year HospedFree. Todos os direitos reservados."
              values={{year: currentYear}}
            />
          </p>
          <Link
            to="/faq"
            className="inline-flex min-h-11 w-fit items-center rounded-sm transition-colors hover:text-[var(--lp-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lp-primary)]"
          >
            <Trans message="Central de Ajuda e Base de Conhecimento" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SocialMenuItem({item}: {item: MenuItemConfig}) {
  const iconName = typeof item.icon === 'string' ? item.icon : '';
  const className =
    'inline-flex size-11 items-center justify-center rounded-full bg-[var(--lp-footer-card)] text-[var(--lp-footer-text)] transition-colors hover:bg-[var(--lp-primary-action)] hover:text-[var(--lp-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lp-primary)] [&_svg]:size-4';
  const content = (
    <>
      <SocialIcon icon={iconName} />
      <span className="sr-only">
        <SocialLabel icon={iconName} />
      </span>
    </>
  );

  if (item.type === 'route') {
    return (
      <Link to={item.action} target={item.target} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={item.action}
      target={item.target}
      rel={item.target === '_blank' ? 'noreferrer' : undefined}
      className={className}
    >
      {content}
    </a>
  );
}

function SocialIcon({icon}: {icon: string}) {
  switch (icon) {
    case 'facebook':
      return <SiFacebook />;
    case 'twitter':
      return <SiX />;
    case 'instagram':
      return <SiInstagram />;
    case 'youtube':
      return <SiYoutube />;
    default:
      return null;
  }
}

function SocialLabel({icon}: {icon: string}) {
  switch (icon) {
    case 'facebook':
      return <Trans message="Facebook" />;
    case 'twitter':
      return <Trans message="X / Twitter" />;
    case 'instagram':
      return <Trans message="Instagram" />;
    case 'youtube':
      return <Trans message="YouTube" />;
    default:
      return <Trans message="Rede social" />;
  }
}
