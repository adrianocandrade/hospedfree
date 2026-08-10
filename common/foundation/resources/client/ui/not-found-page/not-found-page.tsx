import {PublicContentShell} from '@app/landing/public-content-shell';
import {LinkButton} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {ArrowLeftIcon, SearchXIcon} from 'lucide-react';

export function NotFoundPage() {
  return (
    <PublicContentShell mainClassName="flex items-center bg-[var(--lp-surface-soft)]">
      <section className="lp-container flex flex-col items-center py-16 text-center md:py-24">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--lp-blue-soft)] text-[var(--lp-primary)]">
          <SearchXIcon className="size-8" />
        </div>
        <div className="mt-7 text-sm font-[var(--lp-font-display)] font-semibold tracking-[0.12em] text-[var(--lp-primary)]">
          404
        </div>
        <h1 className="mt-3 max-w-[16ch] text-4xl font-[var(--lp-font-display)] font-semibold tracking-[-0.03em] text-balance text-[var(--lp-ink)] md:text-5xl">
          <Trans message="Esta página não foi encontrada" />
        </h1>
        <p className="mt-5 max-w-[58ch] text-base leading-7 text-[var(--lp-muted)]">
          <Trans message="O endereço pode ter mudado ou não estar mais disponível. Volte para a página inicial e continue navegando." />
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton to="/" size="lg">
            <ArrowLeftIcon />
            <Trans message="Voltar ao início" />
          </LinkButton>
          <LinkButton to="/contact" size="lg" variant="outline">
            <Trans message="Entrar em contato" />
          </LinkButton>
        </div>
      </section>
    </PublicContentShell>
  );
}
