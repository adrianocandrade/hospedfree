import {Logo} from '@common/ui/navigation/navbar/logo';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {
  ArrowUpRightIcon,
  FolderOpenIcon,
  Globe2Icon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {Link} from 'react-router';
import {AuthLayoutFooter} from './auth-layout-footer';

interface AuthPageProps {
  heading?: ReactNode;
  message?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({heading, children, message}: AuthPageProps) {
  return (
    <main className="min-h-svh overflow-x-clip bg-background text-foreground">
      <div className="grid min-h-svh xl:grid-cols-[minmax(440px,0.88fr)_minmax(560px,1.12fr)]">
        <section className="relative flex min-w-0 flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-9 xl:px-16 2xl:px-20">
          <header className="flex items-center justify-between gap-4">
            <Logo
              url="/"
              logoType="wide"
              className="h-10 max-w-[196px] sm:h-11"
            />
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:flex"
            >
              <Trans message="Voltar ao site" />
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center py-12 sm:py-16 lg:py-14">
            <div className="w-full max-w-[29rem]">
              {heading ? <div className="mb-9">{heading}</div> : null}
              {children}
              {message ? (
                <div className="mt-9 border-t pt-6 text-sm leading-6 text-muted-foreground">
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          <AuthLayoutFooter />
        </section>

        <AuthBrandPanel />
      </div>
    </main>
  );
}

export function AuthHeading({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[2.125rem] sm:leading-[1.15]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-[48ch] text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function AuthBrandPanel() {
  const {branding} = useSettings();

  return (
    <aside className="relative hidden min-h-svh overflow-hidden bg-[var(--hf-ink)] text-white xl:flex xl:flex-col">
      <img
        src="/images/hospedfree/black-network-switch-with-optical-fiber-cables-auth.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-[68%_center]"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,22,0.18)_0%,rgba(6,7,22,0.38)_42%,rgba(6,7,22,0.96)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,22,0.35)_0%,transparent_48%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mt-auto max-w-2xl p-10 xl:p-14 2xl:p-16">
        <h2 className="max-w-[17ch] text-4xl font-semibold tracking-[-0.03em] text-balance text-white xl:text-[3.25rem] xl:leading-[1.02]">
          <Trans message="Seu painel pronto para publicar." />
        </h2>
        <p className="mt-5 max-w-[54ch] text-base leading-7 text-white/76">
          <Trans
            message="Hospedagem, arquivos, domínios e suporte reunidos em uma área protegida da :siteName."
            values={{siteName: branding.site_name}}
          />
        </p>

        <div className="mt-9 grid overflow-hidden rounded-2xl border border-white/12 bg-[#090a19]/82 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-md xl:grid-cols-3">
          <BrandPanelRow
            icon={<FolderOpenIcon />}
            title={<Trans message="Arquivos no navegador" />}
            description={<Trans message="Publique e organize seu site" />}
          />
          <BrandPanelRow
            icon={<Globe2Icon />}
            title={<Trans message="Domínios no painel" />}
            description={<Trans message="Acompanhe endereço e DNS" />}
          />
          <BrandPanelRow
            icon={<ShieldCheckIcon />}
            title={<Trans message="Acesso protegido" />}
            description={<Trans message="Credenciais ocultas por padrão" />}
          />
        </div>
      </div>
    </aside>
  );
}

function BrandPanelRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[var(--hf-primary)] [&_svg]:size-[18px]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm leading-5 font-semibold text-white">
          {title}
        </div>
        <div className="mt-1 text-xs leading-5 text-white/58">
          {description}
        </div>
      </div>
    </div>
  );
}
