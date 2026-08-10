import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';
import clsx from 'clsx';
import {Globe2Icon} from 'lucide-react';
import memoize from 'nano-memoize';
import {useState} from 'react';

interface RemoteFaviconProps {
  url: string;
  className?: string;
  size?: string;
  alt?: string;
}
export function RemoteFavicon({
  url,
  className,
  size = 'size-4',
  alt,
}: RemoteFaviconProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!url.trim()) {
    return null;
  }

  const src = getFaviconSrc(url);

  if (!src || failedSrc === src) {
    return (
      <Globe2Icon
        data-slot="remote-favicon-fallback"
        className={clsx('shrink-0 text-muted-foreground', size, className)}
        aria-hidden={alt ? undefined : true}
        aria-label={alt}
        role={alt ? 'img' : undefined}
      />
    );
  }

  return (
    <img
      className={clsx(size, className)}
      src={src}
      alt={alt ?? ''}
      onError={() => setFailedSrc(src)}
    />
  );
}

const getFaviconSrc = memoize((url: string): string | null => {
  let parsedUrl: URL;

  try {
    if (!isAbsoluteUrl(url)) {
      if (typeof window === 'undefined') {
        return null;
      }
      parsedUrl = new URL(window.location.origin);
    } else {
      parsedUrl = new URL(url);
    }
  } catch {
    return null;
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    !isPublicHostname(parsedUrl.hostname)
  ) {
    return null;
  }

  if (
    hostnameMatches(parsedUrl.hostname, 'youtube.com') ||
    parsedUrl.hostname.toLowerCase() === 'youtu.be'
  ) {
    return 'https://www.youtube.com/s/desktop/ca54e1bd/img/favicon.ico';
  }

  return (
    'https://www.google.com/s2/favicons?domain=' +
    encodeURIComponent(parsedUrl.origin)
  );
});

function isPublicHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  const labels = normalized.split('.');
  const topLevelDomain = labels.at(-1);

  if (
    labels.length < 2 ||
    !topLevelDomain ||
    !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(topLevelDomain)
  ) {
    return false;
  }

  return labels.every(label =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label),
  );
}

function hostnameMatches(hostname: string, domain: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === domain || normalized.endsWith(`.${domain}`);
}
