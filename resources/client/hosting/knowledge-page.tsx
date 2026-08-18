import {
  knowledgeArticleOptions,
  knowledgeArticlesPageOptions,
} from '@app/hosting/hosting-queries';
import {KnowledgeArticle} from '@app/hosting/hosting-types';
import {PublicCategoryIcon} from '@app/landing/public-category-icon';
import {PublicContentShell} from '@app/landing/public-content-shell';
import {
  PublicEditorialEmpty,
  PublicEditorialPagination,
  PublicEditorialSearch,
} from '@app/landing/public-editorial-components';
import {Helmet} from '@common/seo/helmet';
import {Button} from '@shadcn/button/button';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BoxesIcon,
  ChevronRightIcon,
  ClockIcon,
  DatabaseIcon,
  FolderOpenIcon,
  KeyRoundIcon,
  LifeBuoyIcon,
  RocketIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ReactNode, useMemo} from 'react';
import {Link, useLocation, useParams, useSearchParams} from 'react-router';

type KnowledgeGroup = {
  name: string;
  slug: string;
  articles: KnowledgeArticle[];
};

export function Component() {
  const {articleSlug} = useParams();

  if (articleSlug) {
    return <KnowledgeArticlePage slug={articleSlug} />;
  }

  return <KnowledgeIndexPage />;
}

function KnowledgeIndexPage() {
  const [params, setParams] = useSearchParams();
  const queryFromUrl = params.get('query')?.trim() ?? '';
  const categoryFromUrl = params.get('category')?.trim() ?? '';
  const requestedPage = Number(params.get('page') ?? '1');
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const articles = useQuery(
    knowledgeArticlesPageOptions({
      search: queryFromUrl,
      category: categoryFromUrl,
      page,
    }),
  );
  const catalog = useQuery(knowledgeArticlesPageOptions());
  const groups = useMemo(
    () => groupArticles(articles.data?.data ?? []),
    [articles.data?.data],
  );
  const catalogGroups = useMemo(
    () => groupArticles(catalog.data?.data ?? []),
    [catalog.data?.data],
  );
  const isFiltering = Boolean(queryFromUrl || categoryFromUrl);

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage > 1) {
      next.set('page', String(nextPage));
    } else {
      next.delete('page');
    }
    setParams(next);
    window.requestAnimationFrame(() => {
      document.getElementById('artigos')?.scrollIntoView({block: 'start'});
    });
  };

  const search = (value: string) => {
    const next = new URLSearchParams();
    if (value) {
      next.set('query', value);
    }
    setParams(next);
  };

  return (
    <PublicHelpShell
      seoTitle="Central de ajuda"
      seoDescription="Tutoriais da HospedFree para publicar sites, configurar FTP, MySQL, SSL, painel de hospedagem, domínios e resolver problemas comuns."
      canonicalPath="/faq"
    >
      <section className="hf-editorial-hero">
        <div className="hf-shell hf-editorial-hero-grid">
          <div>
            <span className="hf-editorial-mark" aria-hidden="true">
              <BookOpenIcon />
            </span>
            <h1 className="hf-editorial-heading">
              <Trans message="Respostas para manter seu site no ar" />
            </h1>
            <p className="hf-editorial-lead">
              <Trans message="Encontre orientações sobre publicação, domínio, arquivos, banco de dados, painel, senha e SSL. Cada resposta abre em uma página própria." />
            </p>
          </div>
          <div className="hf-help-search-panel">
            <h2>
              <Trans message="O que você precisa resolver?" />
            </h2>
            <p>
              <Trans message="Descreva a tarefa ou o problema. Você também pode explorar os temas abaixo." />
            </p>
            <PublicEditorialSearch
              value={queryFromUrl}
              onSearch={search}
              placeholder={message('Como publicar meu site?')}
            />
          </div>
        </div>
      </section>

      <section
        id="artigos"
        className="hf-shell hf-editorial-section scroll-mt-24"
      >
        <div className="hf-editorial-section-header">
          <div>
            <h2>
              {queryFromUrl ? (
                <Trans message="Resultados encontrados" />
              ) : categoryFromUrl ? (
                <Trans message="Artigos deste tema" />
              ) : (
                <Trans message="Explore por assunto" />
              )}
            </h2>
            <p>
              {isFiltering ? (
                <Trans message="A lista está filtrada. Limpe os filtros para voltar a todos os assuntos." />
              ) : (
                <Trans message="Comece pelo tema mais próximo da tarefa que deseja concluir." />
              )}
            </p>
          </div>
          {isFiltering ? (
            <Link className="hf-editorial-page-button" to="/faq#artigos">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              <Trans message="Ver todos os assuntos" />
            </Link>
          ) : null}
        </div>

        <div className="hf-help-layout" aria-busy={articles.isFetching}>
          <div className="min-w-0">
            {articles.isLoading ? (
              <KnowledgeIndexSkeleton />
            ) : groups.length ? (
              <div className="hf-help-groups">
                {groups.map(group => (
                  <ArticleGroup key={group.slug} group={group} />
                ))}
              </div>
            ) : (
              <EmptySearchState />
            )}

            <PublicEditorialPagination
              currentPage={articles.data?.meta?.current_page ?? page}
              hasPrevious={Boolean(articles.data?.links?.prev)}
              hasNext={Boolean(articles.data?.links?.next)}
              onPageChange={updatePage}
              disabled={articles.isFetching}
            />
          </div>

          <HelpSidebar
            groups={catalogGroups}
            activeCategory={categoryFromUrl}
            onQuickSearch={search}
          />
        </div>
      </section>
    </PublicHelpShell>
  );
}

