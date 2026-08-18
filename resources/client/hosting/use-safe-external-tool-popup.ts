import {useCallback, useRef} from 'react';

type SafeExternalToolPopupOptions = {
  loadUrl: () => Promise<string>;
  onBlocked: () => void;
  onError: (error: unknown) => void;
  onUnsafeUrl: () => void;
};

/**
 * Open a placeholder while the click still has a browser user gesture, then
 * navigate it only after the server returns an authorized tool URL.
 */
export function useSafeExternalToolPopup() {
  const pendingPopup = useRef<Window | null>(null);

  return useCallback(async (options: SafeExternalToolPopupOptions) => {
    if (pendingPopup.current && !pendingPopup.current.closed) {
      pendingPopup.current.focus();
      return;
    }

    const popup = window.open('about:blank', '_blank');

    if (!popup) {
      options.onBlocked();
      return;
    }

    popup.opener = null;
    pendingPopup.current = popup;

    try {
      const rawUrl = await options.loadUrl();
      const target = new URL(rawUrl);

      if (!['http:', 'https:'].includes(target.protocol)) {
        popup.close();
        options.onUnsafeUrl();
        return;
      }

      if (!popup.closed) {
        popup.location.replace(target.href);
      }
    } catch (error) {
      if (!popup.closed) {
        popup.close();
      }
      options.onError(error);
    } finally {
      pendingPopup.current = null;
    }
  }, []);
}
