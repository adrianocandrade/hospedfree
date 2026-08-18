const fallbackReturnPath = '/billing';

const allowedReturnPaths = [
  '/billing',
  '/account-settings/billing',
  '/dashboard/hosting',
];

/**
 * Keep checkout redirects on trusted customer pages. This value crosses
 * payment-provider redirects, so it must never accept an absolute or
 * protocol-relative URL.
 */
export function getSafeCheckoutReturnPath(
  candidate: string | null | undefined,
): string {
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    containsControlCharacter(candidate)
  ) {
    return fallbackReturnPath;
  }

  try {
    const parsed = new URL(candidate, 'https://checkout.hospedfree.invalid');
    const isAllowed = allowedReturnPaths.some(
      path =>
        parsed.pathname === path || parsed.pathname.startsWith(`${path}/`),
    );

    if (!isAllowed) return fallbackReturnPath;

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackReturnPath;
  }
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some(character => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function withCheckoutReturnPath(
  path: string,
  returnPath: string,
): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}returnTo=${encodeURIComponent(returnPath)}`;
}

export function getSafeHostingOrderReference(
  candidate: string | null | undefined,
): string | undefined {
  return candidate &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate,
    )
    ? candidate.toLowerCase()
    : undefined;
}

export function withHostingOrderReference(
  path: string,
  hostingOrder?: string,
): string {
  if (!hostingOrder) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}hostingOrder=${encodeURIComponent(hostingOrder)}`;
}

export function getSafePremiumPurchaseReference(
  candidate: string | null | undefined,
): string | undefined {
  return getSafeHostingOrderReference(candidate);
}

export function withPremiumPurchaseReference(
  path: string,
  premiumPurchase?: string,
): string {
  if (!premiumPurchase) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}premiumPurchase=${encodeURIComponent(premiumPurchase)}`;
}
