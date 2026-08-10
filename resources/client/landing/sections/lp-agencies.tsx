import {UsersIcon, ZapIcon} from 'lucide-react';

const mocks = [
  '/images/others/mocks/Flat-iPhone-2232.png',
  '/images/others/mocks/Flat-iPhone-2432.png',
  '/images/others/mocks/Flat-iPhone-2534.png',
  '/images/others/mocks/Flat-iPhone-2888.png',
  '/images/others/mocks/Flat-iPhone-3888.png',
  '/images/others/mocks/RIO-Mock-1.png',
  '/images/others/mocks/RIO-Mock-2.png',
  '/images/others/mocks/RIO-Mock-3.png',
];

/** Decorative hand-drawn arrow SVG (curvy, right-pointing). */
function CurvedArrow({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="70"
      height="36"
      viewBox="0 0 70 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 20c16-18 36-14 50 0M54 20c-4-6-2-6 2-8m-2 8c4-2 6-2 8 2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LpAgencies() {
  return (
    <section
      id="enterprise"
      className="lp relative overflow-hidden py-8 lg:py-12"
      style={{background: 'var(--lp-page-bg)'}}
    >
      {/* Lilac rounded container */}
      <div className="lp-container">
        <div
          className="relative overflow-hidden rounded-[2rem] px-8 py-16 lg:px-16 lg:py-20"
          style={{background: 'var(--lp-section-lilac)'}}
        >
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Left: Copy */}
            <div>
              <span className="lp-badge lp-badge--outline mb-5">
                Seu Dashboard
              </span>

              {/* Hand-drawn annotation */}
              <div className="mb-4 hidden items-center gap-2 lg:flex">
                <span
                  className="text-sm font-bold text-[var(--lp-on-accent)] italic"
                  style={{fontFamily: "'Sora', sans-serif"}}
                >
                  Simples e<br />
                  Completo
                </span>
                <CurvedArrow className="text-[var(--lp-on-accent)]" />
              </div>

              <h2
                className="text-3xl leading-tight font-bold tracking-tight lg:text-4xl"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  color: 'var(--lp-on-accent)',
                }}
              >
                Gerencie tudo de um só lugar
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--lp-on-accent)]">
                Organize suas bios, gerencie links, personalize a aparência e
                ajuste as configurações.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--lp-on-accent)]">
                Acesse seu painel de analytics para acompanhar o desempenho e
                receba dicas valiosas para otimizar suas bios.
              </p>

              {/* Mini feature cards */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-yellow)]">
                    <UsersIcon className="size-5 text-[var(--lp-on-accent)]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--lp-on-accent)]">
                      Forme seu time
                    </div>
                    <p className="mt-1 text-xs text-[var(--lp-on-accent)]">
                      Convide pessoas para participar do seu time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-lime)]">
                    <ZapIcon className="size-5 text-[var(--lp-on-accent)]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--lp-on-accent)]">
                      Convide seus clientes
                    </div>
                    <p className="mt-1 text-xs text-[var(--lp-on-accent)]">
                      Seus clientes também poderão acessar seus próprios dados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats callout */}
              <div className="mt-8 rounded-2xl bg-white/20 px-6 py-5">
                <div>
                  <span
                    className="text-xl font-extrabold text-[var(--lp-on-accent)]"
                    style={{fontFamily: 'var(--lp-font-display)'}}
                  >
                    Painel unificado
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--lp-on-accent)]">
                  Centralize páginas, acessos e ajustes da equipe em uma
                  experiência mais previsível.
                </p>
              </div>
            </div>

            {/* Right: Dashboard screenshot */}
            <div className="relative hidden lg:block">
              <img
                src="/images/others/meulinkbio-hero-product-1.png"
                alt="Dashboard do MeuLinkBio com analytics e gerenciamento de bios"
                className="w-full rounded-2xl object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Carousel of phone mockups */}
          <div className="relative mt-16 w-full overflow-hidden">
            {/* Fading edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[var(--lp-section-lilac)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[var(--lp-section-lilac)] to-transparent" />

            <div className="animate-scroll-mocks flex w-max items-center gap-8 px-4">
              {[...mocks, ...mocks].map((mock, i) => (
                <img
                  key={i}
                  src={mock}
                  alt="Mockup do MeuLinkBio"
                  className="h-56 object-contain drop-shadow-xl transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
