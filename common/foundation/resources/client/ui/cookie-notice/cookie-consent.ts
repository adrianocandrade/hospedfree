import {useCookie} from '@ui/utils/hooks/use-cookie';
import {useCallback, useMemo} from 'react';

export const COOKIE_CONSENT_NAME = 'hf_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_DAYS = 180;
export const OPEN_COOKIE_PREFERENCES_EVENT =
  'hospedfree:open-cookie-preferences';

export interface CookieConsentValue {
  version: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  analytics: boolean;
  decidedAt: string;
}

export function parseCookieConsent(
  rawValue: string | undefined,
): CookieConsentValue | null {
  if (!rawValue) return null;

  try {
    const value: unknown = JSON.parse(rawValue);
    if (!isRecord(value)) return null;

    if (
      value.version !== COOKIE_CONSENT_VERSION ||
      value.necessary !== true ||
      typeof value.analytics !== 'boolean' ||
      typeof value.decidedAt !== 'string' ||
      Number.isNaN(Date.parse(value.decidedAt))
    ) {
      return null;
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: value.analytics,
      decidedAt: value.decidedAt,
    };
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [rawValue, setRawValue] = useCookie(COOKIE_CONSENT_NAME);
  const consent = useMemo(() => parseCookieConsent(rawValue), [rawValue]);

  const saveConsent = useCallback(
    (analytics: boolean) => {
      const value: CookieConsentValue = {
        version: COOKIE_CONSENT_VERSION,
        necessary: true,
        analytics,
        decidedAt: new Date().toISOString(),
      };

      setRawValue(JSON.stringify(value), {
        days: COOKIE_CONSENT_DAYS,
        path: '/',
        SameSite: 'Lax',
        Secure: window.location.protocol === 'https:',
      });
    },
    [setRawValue],
  );

  return {consent, saveConsent};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
