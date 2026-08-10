import {PublicContentShell} from '@app/landing/public-content-shell';
import {ReactNode} from 'react';

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
    <header className="border-b border-[var(--lp-border)] bg-[var(--lp-surface-soft)]">
      <div className="lp-container py-12 md:py-16 lg:py-20">
        <h1 className="max-w-3xl text-4xl font-[var(--lp-font-display)] font-semibold tracking-[-0.03em] text-balance text-[var(--lp-ink)] md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-[68ch] text-base leading-7 text-[var(--lp-muted)] md:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </header>
  );
}
