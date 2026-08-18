import {PublicContentShell} from '@app/landing/public-content-shell';
import {Helmet} from '@common/seo/helmet';
import {useSettings} from '@ui/settings/use-settings';
import {NewspaperIcon} from 'lucide-react';
import type {ReactNode} from 'react';
import {useLocation} from 'react-router';

export function BlogShell({children}: {children: ReactNode}) {
  return <PublicContentShell>{children}</PublicContentShell>;
}

export function BlogPageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="hf-editorial-hero">
      <div className="hf-shell hf-editorial-hero-grid">
        <div>
          <span className="hf-editorial-mark" aria-hidden="true">
            <NewspaperIcon />
          </span>
          <h1 className="hf-editorial-heading">{title}</h1>
          {description ? (
            <p className="hf-editorial-lead">{description}</p>
          ) : null}
        </div>
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </header>
  );
}

export function BlogSeo({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  image,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  image?: string | null;
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
        ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
        <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
        <link rel="canonical" href="${escapeHtml(canonicalUrl || location.pathname)}">
      `}
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
