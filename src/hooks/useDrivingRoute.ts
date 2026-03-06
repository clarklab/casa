import { useQuery } from '@tanstack/react-query';

interface DrivingRoute {
  geometry: [number, number][]; // [lat, lng] pairs for Leaflet
  distanceMiles: number;
  durationSeconds: number;
}

export function useDrivingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  return useQuery<DrivingRoute>({
    queryKey: ['driving-route', fromLat, fromLng, toLat, toLng],
    queryFn: async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM request failed');
      const data = await res.json();
      const route = data.routes[0];
      // GeoJSON is [lng, lat] — flip to [lat, lng] for Leaflet
      const geometry: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );
      return {
        geometry,
        distanceMiles: route.distance * 0.000621371,
        durationSeconds: route.duration,
      };
    },
    staleTime: Infinity,
    retry: 1,
  });
}
