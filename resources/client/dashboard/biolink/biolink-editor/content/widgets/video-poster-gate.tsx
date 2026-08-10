import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import type {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {cn} from '@ui/utils/cn';
import {PlayIcon, VideoIcon} from 'lucide-react';
import {CSSProperties, ReactNode, useEffect, useRef, useState} from 'react';

type Props = {
  appearance?: BiolinkAppearanceConfig | null;
  config?: object | null;
  playLabel: string;
  poster?: string | null;
  posterKey?: string | number | null;
  loadPoster?: () => Promise<string | undefined>;
  motion?: 'none' | 'pulse';
  duration?: string | null;
  caption?: ReactNode;
  children: ReactNode;
};

const videoLayerStyle = {
  borderRadius: 'var(--biolink-widget-radius)',
} as CSSProperties;

export function VideoPosterGate({
  appearance,
  config,
  playLabel,
  poster: customPoster,
  posterKey,
  loadPoster,
  motion = 'none',
  duration,
  caption,
  children,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState<string | undefined>(
    customPoster || undefined,
  );
  const [posterLoading, setPosterLoading] = useState(
    !customPoster && !!loadPoster,
  );
  const loaderRef = useRef(loadPoster);
  loaderRef.current = loadPoster;

  useEffect(() => {
    let cancelled = false;
    setPlaying(false);
    setPoster(customPoster || undefined);
    setPosterLoading(!customPoster && !!loaderRef.current);

    if (!customPoster && loaderRef.current) {
      void loaderRef
        .current()
        .then(nextPoster => {
          if (!cancelled) setPoster(nextPoster);
        })
        .catch(() => {
          if (!cancelled) setPoster(undefined);
        })
        .finally(() => {
          if (!cancelled) setPosterLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [customPoster, posterKey]);

  const tryAutomaticPoster = () => {
    setPoster(undefined);
    setPosterLoading(!!loaderRef.current);
    if (loaderRef.current) {
      void loaderRef
        .current()
        .then(setPoster)
        .catch(() => setPoster(undefined))
        .finally(() => setPosterLoading(false));
    }
  };

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={config}
      className="!overflow-hidden !border-0 !p-0"
      style={{borderWidth: 0}}
    >
      <div
        className="relative aspect-video w-full overflow-hidden bg-black text-white"
        style={videoLayerStyle}
      >
        {playing ? (
          children
        ) : (
          <>
            {posterLoading ? (
              <Skeleton
                className="absolute inset-0 bg-white/10"
                style={videoLayerStyle}
              />
            ) : poster ? (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 size-full object-cover"
                style={videoLayerStyle}
                loading="lazy"
                decoding="async"
                onError={tryAutomaticPoster}
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_44%,#25364b_0%,#111827_48%,#05070b_100%)]"
                style={videoLayerStyle}
              >
                <VideoIcon className="size-14 opacity-25" />
              </span>
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-black/30"
              style={videoLayerStyle}
            />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 grid size-full place-items-center outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
              style={videoLayerStyle}
              aria-label={playLabel}
            >
              <span className="relative grid size-14 place-items-center rounded-full bg-white text-black shadow-[0_4px_8px_rgb(0_0_0/0.28)] transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:transform-none">
                {motion === 'pulse' ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-0 rounded-full border-2 border-white/75',
                      'motion-safe:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]',
                    )}
                  />
                ) : null}
                <PlayIcon className="ml-0.5 size-5 fill-current" />
              </span>
            </button>
            {duration ? (
              <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
                {duration}
              </span>
            ) : null}
          </>
        )}
      </div>
      {caption ? <div className="p-4">{caption}</div> : null}
    </BiolinkWidgetSurface>
  );
}
