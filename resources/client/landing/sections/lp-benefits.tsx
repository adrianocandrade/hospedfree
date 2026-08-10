import {SiWhatsapp} from '@icons-pack/react-simple-icons';
import {LinkIcon, UsersIcon} from 'lucide-react';

type Benefit = {
  title: string;
  description: string;
  bg: string;
  iconBg: string;
  icon: React.ReactNode;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
};

const benefits: Benefit[] = [
  {
    title: 'Da sua bio para o WhatsApp',
    description:
      'Seu MeuLinkBio ou QR code em qualquer lugar, incluindo cartões de visita, assinatura de e-mail, cartazes.',
    bg: 'var(--lp-card-amber)',
    iconBg: 'var(--lp-section-gold-warm)',
    icon: <SiWhatsapp className="size-6 text-[var(--lp-on-accent)]" />,
    image: '/images/landing/qr-code-meu-link-bio-dash.png',
    imageAlt: 'Tela de criação e personalização de QR Code no MeuLinkBio',
    imageWidth: 1024,
    imageHeight: 842,
  },
  {
    title: 'Adicione links com liberdade',
    description:
      'Organize destinos importantes, escreva chamadas claras e personalize a apresentação da sua página.',
    bg: 'var(--lp-card-sky)',
    iconBg: 'var(--lp-primary-action)',
    icon: <LinkIcon className="size-6 text-[var(--lp-on-accent)]" />,
    image: '/images/landing/links-com-liberdade-meu-link-bio.png',
    imageAlt: 'Catálogo de widgets e links do editor do MeuLinkBio',
    imageWidth: 1024,
    imageHeight: 842,
  },
  {
    title: 'Trabalhe em equipe',
    description:
      'Quando disponível no seu plano, convide pessoas e mantenha a gestão da página no mesmo espaço.',
    bg: 'var(--lp-card-lilac)',
    iconBg: 'var(--lp-violet)',
    icon: <UsersIcon className="size-6 text-[var(--lp-on-violet)]" />,
    image: '/images/landing/trabalhe-em-equipe-meu-link-bio.png',
    imageAlt: 'Configuração de equipe e espaços no MeuLinkBio',
    imageWidth: 1024,
    imageHeight: 842,
  },
];

export function LpBenefits() {
  return (
    <section className="lp bg-[var(--lp-page-bg)] py-16 lg:py-24">
      <div className="lp-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-badge lp-badge--gold mb-5">Seu novo site</span>
          <h2 className="lp-heading lp-heading--section">
            Com o MeuLinkBio, sua presença digital fica pronta para crescer
          </h2>
          <p className="lp-subtext mx-auto mt-4">
            Reúna links, redes e contatos em uma página fácil de atualizar e
            preparada para acompanhar seus próximos passos.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map(benefit => (
            <div
              key={benefit.title}
              className="lp-vcard min-h-[34rem] sm:min-h-[36rem] lg:min-h-[38rem]"
              style={{background: benefit.bg}}
            >
              {/* Icon */}
              <div
                className="mb-5 flex size-14 items-center justify-center rounded-2xl"
                style={{background: benefit.iconBg}}
              >
                {benefit.icon}
              </div>

              {/* Text */}
              <h3
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  color: 'var(--lp-on-accent)',
                }}
              >
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-on-accent)]">
                {benefit.description}
              </p>

              <div className="mt-6 flex min-h-0 flex-1 items-end justify-center pb-6">
                <img
                  src={benefit.image}
                  alt={benefit.imageAlt}
                  width={benefit.imageWidth}
                  height={benefit.imageHeight}
                  className="h-auto w-full max-w-lg object-contain drop-shadow-[0_24px_30px_rgb(35_31_32/0.2)] select-none"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 768px) 34vw, 100vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
