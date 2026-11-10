import { GeolocationService } from './geolocation.service';

function stubGeolocation(getCurrentPosition: Geolocation['getCurrentPosition']): void {
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
}

describe('GeolocationService', () => {
  it('maps the browser position to a fix', async () => {
    stubGeolocation((success) =>
      success({ coords: { latitude: 49.1, longitude: 31.2, accuracy: 7 } } as GeolocationPosition),
    );
    expect(await new GeolocationService().locate()).toEqual({ lat: 49.1, lng: 31.2, accuracyM: 7 });
  });

  it('resolves null when the permission is denied', async () => {
    stubGeolocation((_success, error) => error?.({} as GeolocationPositionError));
    expect(await new GeolocationService().locate()).toBeNull();
  });
});
