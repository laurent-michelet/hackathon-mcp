export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// API Adresse (data.gouv.fr) — gratuit, sans clé, couverture France uniquement.
// Docs : https://adresse.data.gouv.fr/api-doc/adresse
export async function geocode(address: string): Promise<LatLng | null> {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "shopopop-mcp/0.1 (hackathon)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;
  const [longitude, latitude] = coords;
  return { latitude, longitude };
}
