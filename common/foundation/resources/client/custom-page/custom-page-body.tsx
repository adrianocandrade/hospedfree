import {highlightAllCode} from '@common/text-editor/highlight/highlight-code';
import {useEffect, useRef} from 'react';

interface CustomPageBodyProps {
  page: {
    title?: string | null;
    body?: string | null;
  };
}
export function CustomPageBody({page}: CustomPageBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) {
      highlightAllCode(bodyRef.current);
    }
  }, []);

  return (
    <section className="bg-muted/35 px-4 py-10 md:px-6 md:py-14 lg:py-18">
      <article className="custom-page-body mx-auto max-w-4xl rounded-2xl bg-card px-6 py-8 text-card-foreground ring-1 ring-border sm:px-10 sm:py-12 lg:px-14">
        <h1 className="max-w-[20ch] text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
          {page.title}
        </h1>
        {page.body ? (
          <div
            ref={bodyRef}
            className="prose prose-lg mt-8 max-w-none wrap-break-word whitespace-pre-wrap dark:prose-invert prose-headings:tracking-[-0.02em] prose-a:text-primary"
            dangerouslySetInnerHTML={{__html: page.body}}
          />
        ) : null}
      </article>
    </section>
  );
}
