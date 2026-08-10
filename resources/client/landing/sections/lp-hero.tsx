import {CheckCircle2Icon} from 'lucide-react';
import {useState} from 'react';
import {useNavigate} from 'react-router';

const trustPoints = [
  'Sem cartão de crédito',
  'Crie em minutos',
  'Cancele quando quiser',
];

export function LpHero() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(
      `/register${username ? `?username=${encodeURIComponent(username)}` : ''}`,
    );
  }

  return (
    <section className="lp relative isolate overflow-hidden bg-[var(--lp-page-bg)]">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle 900px at 50% 60%, color-mix(in srgb, var(--lp-primary-action) 18%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="lp-container py-16 lg:py-24">
        <div className="mb-8 flex justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
          <div className="flex items-center gap-3 rounded-[var(--lp-radius-pill)] border border-[var(--lp-border)] bg-[var(--lp-surface)] px-5 py-2.5">
            <div className="flex -space-x-2" aria-hidden="true">
              <div className="size-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 ring-2 ring-white" />
              <div className="size-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 ring-2 ring-white" />
              <div className="size-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 ring-2 ring-white" />
            </div>
            <span className="text-sm font-medium text-[var(--lp-ink)]">
              +1 Milhão de Bios Criadas
            </span>
          </div>
        </div>

        <div className="lp-hero-copy relative mx-auto max-w-6xl text-center">
          <div className="lp-float-badge lp-float-badge--lime lp-float-drift lp-hero-impact lp-hero-impact--clicks hidden xl:flex">
            <span>+ cliques</span>
          </div>
          <div className="lp-float-badge lp-float-badge--purple lp-float-drift--alt lp-hero-impact lp-hero-impact--sales hidden xl:flex">
            <span>+ vendas</span>
          </div>

          <h1 className="lp-heading lp-heading--hero motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4">
            Link na bio gratuito para Instagram, TikTok, WhatsApp e muito mais
          </h1>

          <p className="lp-subtext mx-auto mt-5 motion-safe:animate-in motion-safe:delay-100 motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4">
            Crie sua bio no MeuLinkBio gratuitamente e compartilhe os seus links
            em um só lugar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-xl motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4"
        >
          <div className="lp-hero-input-wrap">
            <input
              type="text"
              className="lp-hero-input"
              placeholder="meulinkbio.com/Seu nome"
              value={username}
              onChange={e => setUsername(e.target.value)}
              aria-label="Escolha seu nome de usuário"
            />
            <button type="submit" className="lp-hero-input-btn">
              Criar conta
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-[var(--lp-muted)] motion-safe:animate-in motion-safe:delay-300 motion-safe:duration-500 motion-safe:fade-in-0">
          {trustPoints.map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2Icon
                className="size-4 text-[var(--lp-primary)]"
                aria-hidden="true"
              />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="lp-hero-showcase" aria-hidden="true">
          <div className="lp-hero-showcase__stage">
            <div className="lp-hero-showcase__item lp-hero-showcase__analytics">
              <img
                src="/images/landing/analitics-meu-link-bio.png"
                alt=""
                width="1536"
                height="1024"
                loading="lazy"
                decoding="async"
              />
            </div>
            <img
              src="/images/landing/pagina-burger-meu-link-bio-transparent.png"
              alt=""
              width="1134"
              height="1387"
              className="lp-hero-showcase__item lp-hero-showcase__burger"
              loading="lazy"
              decoding="async"
            />
            <img
              src="/images/landing/pagina-meu-link-bio.png"
              alt=""
              width="1024"
              height="1152"
              className="lp-hero-showcase__item lp-hero-showcase__main"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <img
              src="/images/landing/pagina-game-meu-link-bio.png"
              alt=""
              width="816"
              height="944"
              className="lp-hero-showcase__item lp-hero-showcase__game"
              loading="lazy"
              decoding="async"
            />
            <img
              src="/images/landing/pagina-nekoverse-meu-link-bio.png"
              alt=""
              width="750"
              height="938"
              className="lp-hero-showcase__item lp-hero-showcase__nekoverse"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
