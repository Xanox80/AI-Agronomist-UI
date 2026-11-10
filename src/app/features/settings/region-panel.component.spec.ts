import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthSession } from '../../core/auth/auth-session.service';
import { RegionPackService } from './region-pack.service';
import { RegionPanelComponent } from './region-panel.component';

describe('RegionPanelComponent', () => {
  function render(role: string) {
    const service = {
      regionCodes: ['A'], region: signal('A'), status: signal(null), refreshedVersion: signal(3),
      failed: signal(false), load: vi.fn(), selectRegion: vi.fn(), refresh: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: AuthSession, useValue: { role: () => role } },
        { provide: RegionPackService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(RegionPanelComponent);
    fixture.detectChanges();
    return { fixture, service };
  }

  it('loads the region data on init', () => {
    const { service } = render('chief_agronomist');
    expect(service.load).toHaveBeenCalled();
  });

  it('explains why a non-chief user cannot change the region', () => {
    const chief = render('chief_agronomist').fixture;
    const chiefHints = chief.nativeElement.querySelectorAll('p.hint').length;
    TestBed.resetTestingModule();
    const scout = render('scout').fixture;
    expect(scout.nativeElement.querySelectorAll('p.hint').length).toBe(chiefHints + 1);
  });

  it('refreshes the pack from the button', () => {
    const { fixture, service } = render('scout');
    (fixture.nativeElement.querySelector('p-button button') as HTMLButtonElement).click();
    expect(service.refresh).toHaveBeenCalled();
  });
});
