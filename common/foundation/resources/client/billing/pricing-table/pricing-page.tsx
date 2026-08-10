import {PublicContentShell} from '@app/landing/public-content-shell';
import {listProductsForPricingPageOptions} from '@common/admin/subscriptions/products-queries';
import {PricingTable} from '@common/billing/pricing-table/pricing-table';
import {
  LandingPageFaq,
  LandingPageFaqConfig,
} from '@common/ui/landing-page/faq/landing-page-faq';
import {LinkButton} from '@shadcn/button/button';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from 'lucide-react';
import {useState} from 'react';
import {StaticPageTitle} from '../../seo/static-page-title';
import {BillingCycleRadio} from './billing-cycle-radio';
import {UpsellBillingCycle} from './find-best-price';

export function Component() {
  const query = useSuspenseQuery(listProductsForPricingPageOptions());
  const [selectedCycle, setSelectedCycle] =
    useState<UpsellBillingCycle>('yearly');
  const products = query.data?.data ?? [];
  const hasPublishedProducts = products.some(product => !product.hidden);

  return (
    <PublicContentShell mainClassName="bg-[var(--lp-surface-soft)]">
      <StaticPageTitle>
        <Trans message="Preços" />
      </StaticPageTitle>

      <main className="lp-container py-12 md:py-16 lg:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-[var(--lp-font-display)] font-semibold tracking-[-0.03em] text-balance text-[var(--lp-ink)] md:text-5xl">
            <Trans message="Escolha o plano certo para o seu momento" />
          </h1>
          <p className="mx-auto mt-5 max-w-[62ch] text-base leading-7 text-[var(--lp-muted)] md:text-lg">
            <Trans message="Compare os recursos disponíveis e avance quando precisar de mais possibilidades para sua presença digital." />
          </p>
        </header>

        {hasPublishedProducts ? (
          <>
            <BillingCycleRadio
              products={products}
              selectedCycle={selectedCycle}
              onChange={setSelectedCycle}
              className="mt-10 flex justify-center md:mt-12"
            />
            <PricingTable
              selectedCycle={selectedCycle}
              products={products}
              className="mt-10 md:mt-12"
            />
            <ContactSection />
          </>
        ) : (
          <NoPublishedPlans />
        )}
      </main>
    </PublicContentShell>
  );
}

function NoPublishedPlans() {
  return (
    <section className="mx-auto mt-12 max-w-2xl rounded-2xl bg-[var(--lp-surface)] px-6 py-10 text-center ring-1 ring-[var(--lp-border)] md:px-10 md:py-12">
      <MessagesSquareIcon className="mx-auto size-9 text-[var(--lp-primary)]" />
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[var(--lp-ink)]">
        <Trans message="Novos planos serão publicados em breve" />
      </h2>
      <p className="mx-auto mt-3 max-w-[54ch] text-sm leading-6 text-[var(--lp-muted)]">
        <Trans message="Enquanto isso, fale com a nossa equipe para entender as opções disponíveis para sua necessidade." />
      </p>
      <LinkButton className="mt-6" to="/contact" size="lg">
        <Trans message="Falar com a equipe" />
      </LinkButton>
    </section>
  );
}

function ContactSection() {
  const query = useSuspenseQuery(listProductsForPricingPageOptions());

  if (query.data?.faq) {
    return (
      <div className="mt-16 md:mt-24">
        <LandingPageFaq
          config={query.data.faq as unknown as LandingPageFaqConfig}
        />
      </div>
    );
  }

  return (
    <section className="mt-16 flex flex-col items-center border-t border-[var(--lp-border)] pt-12 text-center md:mt-24 md:pt-16">
      <MessagesSquareIcon className="size-8 text-[var(--lp-primary)]" />
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--lp-ink)]">
        <Trans message="Ainda tem alguma dúvida?" />
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--lp-muted)] md:text-base">
        <Trans message="Nossa equipe pode ajudar você a entender qual opção faz mais sentido." />
      </p>
      <LinkButton className="mt-6" to="/contact" size="lg">
        <Trans message="Entrar em contato" />
      </LinkButton>
    </section>
  );
}
