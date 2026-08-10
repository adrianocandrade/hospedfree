import {
  MeuLinkBioAssetIcon,
  type MeuLinkBioAssetIconName,
} from '@app/ui/brand-assets/meulinkbio-asset-icon';

type Feature = {
  title: string;
  description: string;
  icon: MeuLinkBioAssetIconName;
  bg: string;
  image?: string;
  imageClassName?: string;
};

const features: Feature[] = [
  {
    title: 'Links inteligentes',
    description: 'Encurte, personalize e organize seus links em um só painel.',
    icon: 'link',
    bg: 'var(--lp-card-amber)',
    image: '/images/landing/links-inteligentes-meu-link-bio.png',
  },
  {
    title: 'Página Link na Bio',
    description:
      'Traga redes sociais, conteúdos, produtos e canais de contato em uma única página.',
    icon: 'profile-phone',
    bg: 'var(--lp-card-lilac)',
    image: '/images/landing/pagina-meu-link-bio.png',
    imageClassName: '!w-[75%] mx-auto !h-auto !bottom-auto top-0 object-top',
  },
  {
    title: 'QR Codes',
    description: 'Crie QR Codes personalizados e acompanhe cada escaneamento.',
    icon: 'qr-code',
    bg: 'var(--lp-card-mint)',
    image: '/images/landing/qr-code-meu-link-bio.png',
  },
  {
    title: 'Analytics',
    description:
      'Acompanhe cliques, localizações, dispositivos, origens de tráfego e desempenho geral.',
    icon: 'analytics-dashboard',
    bg: 'var(--lp-card-rose)',
    image: '/images/landing/analitics-meu-link-bio.png',
  },
  {
    title: 'Domínio próprio',
    description: 'Use a sua própria marca nos links e páginas públicas.',
    icon: 'domain',
    bg: 'var(--lp-card-sky)',
    image: '/images/landing/dominios-proprios-meu-link-bio.png',
  },
  {
    title: 'Pixels e integrações',
    description:
      'Conecte Pixel da Meta, TikTok, Google Analytics e outras ferramentas de conversão.',
    icon: 'integration-puzzle',
    bg: 'var(--lp-card-amber)',
    image: '/images/landing/pixels-meu-link-bio.png',
  },
];

export function LpFeaturesGrid() {
  return (
    <section
      id="features"
      className="lp relative overflow-hidden bg-[var(--lp-page-bg)] py-16 lg:py-24"
    >
      <div className="lp-container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-badge lp-badge--purple mb-5">Recursos</span>
          <h2 className="lp-heading lp-heading--section">
            Tudo o que você precisa para gerenciar seus links
          </h2>
          <p className="lp-subtext mx-auto mt-4">
            Crie, publique e mensure todos os pontos de contato da sua audiência
            sem precisar alternar entre diversas ferramentas.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="lp-vcard group"
              style={{background: feature.bg}}
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/30">
                <MeuLinkBioAssetIcon
                  name={feature.icon}
                  className="size-10 drop-shadow-md"
                />
              </div>
              <h3
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--lp-font-display)',
                  color: 'var(--lp-on-accent)',
                }}
              >
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-on-accent)]">
                {feature.description}
              </p>

              {/* Mockup preview at bottom */}
              {feature.image && (
                <div className="mt-8 flex-1 relative -mx-8 -mb-0 min-h-[240px]">
                  <img
                    src={feature.image}
                    alt=""
                    className={`absolute inset-x-0 bottom-0 w-full h-full drop-shadow-sm transition-transform duration-500 group-hover:-translate-y-1 ${feature.imageClassName || 'object-contain object-bottom'}`}
                    loading="lazy"
                    aria-hidden
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
