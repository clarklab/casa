import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const Route = createFileRoute('/_app/map-demo')({
  component: MapDemoPage,
});

const LAT = 30.3085;
const LNG = -97.8675;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

function MapDemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 safe-area-top">
        <button
          onClick={() => navigate({ to: '/listings' })}
          className="text-casa-600 dark:text-casa-400 font-medium text-sm flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Map Tile Styles</h1>
      </header>

      <div className="p-4 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          9802 Inca Lane, Austin TX 78733
        </p>

        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">CartoDB Voyager</span>
          </div>
          <div className="h-56">
            <MapContainer
              center={[LAT, LNG]}
              zoom={14}
              className="h-full w-full"
              zoomControl={false}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
            >
              <TileLayer url={TILE_URL} />
              <CircleMarker
                center={[LAT, LNG]}
                radius={8}
                pathOptions={{
                  fillColor: '#f03e18',
                  fillOpacity: 1,
                  color: '#fff',
                  weight: 2,
                }}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
