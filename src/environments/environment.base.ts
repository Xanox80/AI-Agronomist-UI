export const baseEnvironment = {
  apiBaseUrl: '/api/v1',
  defaultLocale: 'uk',
  supportedLocales: ['uk', 'en'],
  qualityGate: {
    minLaplacianVariance: 100,
    exposureMin: 0.15,
    exposureMax: 0.85,
    minPlantCoverage: 0.2,
    minObjectFraction: 0.05,
    maxImageEdgePx: 1600,
  },
  sync: {
    pollIntervalMs: 30000,
    backoff: { baseMs: 2000, maxMs: 300000, factor: 2 },
  },
  map: {
    defaultCenter: { lat: 49.0, lng: 31.5 },
    defaultZoom: 6,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  maxPhotos: 3,
  authStorageKey: 'ap-scout.auth',
  localeStorageKey: 'ap-scout.locale',
};

export type Environment = typeof baseEnvironment & { production: boolean };
