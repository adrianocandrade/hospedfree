import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {DownloadIcon, XIcon} from 'lucide-react';
import {useEffect, useState} from 'react';

const dismissalStorageKey = 'meulinkbio.pwa-install-dismissed-at';
const dismissalDuration = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>;
}

export function PwaInstallPrompt() {
  const {pwa} = useSettings();
  const {trans} = useTrans();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (pwa?.install_prompt_enabled === false || isInstalled()) {
      return;
    }

    const dismissedAt = getDismissedAt();
    if (dismissedAt && Date.now() - dismissedAt < dismissalDuration) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [pwa?.install_prompt_enabled]);

  if (!installEvent) {
    return null;
  }

  return (
    <aside
      aria-label={trans(message('Install application'))}
      className="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-card border bg-background p-3 shadow-xl sm:left-auto sm:mx-0 sm:p-4"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <DownloadIcon aria-hidden="true" className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">
          <Trans message="Install this app" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <Trans message="Open it faster from your home screen. Installation is optional." />
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          setInstallEvent(null);
        }}
      >
        <Trans message="Install" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={trans(message('Dismiss install prompt'))}
        onClick={() => {
          rememberDismissal();
          setInstallEvent(null);
        }}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </aside>
  );
}

function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & {standalone?: boolean}).standalone === true
  );
}

function getDismissedAt(): number {
  try {
    return Number(localStorage.getItem(dismissalStorageKey));
  } catch {
    return 0;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(dismissalStorageKey, String(Date.now()));
  } catch {
    // Storage can be unavailable in private browsing or hardened browsers.
  }
}
