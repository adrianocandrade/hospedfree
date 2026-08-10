import {BookOpenIcon} from 'lucide-react';
import {Link} from 'react-router';

const blogPosts = [
  {
    title: 'Como criar o link na bio perfeito',
    excerpt:
      'Guia passo a passo para construir uma página que converte seus seguidores do Instagram.',
    image: '/images/3d/mobile-1.png',
    bg: 'var(--lp-lime-soft)',
  },
  {
    title: 'Vantagens do QR Code Dinâmico',
    excerpt:
      'Por que o seu negócio local precisa usar QR codes dinâmicos no balcão e em menus.',
    image: '/images/3d/Graph-1.png',
    bg: 'var(--lp-blue-soft)',
  },
  {
    title: 'Análise de métricas para criadores',
    excerpt:
      'Entenda quais métricas importam ao avaliar a sua taxa de engajamento no TikTok.',
    image: '/images/3d/Pen-1.png',
    bg: 'var(--lp-purple-soft)',
  },
];

export function LpBlog() {
  return (
    <section className="lp bg-[var(--lp-page-bg)] py-16 lg:py-24">
      <div className="lp-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-badge lp-badge--lime mb-5">Dicas & Insights</span>
          <h2 className="lp-heading lp-heading--section">
            Visite o nosso blog
          </h2>
          <p className="lp-subtext mx-auto mt-4">
            Aprenda como expandir a sua marca e tirar o máximo de proveito dos
            seus links.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {blogPosts.map((post, i) => (
            <Link
              to="/blog"
              key={i}
              className="group block overflow-hidden rounded-[var(--lp-radius-lg)] border border-[var(--lp-border)] bg-[var(--lp-surface)] transition-shadow hover:shadow-[var(--lp-shadow-sm)]"
            >
              <div
                className="flex h-40 items-center justify-center"
                style={{background: post.bg}}
              >
                <img
                  src={post.image}
                  alt=""
                  className="h-28 object-contain transition-transform group-hover:-translate-y-2 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3
                  className="text-lg font-bold"
                  style={{
                    fontFamily: 'var(--lp-font-display)',
                    color: 'var(--lp-ink)',
                  }}
                >
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/blog" className="lp-btn lp-btn--outline text-sm">
            <BookOpenIcon className="size-4" />
            <span>Ver todos os posts</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
