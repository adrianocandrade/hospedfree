import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import L, {type Map as LeafletMapInstance, type Marker} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {MapPinIcon, RotateCcwIcon} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';

interface LeafletMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  zoom?: number;
  fallbackZoom?: number;
  onPositionChange?: (latitude: number, longitude: number) => void;
}

const BRAZIL_CENTER: L.LatLngExpression = [-14.235, -51.9253];

const markerIcon = L.divIcon({
  className: '',
  html: `
    <span style="
      display:flex;
      width:36px;
      height:36px;
      align-items:center;
      justify-content:center;
      border:3px solid white;
      border-radius:9999px 9999px 9999px 4px;
      background:#2563eb;
      box-shadow:0 5px 14px rgb(15 23 42 / 35%);
      color:white;
      transform:rotate(-45deg);
    ">
      <span style="
        display:block;
        width:10px;
        height:10px;
        border-radius:9999px;
        background:currentColor;
      "></span>
    </span>
  `,
  iconAnchor: [18, 34],
  iconSize: [36, 36],
});

export function LeafletMap({
  latitude,
  longitude,
  address,
  className,
  zoom = 16,
  fallbackZoom = 4,
  onPositionChange,
}: LeafletMapProps) {
  const {trans} = useTrans();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const positionChangeRef = useRef(onPositionChange);
  const initialViewRef = useRef({
    fallbackZoom,
    latitude,
    longitude,
    zoom,
  });
  const [retryKey, setRetryKey] = useState(0);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  positionChangeRef.current = onPositionChange;
  initialViewRef.current = {fallbackZoom, latitude, longitude, zoom};

  const hasPosition = isValidPosition(latitude, longitude);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    setTilesUnavailable(false);

    const initialView = initialViewRef.current;
    const hasInitialPosition = isValidPosition(
      initialView.latitude,
      initialView.longitude,
    );
    const initialPosition: L.LatLngExpression = hasInitialPosition
      ? [initialView.latitude!, initialView.longitude!]
      : BRAZIL_CENTER;
    const map = L.map(containerRef.current, {
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView(
      initialPosition,
      hasInitialPosition ? initialView.zoom : initialView.fallbackZoom,
    );

    let loadedTile = false;
    let failedTiles = 0;
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    );

    tileLayer.on('tileload', () => {
      loadedTile = true;
      setTilesUnavailable(false);
    });
    tileLayer.on('tileerror', () => {
      failedTiles += 1;
      if (!loadedTile && failedTiles >= 4) {
        setTilesUnavailable(true);
      }
    });
    tileLayer.addTo(map);

    map.on('click', event => {
      positionChangeRef.current?.(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [retryKey]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !hasPosition) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const position: L.LatLngExpression = [latitude!, longitude!];
    const nextLatLng = L.latLng(position);
    const positionChanged =
      !markerRef.current || !markerRef.current.getLatLng().equals(nextLatLng);

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, {icon: markerIcon}).addTo(map);
    }

    if (address) {
      const popupContent = document.createElement('div');
      popupContent.className = 'max-w-56 text-sm font-medium leading-snug';
      popupContent.textContent = address;
      markerRef.current.bindPopup(popupContent);
    } else {
      markerRef.current.unbindPopup();
    }

    if (positionChanged) {
      map.setView(position, zoom, {animate: false});
    }
  }, [address, hasPosition, latitude, longitude, retryKey, zoom]);

  return (
    <div
      className={cn(
        'relative isolate min-h-52 overflow-hidden bg-muted',
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-full min-h-52 w-full"
        aria-label={
          onPositionChange
            ? trans(message('Select a position on the map'))
            : address || trans(message('Location map'))
        }
      />
      {tilesUnavailable ? (
        <div className="absolute inset-0 z-[900] flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center text-foreground">
          <MapPinIcon className="size-8 text-muted-foreground" />
          <div>
            <div className="text-sm font-semibold">
              <Trans message="Map unavailable" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <Trans message="Check your connection or enter the coordinates manually." />
            </div>
          </div>
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-input border bg-background px-4 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => setRetryKey(value => value + 1)}
          >
            <RotateCcwIcon className="size-4" />
            <Trans message="Try again" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function isValidPosition(
  latitude: number | undefined,
  longitude: number | undefined,
): latitude is number {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude! >= -90 &&
    latitude! <= 90 &&
    longitude! >= -180 &&
    longitude! <= 180
  );
}
