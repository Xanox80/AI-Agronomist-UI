import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthApi, UserDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { ShellComponent } from './shell.component';

const scoutToken = `h.${btoa(JSON.stringify({ role: 'scout' }))}.s`;
const user = { displayName: 'Olena', role: 'scout' } as UserDto;

describe('ShellComponent', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), { provide: AuthApi, useValue: { me: () => of(user) } }],
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

  it('collapses the sidebar on toggle', () => {
    const fixture = render();
    fixture.nativeElement.querySelector('.shell__toggle button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell--collapsed')).not.toBeNull();
  });
});
