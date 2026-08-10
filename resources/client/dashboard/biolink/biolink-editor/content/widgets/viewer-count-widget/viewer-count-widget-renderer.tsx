import {ViewerCountWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/viewer-count-widget/viewer-count-widget-dialog';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {EyeIcon} from 'lucide-react';
import {useEffect, useState} from 'react';

const HEARTBEAT_INTERVAL = 20_000;

export function ViewerCountWidgetRenderer({
  widget,
  variant,
  appearance,
  biolink,
  isPreview,
}: WidgetRendererProps<ViewerCountWidget>) {
  const [count, setCount] = useState<number | null>(
    variant === 'editor' || isPreview ? 1 : null,
  );

  useEffect(() => {
    if (variant !== 'biolinkPage' || isPreview || !biolink?.id) {
      return;
    }

    let cancelled = false;
    const visitorToken = getVisitorToken();

    const updateCount = async () => {
      try {
        const response = await fetch(
          `/api/v1/public/biolink/${biolink.id}/viewer-count?visitor_token=${encodeURIComponent(visitorToken)}`,
          {headers: {Accept: 'application/json'}, cache: 'no-store'},
        );
        if (!response.ok) {
          throw new Error('Viewer count request failed');
        }
        const data = (await response.json()) as {count?: number};
        if (!cancelled && typeof data.count === 'number') {
          setCount(Math.max(0, Math.round(data.count)));
        }
      } catch {
        // Presence is optional and must never interrupt the page renderer.
      }
    };

    void updateCount();
    const interval = window.setInterval(updateCount, HEARTBEAT_INTERVAL);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [biolink?.id, isPreview, variant]);

  const color =
    widget.config.color || appearance?.bgConfig?.color || 'currentColor';
  const fontFamily =
    widget.config.fontConfig?.family || appearance?.fontConfig?.family;

  return (
    <div
      className="inline-flex items-center gap-1.5 text-sm leading-5"
      style={{color, fontFamily}}
      aria-live="polite"
    >
      <EyeIcon className="size-4" aria-hidden />
      <span>{count ?? '...'}</span>
    </div>
  );
}

function getVisitorToken(): string {
  const storageKey = 'meulinkbio-viewer-token';

  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const token =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(storageKey, token);
    return token;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
