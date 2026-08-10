import {useState} from 'react';
import {useNavigate} from 'react-router';

/** Hand-drawn arrow SVG pointing down-right. */
function HandArrow({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="60"
      height="44"
      viewBox="0 0 60 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 4c12 8 28 14 40 28M44 32c-4-6-6-4-10 0m10 0c0-6 2-8 6-10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LpTemplates() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(
      `/register${username ? `?username=${encodeURIComponent(username)}` : ''}`,
    );
  }

  return (
    <section
      id="templates"
      className="lp relative overflow-hidden py-8 lg:py-12"
      style={{background: 'var(--lp-page-bg)'}}
    >
      <div className="lp-container">
        <div
          className="relative overflow-hidden rounded-[2rem] px-8 py-16 lg:px-16 lg:py-20"
          style={{background: 'var(--lp-section-lime)'}}
        >
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
            {/* Left: Copy */}
            <div>
              <span className="lp-badge lp-badge--outline mb-5">
                Sua loja, direto na bio
              </span>

              {/* Hand-drawn annotation */}
              <div className="mb-4 hidden items-center gap-2 lg:flex">
                <span
                  className="text-sm font-bold text-[var(--lp-on-accent)] italic"
                  style={{fontFamily: "'Sora', sans-serif"}}
                >
                  Analytics
                  <br />
                  Completo
                </span>
                <HandArrow className="text-[var(--lp-on-accent)]" />
              </div>

              <h2
                className="text-3xl leading-tight font-bold tracking-tight lg:text-4xl"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  color: 'var(--lp-on-accent)',
                }}
              >
                Adicione produtos e monte sua loja em segundos
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--lp-on-accent)]">
                Cole o link do produto e a gente preenche tudo automaticamente:
                foto, nome, preço e descrição. Sua bio vira uma loja completa
                sem você precisar digitar nada.
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="flex max-w-md overflow-hidden rounded-[var(--lp-radius-pill)] bg-[var(--lp-on-accent)] shadow-[var(--lp-shadow-md)]">
                  <input
                    type="text"
                    className="min-w-0 flex-1 border-none bg-transparent px-6 py-3.5 text-sm text-white outline-none placeholder:text-white/50"
                    placeholder="meulinkbio.com/Seu nome"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    aria-label="Escolha seu nome de usuário"
                  />
                  <button
                    type="submit"
                    className="lp-btn m-1.5 shrink-0 rounded-[var(--lp-radius-pill)] bg-[var(--lp-section-lime)] px-6 py-3 text-sm font-semibold text-[var(--lp-on-accent)] hover:brightness-95"
                  >
                    Criar minha bio grátis
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Product composition with mockups */}
            <div className="relative flex items-center justify-center">
              {/* Main product card */}
              <div className="relative w-full max-w-md">
                <img
                  src="/images/others/mocks/RIO-Mock-1.png"
                  alt="Loja integrada no MeuLinkBio"
                  className="w-full rounded-2xl drop-shadow-2xl"
                  loading="lazy"
                />

                {/* Floating badges */}
                <div
                  className="lp-float-badge lp-float-drift hidden lg:flex"
                  style={{
                    top: '10%',
                    right: '-20%',
                    background: 'var(--lp-primary)',
                    color: 'var(--lp-on-primary)',
                  }}
                >
                  Novo
                </div>

                <div
                  className="lp-float-badge lp-float-badge--purple lp-float-drift--alt hidden lg:flex"
                  style={{bottom: '30%', left: '-15%'}}
                >
                  Meus cliques
                </div>

                {/* Analytics mini card */}
                <div className="absolute -bottom-4 left-0 hidden rounded-xl bg-white p-3 shadow-lg lg:block">
                  <div className="text-xs font-medium text-[var(--lp-muted)]">
                    Visitas na última semana
                  </div>
                  <div className="mt-1 flex items-end gap-1">
                    {[40, 55, 35, 65, 50, 70, 45].map((h, i) => (
                      <div
                        key={i}
                        className="w-3 rounded-sm"
                        style={{
                          height: `${h * 0.4}px`,
                          background:
                            i === 5
                              ? 'var(--lp-section-lime)'
                              : 'var(--lp-card-amber)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
