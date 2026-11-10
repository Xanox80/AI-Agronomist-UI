import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthSession } from '../../core/auth/auth-session.service';
import { AutoApproveService } from './auto-approve.service';
import { PrivacyService } from './privacy.service';
import { RegionPackService } from './region-pack.service';
import { SettingsComponent } from './settings.component';

function render(role: string) {
  const privacy = { geoCollectionEnabled: signal(true), saveFailed: signal(false), load: vi.fn(), setGeoCollection: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService(),
      provideRouter([]),
      { provide: AuthSession, useValue: { role: () => role } },
      { provide: PrivacyService, useValue: privacy },
      {
        provide: RegionPackService,
        useValue: {
          regionCodes: ['A'], region: signal('A'), status: signal(null), refreshedVersion: signal(null), failed: signal(false),
          load: vi.fn(), selectRegion: vi.fn(), refresh: vi.fn(),
        },
      },
      {
        provide: AutoApproveService,
        useValue: { categories: ['disease', 'pest'], enabledCategories: signal(new Set()), saveFailed: signal(false), load: vi.fn(), setEnabled: vi.fn() },
      },
    ],
  });
  const fixture = TestBed.createComponent(SettingsComponent);
  fixture.detectChanges();
  return { fixture, privacy };
}

describe('SettingsComponent', () => {
  it('loads the privacy flag on init', () => {
    const { privacy } = render('scout');
    expect(privacy.load).toHaveBeenCalled();
  });

  it('shows auto-approve toggles to the chief agronomist only', () => {
    const chief = render('chief_agronomist').fixture;
    expect(chief.nativeElement.querySelector('app-auto-approve-panel')).not.toBeNull();
    TestBed.resetTestingModule();
    const scout = render('scout').fixture;
    expect(scout.nativeElement.querySelector('app-auto-approve-panel')).toBeNull();
  });
});
