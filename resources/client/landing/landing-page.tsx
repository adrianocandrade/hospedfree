/*
  THESIS: HospedFree shortens the path from a project idea to a published website.
  STORY: Promise -> one control center -> files and domains -> visual builder -> application installer -> real plans -> practical help.
  TRUTH: No fake metrics, testimonials, domain form, provider branding, invented price or simulated availability.
*/
import {
  hostingPlansOptions,
  knowledgeArticlesOptions,
} from '@app/hosting/hosting-queries';
import {
  formatHostingPlanLimit,
  getDefaultHostingBillingCycle,
  getFreeHostingPlan,
  getHostingPlanDetails,
  getHostingPlanPrice,
  getPreferredPaidHostingPlan,
  orderHostingPlans,
} from '@app/hosting/hosting-plan-presentation';
import {HostingPlan, KnowledgeArticle} from '@app/hosting/hosting-types';
import {FormattedPrice} from '@common/billing/formatted-price';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@shadcn/button/button';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {
  SiJoomla,
  SiPhpbb,
  SiPrestashop,
  SiWordpress,
} from '@icons-pack/react-simple-icons';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FileCode2Icon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  Globe2Icon,
  HardDriveIcon,
  LayoutDashboardIcon,
  LockKeyholeIcon,
  PackageOpenIcon,
  PanelTopIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
} from 'lucide-react';
import {ReactNode, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import './landing-home.css';
import {ProductEclipseShell} from './product-eclipse-shell';

const capabilities = [
  {icon: LayoutDashboardIcon, label: 'Painel de hospedagem'},
  {icon: FolderIcon, label: 'WebFTP e arquivos'},
  {icon: DatabaseIcon, label: 'Bancos MySQL'},
  {icon: PanelTopIcon, label: 'Criador de sites'},
  {icon: PackageOpenIcon, label: 'Instalador de aplicações'},
];

const planComparison = [
  {key: 'disk_mb' as const, label: 'Espaço em disco', icon: HardDriveIcon},
  {key: 'bandwidth_mb' as const, label: 'Tráfego mensal', icon: GaugeIcon},
  {key: 'domains' as const, label: 'Domínios', icon: Globe2Icon},
  {key: 'databases' as const, label: 'Bancos MySQL', icon: DatabaseIcon},
];

export function Component() {
  const plans = useQuery(hostingPlansOptions());
  const articles = useQuery(knowledgeArticlesOptions());

  return (
    <ProductEclipseShell className="hf-home">
      <StaticPageTitle>
        <Trans message="Hospedagem gratuita para publicar seu site" />
      </StaticPageTitle>
      <Hero />
      <CapabilityRail />
      <ControlCenterSection />
      <BuilderSection />
      <InstallerSection />
      <HowItWorks />
      <PlansSection
        plans={plans.data ?? []}
        isLoading={plans.isLoading}
        isError={plans.isError}
      />
      <KnowledgeSection
        articles={articles.data ?? []}
        isLoading={articles.isLoading}
        isError={articles.isError}
      />
      <FinalCta />
    </ProductEclipseShell>
  );
}

function Hero() {
  const {registration} = useSettings();
  const {trans} = useTrans();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    let isInView = true;
    const updateAnimationState = () => {
      element.dataset.ambientActive = String(
        isInView && document.visibilityState === 'visible',
      );
    };

    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            entries => {
              isInView = entries[0]?.isIntersecting ?? true;
              updateAnimationState();
            },
            {rootMargin: '160px 0px', threshold: 0.01},
          )
        : null;

    observer?.observe(element);
    document.addEventListener('visibilitychange', updateAnimationState);
    updateAnimationState();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updateAnimationState);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="hf-home-hero"
      aria-labelledby="hf-home-title"
      data-ambient-active="true"
    >
      <div className="hf-shell hf-home-hero-grid">
        <div className="hf-home-hero-copy">
          <span className="hf-home-kicker">
            <ServerIcon aria-hidden="true" />
            <Trans message="Hospedagem para começar e crescer" />
          </span>
          <h1 id="hf-home-title" className="hf-home-display hf-home-hero-title">
            <span>
              <Trans message="Seu site no ar." />
            </span>
            <span>
              <Trans message="Você no controle." />
            </span>
          </h1>
          <p>
            <Trans message="Publique arquivos, conecte domínios, crie bancos e abra as ferramentas da sua hospedagem em um painel claro — começando pelo plano gratuito." />
          </p>
          <div className="hf-home-hero-actions">
            {!registration?.disable ? (
              <Button
                nativeButton={false}
                render={<Link to="/register" />}
                className="hf-button-primary hf-button-large"
              >
                <Trans message="Criar conta grátis" />
                <ArrowRightIcon />
              </Button>
            ) : (
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                className="hf-button-primary hf-button-large"
              >
                <Trans message="Entrar na conta" />
                <ArrowRightIcon />
              </Button>
            )}
            <Button
              nativeButton={false}
              render={<a href="#recursos" />}
              variant="outline"
              className="hf-button-secondary hf-button-large"
            >
              <Trans message="Conhecer o painel" />
            </Button>
          </div>
          <ul className="hf-home-hero-trust">
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Sem cartão para começar" />
            </li>
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Subdomínio hsite.top" />
            </li>
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Upgrade no mesmo painel" />
            </li>
          </ul>
        </div>

        <div className="hf-home-hero-media">
          <div className="hf-home-hero-orbit" aria-hidden="true" />
          <img
            src="/images/hospedfree/hero-hospedfree.png"
            alt={trans({
              message:
                'Pessoa usando o painel HospedFree para acompanhar uma hospedagem',
            })}
            width="1766"
            height="1157"
            fetchPriority="high"
          />
          <div className="hf-home-live-note">
            <span aria-hidden="true" />
            <div>
              <small>
                <Trans message="Status visível" />
              </small>
              <strong>
                <Trans message="Pronto para publicar" />
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilityRail() {
  return (
    <div className="hf-home-capability-rail">
      <div className="hf-shell hf-home-capability-grid">
        {capabilities.map(item => (
          <div key={item.label} className="hf-home-capability">
            <item.icon aria-hidden="true" />
            <Trans message={item.label} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlCenterSection() {
  const {registration} = useSettings();
  const features = [
    {
      icon: LayoutDashboardIcon,
      title: 'Hospedagem',
      description: 'Veja o estado da conta e a próxima ação sem adivinhar.',
    },
    {
      icon: FolderIcon,
      title: 'Arquivos',
      description: 'Envie e organize conteúdo pelo navegador.',
    },
    {
      icon: Globe2Icon,
      title: 'Domínios e SSL',
      description: 'Acompanhe DNS, validação e certificado no mesmo fluxo.',
    },
    {
      icon: DatabaseIcon,
      title: 'Bancos MySQL',
      description: 'Consulte limites e crie bancos para suas aplicações.',
    },
  ];

  return (
    <section id="recursos" className="hf-home-section hf-home-control">
      <div className="hf-shell">
        <Reveal className="hf-home-heading-split">
          <div>
            <span className="hf-home-kicker">
              <LayoutDashboardIcon aria-hidden="true" />
              <Trans message="Um painel, todas as etapas" />
            </span>
            <h2 className="hf-home-display">
              <span>
                <Trans message="Tudo no mesmo painel." />
              </span>
            </h2>
          </div>
          <p>
            <Trans message="A HospedFree organiza as tarefas na ordem em que você precisa delas. A operação técnica continua protegida; o painel mostra apenas o que ajuda a publicar e manter o site." />
          </p>
        </Reveal>

        <Reveal className="hf-home-control-stage">
          <img
            className="hf-home-control-backdrop"
            src="/images/hospedfree/painel-user-hospedfree.png"
            alt=""
            aria-hidden="true"
            width="1747"
            height="1319"
            loading="lazy"
          />
          <div className="hf-home-window-bar">
            <span />
            <span />
            <span />
            <small>
              <Trans message="Visão geral da hospedagem" />
            </small>
          </div>

          <div className="hf-home-control-visual">
            <div className="hf-home-control-caption">
              <span aria-hidden="true">
                <CheckIcon />
              </span>
              <div>
                <strong>
                  <Trans message="Visão centralizada" />
                </strong>
                <small>
                  <Trans message="Status, recursos e próximas ações no mesmo lugar." />
                </small>
              </div>
            </div>
          </div>

          <div className="hf-home-control-panel">
            <div className="hf-home-feature-list">
              {features.map(feature => (
                <article key={feature.title}>
                  <span className="hf-home-feature-icon">
                    <feature.icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>
                      <Trans message={feature.title} />
                    </h3>
                    <p>
                      <Trans message={feature.description} />
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="hf-home-control-actions">
              {!registration?.disable ? (
                <Button
                  nativeButton={false}
                  render={<Link to="/register" />}
                  className="hf-button-primary"
                >
                  <Trans message="Criar conta grátis" />
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button
                  nativeButton={false}
                  render={<Link to="/login" />}
                  className="hf-button-primary"
                >
                  <Trans message="Entrar na conta" />
                  <ArrowRightIcon />
                </Button>
              )}
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                variant="outline"
                className="hf-button-secondary"
              >
                <Trans message={!registration?.disable ? "Entrar" : "Já tenho conta"} />
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="hf-home-operations">
          <Reveal className="hf-home-operation-card">
            <header>
              <span className="hf-home-feature-icon">
                <FolderIcon aria-hidden="true" />
              </span>
              <div>
                <h3>
                  <Trans message="WebFTP sem expor sua senha" />
                </h3>
                <p>
                  <Trans message="Crie, envie, edite e organize os arquivos dentro da hospedagem autorizada." />
                </p>
              </div>
            </header>
            <FileManagerPreview />
          </Reveal>

          <Reveal className="hf-home-operation-card">
            <header>
              <span className="hf-home-feature-icon">
                <Globe2Icon aria-hidden="true" />
              </span>
              <div>
                <h3>
                  <Trans message="Endereços sob controle" />
                </h3>
                <p>
                  <Trans message="Comece com hsite.top ou acompanhe a configuração do seu domínio próprio." />
                </p>
              </div>
            </header>
            <div className="hf-home-domain-stack">
              <DomainRow
                icon={<Globe2Icon />}
                title="Subdomínio gratuito"
                description="Seu endereço hsite.top para começar"
                state="Incluído"
              />
              <DomainRow
                icon={<ServerIcon />}
                title="Domínio próprio"
                description="Orientação de DNS e próxima ação"
                state="Gerenciável"
              />
              <DomainRow
                icon={<LockKeyholeIcon />}
                title="HTTPS e SSL"
                description="Solicitação e status do certificado"
                state="Protegido"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function BuilderSection() {
  const {registration} = useSettings();
  const {trans} = useTrans();

  return (
    <section className="hf-home-story-band">
      <div className="hf-shell hf-home-builder-grid">
        <Reveal className="hf-home-builder-media">
          <div aria-hidden="true" className="hf-home-builder-glow" />
          <img
            src="/images/hospedfree/construtor-hospedfree.png"
            alt={trans({
              message: 'Criador de sites visual aberto em notebook e celular',
            })}
            width="1917"
            height="923"
            loading="lazy"
          />
        </Reveal>
        <Reveal className="hf-home-story-copy">
          <span className="hf-home-kicker">
            <SparklesIcon aria-hidden="true" />
            <Trans message="Criador de sites" />
          </span>
          <h2 className="hf-home-display">
            <span>
              <Trans message="Crie visualmente." />
            </span>
            <span>
              <Trans message="Publique rápido." />
            </span>
          </h2>
          <p>
            <Trans message="Escolha o domínio da hospedagem, abra o editor por uma sessão autorizada e publique sem precisar montar a página do zero." />
          </p>
          <ul className="hf-home-check-list">
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Abertura segura pelo painel" />
            </li>
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Edição visual responsiva" />
            </li>
            <li>
              <CheckIcon aria-hidden="true" />
              <Trans message="Publicação no domínio selecionado" />
            </li>
          </ul>
          <div className="hf-home-builder-actions">
            <Button
              nativeButton={false}
              render={<Link to="/construtor-de-sites" />}
              className="hf-button-primary hf-button-large"
            >
              <Trans message="Conhecer o construtor" />
              <ArrowRightIcon />
            </Button>
            {!registration?.disable ? (
              <Link to="/register" className="hf-inline-link">
                <Trans message="Criar conta grátis" />
                <ArrowRightIcon />
              </Link>
            ) : (
              <Link to="/login" className="hf-inline-link">
                <Trans message="Entrar na conta" />
                <ArrowRightIcon />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function InstallerSection() {
  const {registration} = useSettings();
  const applications = [
    {name: 'WordPress', icon: <SiWordpress aria-hidden="true" />},
    {name: 'Joomla', icon: <SiJoomla aria-hidden="true" />},
    {name: 'PrestaShop', icon: <SiPrestashop aria-hidden="true" />},
    {name: 'phpBB', icon: <SiPhpbb aria-hidden="true" />},
  ];

  return (
    <section id="instalador" className="hf-home-section hf-home-installer">
      <div className="hf-shell hf-home-installer-grid">
        <Reveal className="hf-home-story-copy">
          <span className="hf-home-kicker">
            <PackageOpenIcon aria-hidden="true" />
            <Trans message="Instalador de aplicações" />
          </span>
          <h2 className="hf-home-display">
            <span>
              <Trans message="WordPress em" />
            </span>
            <span>
              <Trans message="poucos cliques." />
            </span>
          </h2>
          <p>
            <Trans message="Abra o instalador autorizado pelo painel, escolha a aplicação e continue no catálogo disponível para sua hospedagem." />
          </p>
          <div className="hf-home-installer-steps">
            <div>
              <span>01</span>
              <Trans message="Escolha o domínio" />
            </div>
            <div>
              <span>02</span>
              <Trans message="Abra o instalador" />
            </div>
            <div>
              <span>03</span>
              <Trans message="Acompanhe pelo painel" />
            </div>
          </div>
          {!registration?.disable ? (
            <Link to="/register" className="hf-inline-link">
              <Trans message="Criar minha hospedagem" />
              <ArrowRightIcon />
            </Link>
          ) : (
            <Link to="/login" className="hf-inline-link">
              <Trans message="Acessar minha hospedagem" />
              <ArrowRightIcon />
            </Link>
          )}
        </Reveal>

        <Reveal className="hf-home-app-visual">
          <div className="hf-home-app-core">
            <span>
              <PackageOpenIcon aria-hidden="true" />
            </span>
            <small>Softaculous</small>
            <strong>
              <Trans message="Catálogo de aplicações" />
            </strong>
          </div>
          <div className="hf-home-app-grid">
            {applications.map(app => (
              <div key={app.name}>
                <span>{app.icon}</span>
                <strong>{app.name}</strong>
                <small>
                  <Trans message="Disponível no instalador" />
                </small>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const {registration} = useSettings();
  const steps = [
    {
      icon: Globe2Icon,
      title: 'Crie sua conta',
      body: 'Cadastre-se e escolha o endereço gratuito para começar.',
    },
    {
      icon: FileCode2Icon,
      title: 'Prepare o projeto',
      body: 'Use arquivos, criador visual ou instalador de aplicações.',
    },
    {
      icon: UploadCloudIcon,
      title: 'Publique e acompanhe',
      body: 'Consulte o estado, os limites e as ferramentas no painel.',
    },
  ];

  return (
    <section id="como-funciona" className="hf-home-section hf-home-process">
      <div className="hf-shell">
        <Reveal className="hf-home-process-intro">
          <div>
            <span className="hf-home-kicker">
              <ArrowRightIcon aria-hidden="true" />
              <Trans message="Da conta ao site publicado" />
            </span>
            <h2 className="hf-home-display">
              <span>
                <Trans message="Da conta ao site." />
              </span>
              <span>
                <Trans message="Sem mistério." />
              </span>
            </h2>
          </div>
          <p className="hf-home-process-summary">
            <Trans message="Você escolhe como criar. O painel mantém domínio, arquivos e ferramentas no mesmo fluxo até a publicação." />
          </p>
        </Reveal>

        <Reveal className="hf-home-process-stage">
          <img
            className="hf-home-process-backdrop"
            src="/images/hospedfree/desenvolvedor-publicando-site-em-casa.jpg"
            alt=""
            aria-hidden="true"
            width="1760"
            height="1328"
            loading="lazy"
          />
          <div className="hf-home-process-visual">
            <div className="hf-home-process-caption">
              <span aria-hidden="true">
                <CheckIcon />
              </span>
              <div>
                <strong>
                  <Trans message="Projeto pronto para avançar" />
                </strong>
                <small>
                  <Trans message="Da primeira configuração ao site publicado." />
                </small>
              </div>
            </div>
          </div>

          <div className="hf-home-process-panel">
            <ol className="hf-home-process-list">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.title} className="hf-home-process-step">
                    <span className="hf-home-process-step-mark">
                      <StepIcon aria-hidden="true" />
                      <small>0{index + 1}</small>
                    </span>
                    <div>
                      <h3>
                        <Trans message={step.title} />
                      </h3>
                      <p>
                        <Trans message={step.body} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="hf-home-process-actions">
              {!registration?.disable ? (
                <Button
                  nativeButton={false}
                  render={<Link to="/register" />}
                  className="hf-button-primary"
                >
                  <Trans message="Criar conta grátis" />
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button
                  nativeButton={false}
                  render={<Link to="/login" />}
                  className="hf-button-primary"
                >
                  <Trans message="Entrar na conta" />
                  <ArrowRightIcon />
                </Button>
              )}
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                variant="outline"
                className="hf-button-secondary"
              >
                <Trans message="Já tenho conta" />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlansSection({
  plans,
  isLoading,
  isError,
}: {
  plans: HostingPlan[];
  isLoading: boolean;
  isError: boolean;
}) {
  const orderedPlans = orderHostingPlans(plans);
  const freePlan = getFreeHostingPlan(orderedPlans);
  const paidPlan = getPreferredPaidHostingPlan(orderedPlans);

  return (
    <section id="planos" className="hf-home-section hf-home-pricing">
      <div className="hf-shell">
        <Reveal className="hf-home-heading-split hf-home-pricing-heading">
          <div>
            <span className="hf-home-kicker">
              <GaugeIcon aria-hidden="true" />
              <Trans message="Planos de hospedagem" />
            </span>
            <h2 className="hf-home-display">
              <span>
                <Trans message="Comece grátis." />
              </span>
              <span>
                <Trans message="Cresça depois." />
              </span>
            </h2>
          </div>
          <div className="hf-home-pricing-intro">
            <p>
              <Trans message="A comparação usa os limites atuais do catálogo. Preço e contratação só aparecem quando a configuração comercial estiver completa." />
            </p>
            <Link to="/planos" className="hf-inline-link">
              <Trans message="Comparar todos os detalhes" />
              <ArrowRightIcon />
            </Link>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="hf-home-pricing-skeleton">
            {[0, 1, 2].map(item => (
              <Skeleton key={item} className="h-[31rem] bg-white/[0.04]" />
            ))}
          </div>
        ) : isError ? (
          <CatalogState
            message="Não foi possível carregar os planos agora."
            linkLabel="Abrir página de planos"
          />
        ) : !orderedPlans.length ? (
          <CatalogState
            message="Nenhum plano público está disponível neste momento."
            linkLabel="Consultar a central de ajuda"
            href="/faq"
          />
        ) : (
          <div className="hf-home-pricing-board">
            {freePlan && <LandingPlanTier plan={freePlan} />}
            {paidPlan && <LandingPlanTier plan={paidPlan} emphasized />}
            <div className="hf-home-plan-delta">
              <div>
                <span>
                  <Trans message="Free e Pro lado a lado" />
                </span>
                <h3>
                  <Trans message="O que muda quando o projeto cresce" />
                </h3>
              </div>
              <div className="hf-home-plan-delta-list">
                {planComparison.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key}>
                      <Icon aria-hidden="true" />
                      <span>
                        <Trans message={item.label} />
                      </span>
                      <strong>
                        {formatHostingPlanLimit(freePlan, item.key) ?? '—'}
                        <ArrowRightIcon aria-hidden="true" />
                        {formatHostingPlanLimit(paidPlan, item.key) ?? '—'}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <div className="hf-home-plan-note">
                <ShieldCheckIcon aria-hidden="true" />
                <Trans message="Os dois pacotes atuais estão configurados sem anúncios." />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LandingPlanTier({
  plan,
  emphasized = false,
}: {
  plan: HostingPlan;
  emphasized?: boolean;
}) {
  const {registration} = useSettings();
  const price = getHostingPlanPrice(
    plan,
    getDefaultHostingBillingCycle([plan]),
  );
  const details = getHostingPlanDetails(plan).slice(0, 5);
  const canPurchase =
    plan.type === 'free'
      ? plan.purchase_available && !registration?.disable
      : !!price && plan.purchase_available;

  return (
    <article className={cn('hf-home-plan-tier', emphasized && 'is-emphasized')}>
      <header>
        <div>
          <span>
            <Trans
              message={plan.type === 'free' ? 'Para começar' : 'Para crescer'}
            />
          </span>
          <h3>{plan.product.name}</h3>
        </div>
        {plan.product.recommended && (
          <small>
            <Trans message="Recomendado" />
          </small>
        )}
      </header>
      <p>
        {plan.product.description ?? (
          <Trans message="Hospedagem para publicar e acompanhar seu projeto." />
        )}
      </p>
      <div className="hf-home-plan-price">
        {plan.type === 'free' ? (
          <>
            <strong>R$ 0,00</strong>
            <span>
              <Trans message="para começar" />
            </span>
          </>
        ) : price ? (
          <FormattedPrice
            price={price}
            priceClassName="text-[2.25rem] font-semibold tracking-[-0.04em] text-white"
            periodClassName="text-sm text-white/45"
          />
        ) : (
          <div>
            <strong>
              <Trans message="Preço em configuração" />
            </strong>
            <span>
              <Trans message="O plano pode ser comparado, mas ainda não contratado." />
            </span>
          </div>
        )}
      </div>
      <ul>
        {details.map(detail => (
          <li key={detail}>
            <CheckIcon aria-hidden="true" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
      {plan.type === 'free' && canPurchase ? (
        <Button
          nativeButton={false}
          render={<Link to="/register" />}
          className="hf-home-plan-action"
          variant="outline"
        >
          <Trans message="Começar grátis" />
          <ArrowRightIcon />
        </Button>
      ) : plan.type === 'free' ? (
        <Button disabled className="hf-home-plan-action" variant="outline">
          <Trans message="Cadastro indisponível" />
        </Button>
      ) : canPurchase ? (
        <Button
          nativeButton={false}
          render={<Link to="/planos" />}
          className="hf-home-plan-action"
        >
          <Trans message="Ver disponibilidade" />
          <ArrowRightIcon />
        </Button>
      ) : (
        <Button disabled className="hf-home-plan-action" variant="outline">
          <Trans message="Aguardando preço" />
        </Button>
      )}
    </article>
  );
}

function CatalogState({
  message,
  linkLabel,
  href = '/planos',
}: {
  message: string;
  linkLabel: string;
  href?: string;
}) {
  return (
    <div className="hf-home-data-state">
      <PackageOpenIcon aria-hidden="true" />
      <p>
        <Trans message={message} />
      </p>
      <Link to={href} className="hf-inline-link">
        <Trans message={linkLabel} />
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function KnowledgeSection({
  articles,
  isLoading,
  isError,
}: {
  articles: KnowledgeArticle[];
  isLoading: boolean;
  isError: boolean;
}) {
  const visible = articles.slice(0, 4);

  return (
    <section id="ajuda" className="hf-home-section hf-home-help">
      <div className="hf-shell hf-home-help-grid">
        <Reveal>
          <span className="hf-home-kicker">
            <BookOpenIcon aria-hidden="true" />
            <Trans message="Central de ajuda" />
          </span>
          <h2 className="hf-home-display">
            <span>
              <Trans message="Ajuda para" />
            </span>
            <span>
              <Trans message="publicar." />
            </span>
          </h2>
          <p>
            <Trans message="Cada assunto abre em uma página própria, com endereço compartilhável e conteúdo preparado para você retomar quando precisar." />
          </p>
          <Link to="/faq" className="hf-inline-link">
            <Trans message="Abrir central de ajuda" />
            <ArrowRightIcon />
          </Link>
        </Reveal>

        <Reveal className="hf-home-knowledge-list">
          {isLoading &&
            [0, 1, 2, 3].map(item => (
              <Skeleton
                key={item}
                className="h-24 rounded-none bg-white/[0.04]"
              />
            ))}
          {!isLoading &&
            visible.map(article => (
              <Link
                key={article.id}
                to={'/faq/' + article.slug}
                className="hf-home-knowledge-row"
              >
                <div>
                  {article.category?.name && (
                    <span>{article.category.name}</span>
                  )}
                  <strong>{article.title}</strong>
                  {article.excerpt && <p>{article.excerpt}</p>}
                </div>
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            ))}
          {!isLoading && isError && (
            <CatalogState
              message="Os artigos não puderam ser carregados agora."
              linkLabel="Tentar pela central de ajuda"
              href="/faq"
            />
          )}
          {!isLoading && !isError && !visible.length && (
            <CatalogState
              message="A central de ajuda está sendo preparada."
              linkLabel="Abrir central de ajuda"
              href="/faq"
            />
          )}
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  const {registration} = useSettings();
  const {trans} = useTrans();

  return (
    <section className="hf-home-closing">
      <div className="hf-shell">
        <Reveal className="hf-home-closing-card">
          <div>
            <span className="hf-home-kicker">
              <ShieldCheckIcon aria-hidden="true" />
              <Trans message="Comece pelo essencial" />
            </span>
            <h2 className="hf-home-display">
              <span>
                <Trans message="Seu site pode" />
              </span>
              <span>
                <Trans message="começar hoje." />
              </span>
            </h2>
            <p>
              <Trans message="Crie a conta gratuita, publique no seu ritmo e aumente os recursos no mesmo painel quando o projeto pedir." />
            </p>
            <div className="hf-home-closing-actions">
              {!registration?.disable && (
                <Button
                  nativeButton={false}
                  render={<Link to="/register" />}
                  className="hf-button-light"
                >
                  <Trans message="Criar conta grátis" />
                  <ArrowRightIcon />
                </Button>
              )}
              <Link
                to="/planos"
                className="hf-inline-link hf-inline-link-light"
              >
                <Trans message="Ver planos" />
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
          <img
            src="/images/hospedfree/sucesso-hospedfree.png"
            alt={trans({
              message: 'Pessoa celebrando a publicação de um projeto online',
            })}
            width="1025"
            height="769"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  );
}

function FileManagerPreview() {
  const {trans} = useTrans();
  const rows = [
    {icon: FolderIcon, name: 'htdocs', type: 'Pasta'},
    {icon: FolderIcon, name: 'assets', type: 'Pasta'},
    {icon: FileCode2Icon, name: 'index.php', type: 'PHP'},
    {icon: FileTextIcon, name: '.htaccess', type: 'Configuração'},
  ];

  return (
    <div
      className="hf-home-file-preview"
      aria-label={trans({message: 'Exemplo do gerenciador de arquivos'})}
    >
      <div className="hf-home-file-toolbar">
        <span>
          <FolderIcon aria-hidden="true" />
          /htdocs
        </span>
        <div>
          <span>
            <UploadCloudIcon aria-hidden="true" />
            <Trans message="Enviar" />
          </span>
          <span>
            <FileCode2Icon aria-hidden="true" />
            <Trans message="Novo" />
          </span>
        </div>
      </div>
      <div className="hf-home-file-head">
        <span>
          <Trans message="Nome" />
        </span>
        <span>
          <Trans message="Tipo" />
        </span>
        <span>
          <Trans message="Ação" />
        </span>
      </div>
      {rows.map(row => (
        <div key={row.name} className="hf-home-file-row">
          <span>
            <row.icon aria-hidden="true" />
            {row.name}
          </span>
          <span>
            <Trans message={row.type} />
          </span>
          <span aria-hidden="true">•••</span>
        </div>
      ))}
    </div>
  );
}

function DomainRow({
  icon,
  title,
  description,
  state,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  state: string;
}) {
  return (
    <div>
      <span className="hf-home-domain-icon">{icon}</span>
      <div>
        <strong>
          <Trans message={title} />
        </strong>
        <small>
          <Trans message={description} />
        </small>
      </div>
      <span className="hf-home-domain-state">
        <Trans message={state} />
      </span>
    </div>
  );
}

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      element.dataset.visible = 'true';
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          element.dataset.visible = 'true';
          observer.disconnect();
        }
      },
      {rootMargin: '0px 0px -8% 0px', threshold: 0.08},
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-hf-reveal>
      {children}
    </div>
  );
}
