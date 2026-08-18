/*
  THESIS: The visual builder is a protected continuation of an active hosting account, not a disconnected external tool.
  COMPOSITION: Product promise, verified capabilities, three-step access flow, security contract, then one contextual CTA.
  TRUTH: Capabilities follow the approved Site.pro reference and video. Account availability is explicit; credentials and launch URLs remain private.
*/
import {ProductEclipseShell} from '@app/landing/product-eclipse-shell';
import {useAuth} from '@common/auth/use-auth';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  ExternalLinkIcon,
  Globe2Icon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MonitorSmartphoneIcon,
  MousePointer2Icon,
  PanelsTopLeftIcon,
  PlayIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router';
import './site-builder-page.css';

interface BuilderFact {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BuilderFeature {
  title: string;
  description: string;
}

const builderFacts: BuilderFact[] = [
  {
    icon: Globe2Icon,
    title: 'Domínio ativo',
    description: 'Escolha onde o projeto será editado.',
  },
  {
    icon: PanelsTopLeftIcon,
    title: 'Editor visual',
    description: 'Crie no navegador sem começar pelo código.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Sessão protegida',
    description: 'O acesso é preparado somente ao abrir.',
  },
  {
    icon: LayoutDashboardIcon,
    title: 'Mesmo painel',
    description: 'Volte à hospedagem sempre que precisar.',
  },
];

const controlRows: BuilderFact[] = [
  {
    icon: Globe2Icon,
    title: 'Você escolhe o domínio',
    description:
      'Somente domínios ativos da sua própria hospedagem aparecem para seleção.',
  },
  {
    icon: KeyRoundIcon,
    title: 'O servidor prepara o acesso',
    description:
      'Credenciais e tokens permanecem protegidos e não são colocados na página.',
  },
  {
    icon: ExternalLinkIcon,
    title: 'O editor abre em uma nova guia',
    description:
      'Seu painel continua aberto para você consultar a conta ou trocar de tarefa.',
  },
];

const builderHighlights: BuilderFact[] = [
  {
    icon: LayoutTemplateIcon,
    title: 'Sites bonitos desde o primeiro passo',
    description:
      'Escolha entre mais de 200 modelos responsivos e adapte cada detalhe ao seu projeto.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Recursos para ir além',
    description:
      'Crie desde uma landing page simples até um site completo ou uma loja virtual.',
  },
  {
    icon: Code2Icon,
    title: 'Sem código para começar',
    description:
      'Desenhe, organize e publique sem precisar lidar diretamente com arquivos ou bancos de dados.',
  },
];

const builderFeatures: BuilderFeature[] = [
  {
    title: 'Criação sem código',
    description: 'Editor visual no navegador',
  },
  {
    title: 'Ferramentas de SEO',
    description: 'Recursos para otimizar páginas',
  },
  {
    title: 'Loja virtual',
    description: 'Estrutura para vender online',
  },
  {
    title: '200+ modelos',
    description: 'Layouts prontos para personalizar',
  },
  {
    title: 'Design responsivo',
    description: 'Experiência adaptada a cada tela',
  },
  {
    title: 'Sites multilíngues',
    description: 'Conteúdo em mais de um idioma',
  },
  {
    title: 'Importação de site',
    description: 'Continue a partir de um projeto existente',
  },
  {
    title: 'Liberdade visual',
    description: 'Monte o design que combina com a sua ideia',
  },
];

export function Component() {
  const {isLoggedIn} = useAuth();
  const {registration} = useSettings();
  const {trans} = useTrans();
  const [videoActive, setVideoActive] = useState(false);
  const registrationDisabled = registration?.disable;
  const primaryHref = isLoggedIn
    ? '/dashboard/hosting'
    : registrationDisabled
      ? '/login'
      : '/register';
  const primaryLabel = isLoggedIn
    ? 'Abrir minhas hospedagens'
    : registrationDisabled
      ? 'Entrar no painel'
      : 'Criar conta grátis';

  return (
    <ProductEclipseShell className="hf-builder-page">
      <StaticPageTitle>
        <Trans message="Construtor de sites" />
      </StaticPageTitle>

      <section className="hf-builder-hero" aria-labelledby="builder-title">
        <div aria-hidden="true" className="hf-builder-hero-orbit" />
        <div className="hf-shell hf-builder-hero-grid">
          <div className="hf-builder-hero-copy">
            <span className="hf-builder-kicker">
              <SparklesIcon aria-hidden="true" />
              <Trans message="Construtor de sites HospedFree" />
            </span>
            <h1 id="builder-title" className="hf-display">
              <span>
                <Trans message="Crie visualmente." />
              </span>
              <span>
                <Trans message="Publique seu site." />
              </span>
            </h1>
            <p>
              <Trans message="Escolha um domínio ativo, abra o editor pelo painel e desenvolva seu site no navegador. A sessão é criada apenas quando você decide entrar." />
            </p>
            <div className="hf-builder-actions">
              <Button
                nativeButton={false}
                render={<Link to={primaryHref} />}
                className="hf-button-primary hf-button-large"
              >
                <Trans message={primaryLabel} />
                <ArrowRightIcon aria-hidden="true" />
              </Button>
              <Button
                nativeButton={false}
                render={<a href="#demonstracao" />}
                variant="outline"
                className="hf-button-secondary hf-button-large"
              >
                <PlayIcon aria-hidden="true" />
                <Trans message="Assistir demonstração" />
              </Button>
            </div>
            <ul className="hf-builder-assurances">
              <li>
                <CheckIcon aria-hidden="true" />
                <Trans message="Acesso pelo painel" />
              </li>
              <li>
                <CheckIcon aria-hidden="true" />
                <Trans message="Domínio ativo selecionado" />
              </li>
              <li>
                <CheckIcon aria-hidden="true" />
                <Trans message="Credenciais no servidor" />
              </li>
            </ul>
          </div>

          <div className="hf-builder-hero-visual">
            <div aria-hidden="true" className="hf-builder-visual-glow" />
            <img
              src="/images/hospedfree/construtor-hospedfree.png"
              alt={trans({
                message:
                  'Pessoa usando o construtor visual de sites em um notebook',
              })}
              width="1917"
              height="923"
            />
            <div className="hf-builder-visual-status">
              <span aria-hidden="true" />
              <div>
                <small>
                  <Trans message="Abertura autorizada" />
                </small>
                <strong>
                  <Trans message="Editor pronto para continuar" />
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="hf-builder-facts"
        aria-label={trans({message: 'Recursos do construtor'})}
      >
        <div className="hf-shell hf-builder-facts-grid">
          {builderFacts.map(({icon: Icon, title, description}) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <div>
                <h2>
                  <Trans message={title} />
                </h2>
                <p>
                  <Trans message={description} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="demonstracao"
        className="hf-builder-showcase"
        aria-labelledby="builder-showcase-title"
      >
        <div className="hf-shell">
          <div className="hf-builder-showcase-intro">
            <div>
              <h2 id="builder-showcase-title" className="hf-display">
                <Trans message="Veja o editor em ação." />
              </h2>
              <p>
                <Trans message="Conheça o fluxo visual do construtor e descubra como transformar um modelo em um site pronto para o seu domínio." />
              </p>
            </div>
            <div className="hf-builder-version-note">
              <ShieldCheckIcon aria-hidden="true" />
              <p>
                <strong>
                  <Trans message="Versão adequada à sua conta" />
                </strong>
                <span>
                  <Trans message="Modelos e recursos avançados variam conforme a versão habilitada. Opções de upgrade, quando disponíveis, aparecem dentro do próprio editor." />
                </span>
              </p>
            </div>
          </div>

          <div className="hf-builder-showcase-grid">
            <figure className="hf-builder-video-stage">
              <div className="hf-builder-video-frame">
                {videoActive ? (
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/jzbqVK8s6jI?autoplay=1"
                    title={trans({
                      message: 'Demonstração em vídeo do construtor de sites',
                    })}
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    className="hf-builder-video-poster"
                    onClick={() => setVideoActive(true)}
                    aria-label={trans({
                      message: 'Reproduzir demonstração do construtor de sites',
                    })}
                  >
                    <img
                      src="/images/sitepro/Marketing-materialsmackbook.png"
                      alt=""
                      width="1920"
                      height="1080"
                      loading="lazy"
                      decoding="async"
                    />
                    <span>
                      <PlayIcon aria-hidden="true" />
                    </span>
                    <strong>
                      <Trans message="Assistir demonstração" />
                    </strong>
                  </button>
                )}
              </div>
              <figcaption>
                <span>
                  <PlayIcon aria-hidden="true" />
                  <Trans message="Demonstração oficial do editor Site.pro" />
                </span>
                <a
                  href="https://www.youtube.com/watch?v=jzbqVK8s6jI"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={trans({
                    message:
                      'Abrir demonstração do construtor no YouTube em uma nova guia',
                  })}
                >
                  <Trans message="Abrir no YouTube" />
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
              </figcaption>
            </figure>

            <div className="hf-builder-highlight-list">
              {builderHighlights.map(({icon: Icon, title, description}) => (
                <article key={title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>
                      <Trans message={title} />
                    </h3>
                    <p>
                      <Trans message={description} />
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hf-builder-feature-ledger">
            <div>
              <h3 className="hf-display">
                <Trans message="Tudo para criar do seu jeito." />
              </h3>
              <p>
                <Trans message="Comece com uma página simples e evolua o projeto no mesmo ambiente visual." />
              </p>
              <figure className="hf-builder-template-preview">
                <img
                  src="/images/sitepro/Tablet-mockup.png"
                  alt={trans({
                    message:
                      'Modelos de sites sendo personalizados no editor visual em tablets',
                  })}
                  width="1920"
                  height="1080"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <LayoutTemplateIcon aria-hidden="true" />
                  <span>
                    <strong>
                      <Trans message="Um ponto de partida para cada projeto" />
                    </strong>
                    <small>
                      <Trans message="Escolha um modelo e adapte conteúdo, cores e estrutura." />
                    </small>
                  </span>
                </figcaption>
              </figure>
            </div>
            <ul>
              {builderFeatures.map(({title, description}) => (
                <li key={title}>
                  <CheckIcon aria-hidden="true" />
                  <span>
                    <strong>
                      <Trans message={title} />
                    </strong>
                    <small>
                      <Trans message={description} />
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="hf-builder-journey"
        aria-labelledby="builder-journey-title"
      >
        <div className="hf-shell hf-builder-journey-grid">
          <div className="hf-builder-journey-media">
            <img
              src="/images/sitepro/isometric-scehmemobile-mockup-2.png"
              alt={trans({
                message:
                  'Exemplos de sites responsivos exibidos em diferentes celulares',
              })}
              width="2000"
              height="1500"
              loading="lazy"
              decoding="async"
            />
            <div className="hf-builder-media-caption">
              <MonitorSmartphoneIcon aria-hidden="true" />
              <div>
                <strong>
                  <Trans message="Seu site em qualquer tela" />
                </strong>
                <span>
                  <Trans message="Layouts responsivos para celulares, tablets e computadores." />
                </span>
              </div>
            </div>
          </div>

          <div className="hf-builder-journey-copy">
            <span className="hf-builder-kicker">
              <MousePointer2Icon aria-hidden="true" />
              <Trans message="Do painel ao editor" />
            </span>
            <h2 id="builder-journey-title" className="hf-display">
              <Trans message="Comece em três passos." />
            </h2>
            <p>
              <Trans message="O construtor aparece como parte da sua hospedagem. Você confirma o contexto antes de seguir para o editor." />
            </p>

            <ol className="hf-builder-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>
                    <Trans message="Ative sua hospedagem" />
                  </h3>
                  <p>
                    <Trans message="A conta precisa estar pronta para que as ferramentas sejam liberadas." />
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>
                    <Trans message="Escolha o domínio" />
                  </h3>
                  <p>
                    <Trans message="Selecione um dos domínios ativos vinculados à sua conta." />
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>
                    <Trans message="Abra o editor" />
                  </h3>
                  <p>
                    <Trans message="O painel cria uma sessão protegida e abre o construtor em uma nova guia." />
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section
        className="hf-builder-control"
        aria-labelledby="builder-control-title"
      >
        <div className="hf-shell hf-builder-control-grid">
          <div className="hf-builder-control-copy">
            <span className="hf-builder-kicker">
              <ShieldCheckIcon aria-hidden="true" />
              <Trans message="Acesso sob controle" />
            </span>
            <h2 id="builder-control-title" className="hf-display">
              <Trans message="Seu acesso fica protegido." />
            </h2>
            <p>
              <Trans message="O caminho até o editor passa pela conta autenticada e pelo domínio selecionado. Informações técnicas sensíveis permanecem no servidor." />
            </p>
            <div className="hf-builder-availability-note">
              <ShieldCheckIcon aria-hidden="true" />
              <p>
                <strong>
                  <Trans message="Disponibilidade transparente" />
                </strong>
                <span>
                  <Trans message="Se o construtor não estiver habilitado para a conta, o painel informa o estado sem enviar você para um endereço incompleto." />
                </span>
              </p>
            </div>
          </div>

          <div className="hf-builder-control-board">
            <div className="hf-builder-control-board-heading">
              <span>
                <Trans message="Fluxo autorizado" />
              </span>
              <small>
                <span aria-hidden="true" />
                <Trans message="Protegido" />
              </small>
            </div>
            {controlRows.map(({icon: Icon, title, description}, index) => (
              <article key={title}>
                <span className="hf-builder-control-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon aria-hidden="true" />
                <div>
                  <h3>
                    <Trans message={title} />
                  </h3>
                  <p>
                    <Trans message={description} />
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-builder-final">
        <div className="hf-shell">
          <div className="hf-builder-final-panel">
            <div>
              <span className="hf-builder-kicker">
                <SparklesIcon aria-hidden="true" />
                <Trans message="Seu próximo site" />
              </span>
              <h2 className="hf-display">
                <Trans message="Crie grátis. Edite visualmente." />
              </h2>
              <p>
                <Trans message="Crie sua conta ou abra uma hospedagem existente para escolher o domínio e acessar o construtor." />
              </p>
            </div>
            <div className="hf-builder-final-actions">
              <Button
                nativeButton={false}
                render={<Link to={primaryHref} />}
                className="hf-button-light hf-button-large"
              >
                <Trans message={primaryLabel} />
                <ArrowRightIcon aria-hidden="true" />
              </Button>
              <Link to="/faq" className="hf-builder-help-link">
                <Trans message="Consultar a central de ajuda" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ProductEclipseShell>
  );
}
