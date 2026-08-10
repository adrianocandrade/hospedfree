import {ReactNode, useCallback, useEffect, useRef} from 'react';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

interface WidgetEngagementTrackerProps {
  biolinkId?: number | string;
  widgetId: number | string;
  isPreview?: boolean;
  children: ReactNode;
}

export function WidgetEngagementTracker({
  biolinkId,
  widgetId,
  isPreview,
  children,
}: WidgetEngagementTrackerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const trackClick = useCallback(() => {
    if (!biolinkId || isPreview) {
      return;
    }

    void fetch(
      `/api/v1/public/biolink/${biolinkId}/widget/${widgetId}/engagement`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getBootstrapData().csrf_token,
        },
        body: '{}',
        credentials: 'same-origin',
        keepalive: true,
      },
    ).catch(() => {
      // Public analytics must never interrupt the visitor action.
    });
  }, [biolinkId, isPreview, widgetId]);

  useEffect(() => {
    const onWindowBlur = () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLIFrameElement &&
          rootRef.current?.contains(activeElement)
        ) {
          trackClick();
        }
      });
    };

    window.addEventListener('blur', onWindowBlur);
    return () => window.removeEventListener('blur', onWindowBlur);
  }, [trackClick]);

  return (
    <div ref={rootRef} onClickCapture={trackClick}>
      {children}
    </div>
  );
}
