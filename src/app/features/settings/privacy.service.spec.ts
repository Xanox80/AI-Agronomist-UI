import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { PrivacyService } from './privacy.service';

describe('PrivacyService', () => {
  const api = { me: vi.fn(), updateMe: vi.fn() };
  let service: PrivacyService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: api }] });
    service = TestBed.inject(PrivacyService);
  });

  it('reads the geolocation flag from the profile', async () => {
    api.me.mockReturnValue(of({ geoCollectionEnabled: false }));
    await service.load();
    expect(service.geoCollectionEnabled()).toBe(false);
  });

  it('sends the opt-out to the profile and mirrors the saved value', async () => {
    api.updateMe.mockReturnValue(of({ geoCollectionEnabled: false }));
    await service.setGeoCollection(false);
    expect(api.updateMe).toHaveBeenCalledWith({ geoCollectionEnabled: false });
    expect(service.geoCollectionEnabled()).toBe(false);
  });

  it('restores the previous value and flags the failure when the save fails', async () => {
    api.updateMe.mockReturnValue(throwError(() => new Error('offline')));
    await service.setGeoCollection(false);
    expect(service.geoCollectionEnabled()).toBe(true);
    expect(service.saveFailed()).toBe(true);
  });

  it('keeps the opt-out on the device so a later offline start still honours it', async () => {
    api.me.mockReturnValue(of({ geoCollectionEnabled: false }));
    await service.load();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: api }] });
    expect(TestBed.inject(PrivacyService).geoCollectionEnabled()).toBe(false);
  });
});
