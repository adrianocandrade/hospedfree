import {useCookieConsent} from '@common/ui/cookie-notice/cookie-consent';
import {useSettings} from '@ui/settings/use-settings';
import {useEffect} from 'react';

const SCRIPT_ID = 'hospedfree-google-analytics';
const GOOGLE_ANALYTICS_COOKIE_PREFIX = '_ga';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

export function GoogleAnalyticsConsentGate() {
  const {analytics} = useSettings();
  const {consent} = useCookieConsent();
  const measurementId = normalizeMeasurementId(analytics?.tracking_code);

  useEffect(() => {
    const loadedMeasurementId = getLoadedMeasurementId();

    if (loadedMeasurementId && loadedMeasurementId !== measurementId) {
      disableGoogleAnalytics(loadedMeasurementId);
    }

    if (!measurementId) {
      removeAnalyticsScript();
      clearGoogleAnalyticsCookies();
      return;
    }

    if (consent?.analytics === true) {
      enableGoogleAnalytics(measurementId);
    } else {
      disableGoogleAnalytics(measurementId);
    }
  }, [consent?.analytics, measurementId]);

  return null;
}

function normalizeMeasurementId(value: string | undefined): string | null {
  const measurementId = value?.trim().toUpperCase();
  return measurementId && /^G-[A-Z0-9]+$/.test(measurementId)
    ? measurementId
    : null;
}

function enableGoogleAnalytics(measurementId: string): void {
  const analyticsWindow = window as AnalyticsWindow;
  Reflect.deleteProperty(analyticsWindow, `ga-disable-${measurementId}`);

  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.gtag =
    analyticsWindow.gtag ??
    ((...args: unknown[]) => {
      analyticsWindow.dataLayer?.push(args);
    });

  analyticsWindow.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  if (document.getElementById(SCRIPT_ID)) return;

  analyticsWindow.gtag('js', new Date());
  analyticsWindow.gtag('config', measurementId, {
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.dataset.measurementId = measurementId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

function disableGoogleAnalytics(measurementId: string): void {
  const analyticsWindow = window as AnalyticsWindow;
  Reflect.set(analyticsWindow, `ga-disable-${measurementId}`, true);
  analyticsWindow.gtag?.('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  removeAnalyticsScript();
  clearGoogleAnalyticsCookies();
}

function getLoadedMeasurementId(): string | null {
  const value = document.getElementById(SCRIPT_ID)?.dataset.measurementId;
  return normalizeMeasurementId(value);
}

function removeAnalyticsScript(): void {
  document.getElementById(SCRIPT_ID)?.remove();
}

function clearGoogleAnalyticsCookies(): void {
  const cookieNames = document.cookie
    .split(';')
    .map(cookie => cookie.split('=')[0]?.trim())
    .filter(
      (name): name is string =>
        !!name && name.startsWith(GOOGLE_ANALYTICS_COOKIE_PREFIX),
    );

  const domain = window.location.hostname;
  for (const name of cookieNames) {
    expireCookie(name);
    if (domain) expireCookie(name, domain);
  }
}

function expireCookie(name: string, domain?: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${
    domain ? `; domain=${domain}` : ''
  }; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}
