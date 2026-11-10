import { Injectable } from '@angular/core';
import { SCOUTING_CONFIG } from './scouting.config';
import { GeoFix } from './scouting.types';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  locate(): Promise<GeoFix | null> {
    const geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) return Promise.resolve(null);
    const { enableHighAccuracy, timeoutMs, maximumAgeMs } = SCOUTING_CONFIG.geolocation;
    return new Promise((resolve) =>
      geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy, timeout: timeoutMs, maximumAge: maximumAgeMs },
      ),
    );
  }
}
