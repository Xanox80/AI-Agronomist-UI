import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthApi, UserDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { SyncService } from '../../core/offline/sync.service';
import { ShellComponent } from './shell.component';

const scoutToken = `h.${btoa(JSON.stringify({ role: 'scout' }))}.s`;
const user = { displayName: 'Olena', role: 'scout' } as UserDto;

describe('ShellComponent', () => {
  const pendingCount = signal(0);
  const online = signal(true);

  function render() {
    localStorage.clear();
    pendingCount.set(0);
    online.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: AuthApi, useValue: { me: () => of(user) } },
        { provide: SyncService, useValue: { pendingCount } },
        { provide: ConnectivityService, useValue: { online } },
      ],
    });
    TestBed.inject(AuthSession).start({ accessToken: scoutToken });
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('hosts the routed feature in a router outlet', () => {
    expect(render().nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('lists only the navigation entries allowed for the role', () => {
    const links: HTMLAnchorElement[] = Array.from(render().nativeElement.querySelectorAll('nav a'));
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/scouting');
    expect(hrefs).not.toContain('/catalog-admin');
  });

  it('shows the signed-in user name in the header', () => {
    expect(render().nativeElement.querySelector('.shell__user').textContent).toContain('Olena');
  });

  it('collapses the sidebar on toggle and reports the state on the real button', () => {
    const fixture = render();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.shell__toggle button');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell--collapsed')).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('hides the status chips while online with nothing waiting to upload', () => {
    expect(render().nativeElement.querySelector('.shell__chip')).toBeNull();
  });

  it('shows the offline chip and the pending-upload count linking to the sync status', () => {
    const fixture = render();
    online.set(false);
    pendingCount.set(3);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.shell__chip--offline')?.textContent).toContain('common.offline');
    const pending = root.querySelector('.shell__chip--pending');
    expect(pending?.textContent).toContain('3');
    expect(pending?.getAttribute('href')).toBe('/home');
    expect(pending?.getAttribute('aria-label')).toBe('shell.pendingUploads');
  });
});
