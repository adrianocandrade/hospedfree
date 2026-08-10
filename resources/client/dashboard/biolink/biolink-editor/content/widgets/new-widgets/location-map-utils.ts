export type MapDestinationProvider =
  | 'google'
  | 'waze'
  | 'openstreetmap'
  | 'custom';

interface MapDestinationOptions {
  provider?: MapDestinationProvider;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  customUrl?: string;
}

export function buildMapDestinationUrl({
  provider,
  address,
  latitude,
  longitude,
  customUrl,
}: MapDestinationOptions): string | undefined {
  const coordinates = parseCoordinates(latitude, longitude);
  const query = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : address?.trim();

  // Widgets created before provider selection existed preserve their URL and
  // historical Google Maps fallback.
  if (!provider) {
    return customUrl || buildGoogleMapsUrl(query);
  }

  if (provider === 'custom') {
    return customUrl?.trim() || undefined;
  }

  if (!query) {
    return undefined;
  }

  if (provider === 'waze') {
    const url = new URL('https://waze.com/ul');
    if (coordinates) {
      url.searchParams.set(
        'll',
        `${coordinates.latitude},${coordinates.longitude}`,
      );
    } else {
      url.searchParams.set('q', query);
    }
    url.searchParams.set('navigate', 'yes');
    url.searchParams.set('utm_source', 'meulinkbio');
    return url.toString();
  }

  if (provider === 'openstreetmap') {
    if (!coordinates) {
      const url = new URL('https://www.openstreetmap.org/search');
      url.searchParams.set('query', query);
      return url.toString();
    }

    const url = new URL('https://www.openstreetmap.org/');
    url.searchParams.set('mlat', coordinates.latitude);
    url.searchParams.set('mlon', coordinates.longitude);
    url.hash = `map=17/${coordinates.latitude}/${coordinates.longitude}`;
    return url.toString();
  }

  return buildGoogleMapsUrl(query);
}

export function parseCoordinates(
  latitude: string | number | undefined,
  longitude: string | number | undefined,
): {latitude: string; longitude: string} | null {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: formatCoordinate(parsedLatitude),
    longitude: formatCoordinate(parsedLongitude),
  };
}

function buildGoogleMapsUrl(query?: string): string | undefined {
  if (!query) {
    return undefined;
  }

  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', query);
  return url.toString();
}

function formatCoordinate(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, '');
}