function KnowledgeArticlePage({slug}: {slug: string}) {
  const article = useQuery(knowledgeArticleOptions(slug));
  const related = useQuery(knowledgeArticlesPageOptions());
  const current = article.data;
  const relatedArticles = useMemo(() => {
    return (related.data?.data ?? [])
      .filter(item => item.slug !== slug)
      .filter(item =>
        current?.category
          ? item.category?.slug === current.category.slug
          : true,
      )
      .slice(0, 5);
  }, [current?.category, related.data?.data, slug]);

  if (article.isLoading) {
    return (
      <PublicHelpShell
        seoTitle="Carregando artigo"
        seoDescription="Carregando artigo da central de ajuda HospedFree."
        canonicalPath={`/faq/${slug}`}
      >
        <section className="hf-shell hf-editorial-section max-w-4xl">
          <Skeleton className="h-8 w-40 bg-white/[0.05]" />
          <Skeleton className="mt-8 h-16 w-full bg-white/[0.05]" />
          <Skeleton className="mt-8 h-96 w-full bg-white/[0.05]" />
        </section>
      </PublicHelpShell>
    );
  }

  if (article.isError || !current) {
    return (
      <PublicHelpShell
        seoTitle="Artigo não encontrado"
        seoDescription="Este artigo da central de ajuda não foi encontrado."
        canonicalPath={`/faq/${slug}`}
      >
        <section className="hf-shell hf-editorial-section max-w-3xl">
          <PublicEditorialEmpty
            icon={<BookOpenIcon aria-hidden="true" />}
            title={<Trans message="Artigo não encontrado" />}
            description={
              <Trans message="O artigo pode ter sido removido ou ainda não está publicado." />
            }
          />
          <div className="mt-6 text-center">
            <Link className="hf-editorial-page-button" to="/faq">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              <Trans message="Voltar para a Central de Ajuda" />
            </Link>
          </div>
        </section>
      </PublicHelpShell>
    );
  }

  const description = articleDescription(current);

  return (
    <PublicHelpShell
      seoTitle={current.title}
      seoDescription={description}
      canonicalPath={`/faq/${current.slug}`}
      ogType="article"
    >
      <header className="hf-editorial-article-header">
        <div className="hf-shell">
          <nav className="hf-editorial-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">
              <Trans message="Início" />
            </Link>
            <ChevronRightIcon aria-hidden="true" />
            <Link to="/faq">
              <Trans message="Central de ajuda" />
            </Link>
            {current.category ? (
              <>
                <ChevronRightIcon aria-hidden="true" />
                <Link to={knowledgeCategoryUrl(current.category.slug)}>
                  {current.category.name}
                </Link>
              </>
            ) : null}
          </nav>

          <div className="hf-editorial-meta">
            {current.category ? (
              <Link
                className="hf-editorial-category-label"
                to={knowledgeCategoryUrl(current.category.slug)}
              >
                <PublicCategoryIcon name={current.category.name} />
                {current.category.name}
              </Link>
            ) : null}
            {current.published_at ? (
              <span>
                <ClockIcon aria-hidden="true" />
                <FormattedDate date={current.published_at} />
              </span>
            ) : null}
          </div>
          <h1 className="hf-editorial-heading hf-editorial-heading--article mt-5">
            {current.title}
          </h1>
          {current.excerpt ? (
            <p className="hf-editorial-lead">{current.excerpt}</p>
          ) : null}
        </div>
      </header>

      <section className="hf-shell hf-editorial-section">
        <div className="hf-editorial-article-layout">
          <article className="hf-editorial-article-body">
            <div
              className="hf-editorial-prose prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{__html: current.body}}
            />
          </article>

          <aside className="space-y-4">
            {relatedArticles.length ? (
              <section className="hf-editorial-aside-card">
                <h2>
                  <Trans message="Neste mesmo assunto" />
                </h2>
                <div className="hf-editorial-related-list">
                  {relatedArticles.map(item => (
                    <Link key={item.id} to={`/faq/${item.slug}`}>
                      <span>{item.title}</span>
                      <ChevronRightIcon aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <SupportCard />
          </aside>
        </div>
      </section>
    </PublicHelpShell>
  );
}

function PublicHelpShell({
  children,
  seoTitle,
  seoDescription,
  canonicalPath,
  ogType = 'website',
}: {
  children: ReactNode;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
}) {
  return (
    <PublicContentShell>
      <KnowledgeSeo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        ogType={ogType}
      />
      {children}
    </PublicContentShell>
  );
}

function KnowledgeSeo({
  title,
  description,
  canonicalPath,
  ogType,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: 'website' | 'article';
}) {
  const {
    branding: {site_name},
  } = useSettings();
  const location = useLocation();
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const canonicalUrl = `${origin}${canonicalPath}`;
  const fullTitle = `${title} - ${site_name}`;

  return (
    <Helmet
      tags={`
        <title>${escapeHtml(fullTitle)}</title>
        <meta name="description" content="${escapeHtml(description)}">
        <meta property="og:title" content="${escapeHtml(fullTitle)}">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:type" content="${escapeHtml(ogType)}">
        <meta property="og:url" content="${escapeHtml(canonicalUrl || location.pathname)}">
        <meta name="twitter:card" content="summary">
        <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <link rel="canonical" href="${escapeHtml(canonicalUrl || location.pathname)}">
      `}
    />
  );
}

function ArticleGroup({group}: {group: KnowledgeGroup}) {
  return (
    <section id={`categoria-${group.slug}`} className="hf-help-group">
      <div className="hf-help-group-header">
        <span className="hf-help-group-icon">
          <PublicCategoryIcon name={group.name} />
        </span>
        <div>
          <h2>{group.name}</h2>
          <p>
            <Trans
              message="[one :count orientação|other :count orientações]"
              values={{count: group.articles.length}}
            />
          </p>
        </div>
      </div>
      <div className="hf-help-article-list">
        {group.articles.map(article => (
          <Link
            key={article.id}
            to={`/faq/${article.slug}`}
            className="hf-help-article-link"
          >
            <span>
              <strong>{article.title}</strong>
              {article.excerpt ? <span>{article.excerpt}</span> : null}
            </span>
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function HelpSidebar({
  groups,
  activeCategory,
  onQuickSearch,
}: {
  groups: KnowledgeGroup[];
  activeCategory: string;
  onQuickSearch: (query: string) => void;
}) {
  const shortcuts = [
    {
      query: 'publicar',
      icon: <RocketIcon />,
      label: <Trans message="Publicar o site" />,
    },
    {
      query: 'senha',
      icon: <KeyRoundIcon />,
      label: <Trans message="Acesso e senha" />,
    },
    {
      query: 'mysql',
      icon: <DatabaseIcon />,
      label: <Trans message="Bancos MySQL" />,
    },
    {
      query: 'ssl',
      icon: <ShieldCheckIcon />,
      label: <Trans message="HTTPS e SSL" />,
    },
    {
      query: 'ftp',
      icon: <FolderOpenIcon />,
      label: <Trans message="Arquivos e FTP" />,
    },
  ];

  return (
    <aside className="hf-help-sidebar">
      {groups.length ? (
        <section>
          <h2>
            <Trans message="Explorar por tema" />
          </h2>
          <div className="hf-help-shortcuts">
            {groups.map(group => (
              <Link
                key={group.slug}
                to={knowledgeCategoryUrl(group.slug)}
                className="hf-help-shortcut"
                aria-current={
                  activeCategory === group.slug ? 'page' : undefined
                }
              >
                <PublicCategoryIcon name={group.name} />
                <span>{group.name}</span>
                <span className="hf-editorial-count ml-auto">
                  {group.articles.length}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2>
          <Trans message="Buscas rápidas" />
        </h2>
        <div className="hf-help-shortcuts">
          {shortcuts.map(shortcut => (
            <button
              key={shortcut.query}
              type="button"
              className="hf-help-shortcut"
              onClick={() => onQuickSearch(shortcut.query)}
            >
              {shortcut.icon}
              <span>{shortcut.label}</span>
              <ChevronRightIcon className="ml-auto" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <SupportCard />
    </aside>
  );
}

function SupportCard() {
  return (
    <section className="hf-editorial-aside-card">
      <span className="hf-help-sidebar-icon" aria-hidden="true">
        <LifeBuoyIcon />
      </span>
      <h2 className="mt-4">
        <Trans message="Ainda precisa de ajuda?" />
      </h2>
      <p>
        <Trans message="Entre na sua conta e abra um chamado vinculado à hospedagem. Não envie senhas ou outros dados sensíveis." />
      </p>
      <Button
        nativeButton={false}
        render={<Link to="/dashboard/support" />}
        className="hf-button-primary mt-5 w-full"
      >
        <Trans message="Abrir chamado" />
        <ArrowRightIcon />
      </Button>
    </section>
  );
}

function EmptySearchState() {
  return (
    <PublicEditorialEmpty
      icon={<BoxesIcon aria-hidden="true" />}
      title={<Trans message="Nenhum artigo encontrado" />}
      description={
        <Trans message="Tente outro termo, escolha um assunto diferente ou abra um chamado com sua dúvida." />
      }
    />
  );
}

function KnowledgeIndexSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1, 2].map(item => (
        <div key={item}>
          <Skeleton className="h-14 w-64 bg-white/[0.05]" />
          <Skeleton className="mt-4 h-32 w-full bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

function groupArticles(articles: KnowledgeArticle[]): KnowledgeGroup[] {
  const groups = new Map<string, KnowledgeGroup>();

  for (const article of articles) {
    const category = article.category ?? {name: 'Geral', slug: 'geral'};
    if (!groups.has(category.slug)) {
      groups.set(category.slug, {
        name: category.name,
        slug: category.slug,
        articles: [],
      });
    }
    groups.get(category.slug)!.articles.push(article);
  }

  return Array.from(groups.values());
}

function knowledgeCategoryUrl(slug: string): string {
  return `/faq?category=${encodeURIComponent(slug)}#artigos`;
}

function articleDescription(article: KnowledgeArticle): string {
  return truncate(
    article.excerpt || stripHtml(article.body) || article.title,
    155,
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
