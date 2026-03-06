import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDrivingRoute } from '@/hooks/useDrivingRoute';
import { FRIENDS_LOCATION } from '@/lib/constants';
import { haversineDistance } from '@/lib/geo';
import { formatDistance, formatDrivingTime } from '@/lib/format';
import { useEffect } from 'react';

interface FriendsDistanceCardProps {
  latitude: number;
  longitude: number;
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, bounds]);
  return null;
}

export function FriendsDistanceCard({ latitude, longitude }: FriendsDistanceCardProps) {
  const { data: route, isLoading, isError } = useDrivingRoute(
    latitude,
    longitude,
    FRIENDS_LOCATION.latitude,
    FRIENDS_LOCATION.longitude,
  );

  const straightLine = haversineDistance(
    latitude,
    longitude,
    FRIENDS_LOCATION.latitude,
    FRIENDS_LOCATION.longitude,
  );

  const bounds: L.LatLngBoundsExpression = [
    [latitude, longitude],
    [FRIENDS_LOCATION.latitude, FRIENDS_LOCATION.longitude],
  ];

  const distanceText = route ? formatDistance(route.distanceMiles) : formatDistance(straightLine);
  const durationText = route ? formatDrivingTime(route.durationSeconds) : null;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Distance to Friends
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">{distanceText}</span>
            {durationText && (
              <span className="text-slate-500 dark:text-slate-400">· {durationText} drive</span>
            )}
            {isLoading && (
              <span className="text-slate-400 text-xs">loading route…</span>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-56 relative">
        <MapContainer
          center={[latitude, longitude]}
          zoom={11}
          className="h-full w-full"
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FitBounds bounds={bounds} />

          {/* Driving route polyline */}
          {route && (
            <Polyline
              positions={route.geometry}
              pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
            />
          )}

          {/* Listing marker */}
          <CircleMarker
            center={[latitude, longitude]}
            radius={7}
            pathOptions={{
              fillColor: '#f03e18',
              fillOpacity: 1,
              color: '#fff',
              weight: 2,
            }}
          />

          {/* Friends marker */}
          <CircleMarker
            center={[FRIENDS_LOCATION.latitude, FRIENDS_LOCATION.longitude]}
            radius={7}
            pathOptions={{
              fillColor: '#10b981',
              fillOpacity: 1,
              color: '#fff',
              weight: 2,
            }}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-casa-600 inline-block" />
          Listing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          {FRIENDS_LOCATION.label}
        </span>
        {isError && (
          <span className="ml-auto text-amber-500">Straight-line (route unavailable)</span>
        )}
      </div>
    </div>
  );
}
