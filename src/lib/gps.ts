import * as Location from 'expo-location';
import type { LocationRecord } from '../types';

export type GpsFix = {
  lat: number;
  lng: number;
  accuracyM: number | null;
};

export async function readGpsFix(): Promise<GpsFix | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM: pos.coords.accuracy,
    };
  } catch {
    return null;
  }
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Suggest an onboarded location when GPS accuracy is usable and within geofence. */
export function suggestLocationFromGps(
  fix: GpsFix,
  locations: LocationRecord[],
  maxAccuracyM = 80,
): LocationRecord | null {
  if (fix.accuracyM != null && fix.accuracyM > maxAccuracyM) return null;
  let best: { loc: LocationRecord; dist: number } | null = null;
  for (const loc of locations) {
    if (loc.gpsLat == null || loc.gpsLng == null || loc.gpsRadiusM == null) continue;
    const dist = haversineM(fix.lat, fix.lng, loc.gpsLat, loc.gpsLng);
    if (dist <= loc.gpsRadiusM && (!best || dist < best.dist)) {
      best = { loc, dist };
    }
  }
  return best?.loc ?? null;
}
