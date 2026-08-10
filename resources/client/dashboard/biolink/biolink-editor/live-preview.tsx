import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {BiolinkLayout} from '@app/short-links/renderers/biolink-renderer/biolink-layout';
import {Button} from '@shadcn/button/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {OverlayPortalContainerProvider} from '@shadcn/overlays/overlay-portal-container';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {MonitorIcon, SmartphoneIcon} from 'lucide-react';
import {Activity, ReactNode, useState} from 'react';
import {useLocation} from 'react-router';

export function LivePreview() {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const content = useBiolinkEditorStore(s => s.content);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  const {pathname} = useLocation();
  const isInsightsTab = pathname.split('/').pop() === 'insights';

  return (
    <Activity>
      <div
        className={cn(
          'compact-scrollbar shrink-0 overflow-x-hidden overflow-y-auto border-l p-6 max-xl:hidden',
          isInsightsTab && 'hidden',
        )}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <Chip size="sm" color="positive" radius="rounded">
            <Trans message="Live preview" />
          </Chip>
          <div className="flex rounded-input border bg-card p-0.5">
            <Button
              type="button"
              size="icon-sm"
              variant={device === 'mobile' ? 'default' : 'ghost'}
              onClick={() => setDevice('mobile')}
            >
              <SmartphoneIcon />
              <span className="sr-only">
                <Trans message="Mobile" />
              </span>
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={device === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setDevice('desktop')}
            >
              <MonitorIcon />
              <span className="sr-only">
                <Trans message="Desktop" />
              </span>
            </Button>
          </div>
        </div>
        <PreviewFrame device={device}>
          <BiolinkLayout
            biolink={biolink}
            content={content}
            appearance={appearance}
            isPreview
            renderMode={device}
            className="h-full"
          />
        </PreviewFrame>
        <div className="mt-3.5 text-center text-sm text-muted-foreground">
          <Trans message="Scheduled and disabled content is not shown" />
        </div>
      </div>
    </Activity>
  );
}

interface PhoneSkeletonProps {
  children: ReactNode;
  device: 'mobile' | 'desktop';
}
function PreviewFrame({children, device}: PhoneSkeletonProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  if (device === 'desktop') {
    return (
      <div
        ref={setPortalContainer}
        className="relative isolate mx-auto flex h-[720px] w-[672px] transform-gpu flex-col overflow-hidden rounded-xl border border-border bg-black shadow-2xl ring-4 ring-black/5 dark:ring-white/5"
      >
        <OverlayPortalContainerProvider container={portalContainer}>
          <div className="flex h-10 w-full shrink-0 items-center gap-1.5 bg-muted/80 px-4 backdrop-blur-md">
            <div className="size-3 rounded-full bg-red-400/80" />
            <div className="size-3 rounded-full bg-amber-400/80" />
            <div className="size-3 rounded-full bg-green-400/80" />
          </div>
          <div className="compact-scrollbar min-h-0 flex-auto overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </OverlayPortalContainerProvider>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[868px] w-[414px] rounded-[52px] border-[12px] border-black bg-black shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
      {/* Fake Notch */}
      <div className="absolute top-0 left-1/2 z-50 h-7 w-32 -translate-x-1/2 rounded-b-3xl bg-black" />

      {/* Screen: 390 x 844, matching a representative mobile viewport. */}
      <div
        ref={setPortalContainer}
        className="relative isolate h-full w-full transform-gpu overflow-hidden rounded-[40px] bg-background"
      >
        <OverlayPortalContainerProvider container={portalContainer}>
          <div className="compact-scrollbar h-full w-full overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </OverlayPortalContainerProvider>
      </div>
    </div>
  );
}
