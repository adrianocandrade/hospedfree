import {highlightAllCode} from '@common/text-editor/highlight/highlight-code';
import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {
  ArrowRightIcon,
  CookieIcon,
  FileTextIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import './custom-page.css';

interface CustomPageBodyProps {
  page: {
    title?: string | null;
    body?: string | null;
    slug?: string | null;
  };
}

type PageHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function CustomPageBody({page}: CustomPageBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<PageHeading[]>([]);

  useEffect(() => {
    if (!bodyRef.current) {
      return;
    }

    highlightAllCode(bodyRef.current);
    const usedIds = new Map<string, number>();
    const nextHeadings = Array.from(
      bodyRef.current.querySelectorAll<HTMLHeadingElement>('h2, h3'),
    ).map((heading, index) => {
      const baseId = toHeadingId(heading.textContent || `secao-${index + 1}`);
      const occurrence = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, occurrence + 1);
      const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
      heading.id = id;

      return {
        id,
        label: heading.textContent?.trim() || id,
        level: heading.tagName === 'H3' ? 3 : 2,
      } as PageHeading;
    });

    setHeadings(nextHeadings);
  }, [page.body]);

  const PageIcon = legalPageIcon(page.slug);
  const isCookiePage = page.slug === 'cookies';
  const isLegalPage = [
    'cookies',
    'privacy-policy',
    'terms-of-service',
  ].includes(page.slug ?? '');

  return (
    <section className="hf-legal-page">
      <header className="hf-legal-hero">
        <div className="hf-shell">
          <nav
            className="hf-legal-breadcrumbs"
            aria-label="Navegação estrutural"
          >
            <Link to="/">
              <Trans message="Início" />
            </Link>
            <span aria-hidden="true">/</span>
            <span>
              {isLegalPage ? (
                <Trans message="Documentos legais" />
              ) : (
                <Trans message="Conteúdo institucional" />
              )}
            </span>
          </nav>

          <div className="hf-legal-heading">
            <span className="hf-legal-icon" aria-hidden="true">
              <PageIcon />
            </span>
            <div>
              <p className="hf-legal-eyebrow">
                {isLegalPage ? (
                  <Trans message="Transparência HospedFree" />
                ) : (
                  <Trans message="HospedFree" />
                )}
              </p>
              <h1>{page.title}</h1>
              <p className="hf-legal-intro">
                {isLegalPage ? (
                  <Trans message="Informações claras sobre o serviço, seus dados e as escolhas disponíveis para você." />
                ) : (
                  <Trans message="Informações da HospedFree organizadas para uma leitura simples e direta." />
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="hf-shell hf-legal-layout">
        <article className="hf-legal-article">
          {isCookiePage ? (
            <section className="hf-cookie-preferences-callout">
              <div>
                <h2>
                  <Trans message="Suas preferências" />
                </h2>
                <p>
                  <Trans message="Revise a qualquer momento quais cookies opcionais podem ser usados neste navegador." />
                </p>
              </div>
              <Button
                className="hf-button-primary"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('hospedfree:open-cookie-preferences'),
                  )
                }
              >
                <CookieIcon />
                <Trans message="Gerenciar preferências" />
              </Button>
            </section>
          ) : null}

          {page.body ? (
            <div
              ref={bodyRef}
              className="hf-legal-body"
              dangerouslySetInnerHTML={{__html: page.body}}
            />
          ) : null}
        </article>

        <aside className="hf-legal-aside">
          {headings.length ? (
            <nav className="hf-legal-toc" aria-label="Nesta página">
              <p>
                <Trans message="Nesta página" />
              </p>
              <ul>
                {headings.map(heading => (
                  <li key={heading.id} data-level={heading.level}>
                    <a href={`#${heading.id}`}>{heading.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <section className="hf-legal-help">
            <ScaleIcon aria-hidden="true" />
            <h2>
              <Trans message="Precisa falar conosco?" />
            </h2>
            <p>
              <Trans message="Use o canal de contato para dúvidas sobre o serviço ou seus dados pessoais." />
            </p>
            <Link to="/contact">
              <Trans message="Abrir página de contato" />
              <ArrowRightIcon />
            </Link>
          </section>

          <nav className="hf-legal-related" aria-label="Outros documentos">
            <p>
              <Trans message="Outros documentos" />
            </p>
            <Link to="/pages/terms-of-service">
              <FileTextIcon />
              <Trans message="Termos de Uso" />
            </Link>
            <Link to="/pages/privacy-policy">
              <ShieldCheckIcon />
              <Trans message="Política de Privacidade" />
            </Link>
            <Link to="/pages/cookies">
              <CookieIcon />
              <Trans message="Política de Cookies" />
            </Link>
          </nav>
        </aside>
      </div>
    </section>
  );
}

function legalPageIcon(slug?: string | null) {
  if (slug === 'privacy-policy') {
    return ShieldCheckIcon;
  }

  if (slug === 'cookies') {
    return CookieIcon;
  }

  return FileTextIcon;
}

function toHeadingId(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'secao'
  );
}
