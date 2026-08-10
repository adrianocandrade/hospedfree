import {Logo} from '@common/ui/navigation/navbar/logo';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {
  ArrowUpRightIcon,
  BarChart3Icon,
  LinkIcon,
  QrCodeIcon,
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
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)]">
        <section className="relative flex min-w-0 flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-9 xl:px-20">
          <header className="flex items-center justify-between gap-4">
            <Logo url="/" logoType="wide" className="h-8 max-w-[168px]" />
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:flex"
            >
              <Trans message="Voltar ao site" />
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
            <div className="w-full max-w-md">
              {heading ? <div className="mb-8">{heading}</div> : null}
              {children}
              {message ? (
                <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-2.5">
      <h1 className="text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
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
    <aside className="relative hidden min-h-svh overflow-hidden bg-[var(--hf-ink)] p-10 text-[var(--hf-background)] lg:flex lg:flex-col xl:p-16">
      <div
        className="absolute -top-24 -right-20 size-72 rounded-full bg-[var(--hf-primary)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-24 right-28 size-24 rounded-2xl bg-[var(--hf-secondary)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-48 -right-8 h-28 w-48 rounded-2xl bg-[var(--hf-soft)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mt-auto max-w-xl">
        <h2 className="max-w-[12ch] text-4xl font-semibold tracking-[-0.03em] text-balance xl:text-5xl">
          <Trans message="Tudo o que você compartilha, em um só lugar." />
        </h2>
        <p className="mt-5 max-w-[52ch] text-base leading-7 text-[var(--hf-muted)]">
          <Trans
            message="Organize sua presença digital, publique com sua identidade e acompanhe os resultados no :siteName."
            values={{siteName: branding.site_name}}
          />
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl bg-white/[0.07] ring-1 ring-white/12">
          <BrandPanelRow
            icon={<LinkIcon />}
            title={<Trans message="Links e páginas" />}
            description={
              <Trans message="Conteúdo organizado para cada objetivo" />
            }
          />
          <BrandPanelRow
            icon={<QrCodeIcon />}
            title={<Trans message="QR Codes" />}
            description={
              <Trans message="Compartilhamento simples em qualquer canal" />
            }
          />
          <BrandPanelRow
            icon={<BarChart3Icon />}
            title={<Trans message="Resultados" />}
            description={
              <Trans message="Dados claros para orientar suas decisões" />
            }
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
    <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hf-soft)] text-[var(--hf-ink)] [&_svg]:size-5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-white">{title}</div>
        <div className="mt-0.5 text-sm text-[var(--hf-muted)]">
          {description}
        </div>
      </div>
    </div>
  );
}
