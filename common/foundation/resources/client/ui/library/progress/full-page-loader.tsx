import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {getAssetUrl} from '@ui/utils/urls/get-asset-url';
import clsx from 'clsx';

interface FullPageLoaderProps {
  className?: string;
  screen?: boolean;
}
export function FullPageLoader({className, screen}: FullPageLoaderProps) {
  if (screen) {
    const iconUrl = getAssetUrl('images/icon.png');

    return (
      <div
        className={clsx('hf-page-loader', className)}
        data-slot="full-page-loader"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="hf-page-loader__visual" aria-hidden="true">
          <div className="hf-page-loader__glow" />
          <div className="hf-page-loader__mark">
            <img
              src={iconUrl}
              alt=""
              className="hf-page-loader__icon"
              draggable={false}
            />
            <img
              src={iconUrl}
              alt=""
              className="hf-page-loader__shine"
              draggable={false}
            />
          </div>
        </div>

        <div className="hf-page-loader__status">
          <span className="hf-page-loader__label">
            <Trans message="Preparing HospedFree..." />
          </span>
          <span className="hf-page-loader__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex flex-auto items-center justify-center',
        'h-full w-full',
        className,
      )}
    >
      <ProgressCircle isIndeterminate aria-label="Loading page..." />
    </div>
  );
}
