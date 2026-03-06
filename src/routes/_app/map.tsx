import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useListings } from '@/hooks/useListings';
import { useFilters } from '@/hooks/useFilters';
import { applyFilters } from '@/lib/filters';
import { formatPrice, formatPriceFull } from '@/lib/format';
import { api } from '@/lib/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import type { ListingSummary } from '@/lib/types';

export const Route = createFileRoute('/_app/map')({
  component: MapPage,
});

function createPriceIcon(listing: ListingSummary, isSelected: boolean) {
  const bgColor = isSelected ? '#f03e18' : '#ffe8e1';
  const textColor = isSelected ? '#ffffff' : '#f03e18';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="price-pill${isSelected ? ' price-pill--active' : ''}" style="
      background:${bgColor}; color:${textColor};
      border:2px solid #f03e18;
    ">${formatPrice(listing.price)}</div>`,
    iconSize: [60, 32],
    iconAnchor: [30, 32],
  });
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="cluster-pill">${count} home${count !== 1 ? 's' : ''}</div>`,
    iconSize: [80, 32],
    iconAnchor: [40, 16],
  });
}

function MapController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 14, { duration: 0.8 });
  }, [target, map]);
  return null;
}

function MapPage() {
  const navigate = useNavigate();
  const { data: listings } = useListings();
  const { filters } = useFilters();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeListings = useMemo(() => {
    const base = listings?.filter((l) => !l.isArchived) || [];
    return applyFilters(base, filters);
  }, [listings, filters]);

  const mappable = useMemo(
    () => activeListings.filter((l) => l.latitude && l.longitude),
    [activeListings],
  );

  // Reset selection when listings change
  useEffect(() => {
    setSelectedIndex(null);
  }, [mappable.length]);

  const selected = selectedIndex !== null ? mappable[selectedIndex] : null;

  const flyTarget: [number, number] | null = selected
    ? [selected.latitude, selected.longitude]
    : null;

  // Calculate center from listings, or use default
  const center = useMemo(() => {
    if (mappable.length === 0) return DEFAULT_MAP_CENTER;
    const avgLat = mappable.reduce((s, l) => s + l.latitude, 0) / mappable.length;
    const avgLng = mappable.reduce((s, l) => s + l.longitude, 0) / mappable.length;
    return [avgLng, avgLat] as [number, number];
  }, [mappable]);

  function selectByIndex(idx: number) {
    setSelectedIndex(idx);
  }

  function goPrev() {
    if (mappable.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === 0 ? mappable.length - 1 : prev - 1,
    );
  }

  function goNext() {
    if (mappable.length === 0) return;
    setSelectedIndex((prev) =>
      prev === null || prev === mappable.length - 1 ? 0 : prev + 1,
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between safe-area-top z-[1000]">
        <button
          onClick={() => navigate({ to: '/listings' })}
          className="text-casa-600 dark:text-casa-400 font-medium text-sm flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          List
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Map</h1>
        <span className="text-xs text-slate-400">{activeListings.length} homes</span>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[center[1] || DEFAULT_MAP_CENTER[1], center[0] || DEFAULT_MAP_CENTER[0]]}
          zoom={DEFAULT_MAP_ZOOM}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController target={flyTarget} />
          <MarkerClusterGroup
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            zoomToBoundsOnClick
          >
            {mappable.map((listing, idx) => (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={createPriceIcon(listing, selectedIndex === idx)}
                eventHandlers={{
                  click: () => selectByIndex(idx),
                }}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Bottom card + nav */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Nav arrows + card */}
              <div className="flex items-stretch">
                {/* Prev button */}
                <button
                  onClick={goPrev}
                  className="flex items-center justify-center px-3 text-slate-400 hover:text-casa-500 active:bg-slate-100 dark:active:bg-slate-800 transition-colors border-r border-slate-200 dark:border-slate-700"
                  aria-label="Previous listing"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Card content */}
                <div
                  onClick={() => navigate({ to: '/listings/$id', params: { id: selected.id } })}
                  className="flex-1 flex items-center cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors min-w-0"
                >
                  {selected.imageKeys[0] && (
                    <img
                      src={api.getImageUrl(selected.imageKeys[0])}
                      alt={selected.address}
                      className="w-20 h-20 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="p-3 flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {formatPriceFull(selected.price)}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{selected.address}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selected.bedrooms} bd · {selected.bathrooms} ba · {selected.sqft.toLocaleString()} sqft
                    </p>
                  </div>
                </div>

                {/* Next button */}
                <button
                  onClick={goNext}
                  className="flex items-center justify-center px-3 text-slate-400 hover:text-casa-500 active:bg-slate-100 dark:active:bg-slate-800 transition-colors border-l border-slate-200 dark:border-slate-700"
                  aria-label="Next listing"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              </div>

              {/* Counter */}
              <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-1 border-t border-slate-100 dark:border-slate-800">
                {selectedIndex! + 1} of {mappable.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
