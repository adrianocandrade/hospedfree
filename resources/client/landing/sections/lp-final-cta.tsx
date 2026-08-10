import {Trans} from '@ui/i18n/trans';
import {ArrowRightIcon, Link2Icon} from 'lucide-react';
import {Link} from 'react-router';

export function LpFinalCta() {
  return (
    <section
      className="lp relative isolate overflow-hidden px-[var(--lp-gutter)] pt-24 pb-20 lg:pt-32 lg:pb-28"
      style={{background: 'var(--lp-footer-bg)'}}
    >
      <Link2Icon
        className="pointer-events-none absolute top-10 left-[5%] size-24 -rotate-12 text-[var(--lp-primary-action)] opacity-15 md:size-32"
        strokeWidth={1.15}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[5%] bottom-4 hidden h-28 w-56 rounded-b-full bg-[var(--lp-violet)] opacity-15 md:block"
        aria-hidden
      />
      <svg
        viewBox="0 0 100 44"
        className="pointer-events-none absolute top-[44%] right-[19%] hidden w-24 text-[var(--lp-lime)] opacity-25 lg:block"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 10C28 36 72 36 92 10"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      <div className="lp-container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="mx-auto max-w-[19ch] text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-[var(--lp-footer-text)] md:text-5xl lg:text-[3.5rem]"
            style={{fontFamily: 'var(--lp-font-display)'}}
          >
            <Trans message="Sua presença digital começa com o MeuLinkBio" />
          </h2>
          <p className="mx-auto mt-6 max-w-[58ch] text-base leading-7 text-[var(--lp-footer-muted)] md:text-lg">
            <Trans message="Centralize seus links, páginas e QR Codes em um só lugar e compartilhe tudo com uma página feita para a sua marca." />
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="lp-btn lp-btn--primary min-w-52 px-7 py-3.5 text-sm"
            >
              <Trans message="Criar conta grátis" />
              <ArrowRightIcon className="size-4" />
            </Link>
            <a
              href="#features"
              className="lp-btn min-w-52 border border-[var(--lp-primary)]/55 bg-[var(--lp-footer-card)] px-7 py-3.5 text-sm text-[var(--lp-footer-text)] hover:border-[var(--lp-primary)] hover:bg-[var(--lp-footer-card-hover)]"
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--lp-primary) 55%, transparent)',
              }}
            >
              <Trans message="Ver recursos" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
