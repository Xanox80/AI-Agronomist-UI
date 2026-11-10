import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let login: ReturnType<typeof vi.fn>;

  async function render() {
    login = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), { provide: AuthService, useValue: { login } }],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function submit(fixture: Awaited<ReturnType<typeof render>>, email: string, password: string) {
    const root: HTMLElement = fixture.nativeElement;
    const emailInput = root.querySelector<HTMLInputElement>('#email')!;
    const passwordInput = root.querySelector<HTMLInputElement>('#password')!;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders the title and both credential fields', async () => {
    const root: HTMLElement = (await render()).nativeElement;
    expect(root.querySelector('h1')).not.toBeNull();
    expect(root.querySelector('#email')).not.toBeNull();
    expect(root.querySelector('#password')).not.toBeNull();
  });

  it('signs in with the typed credentials and opens the home page', async () => {
    const fixture = await render();
    login.mockReturnValue(of({}));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await submit(fixture, 'a@b.c', 'secret');
    expect(login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret' });
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows an invalid-credentials message on a 401', async () => {
    const fixture = await render();
    login.mockReturnValue(throwError(() => ({ statusCode: 401 })));
    await submit(fixture, 'a@b.c', 'bad');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('auth.invalidCredentials');
  });

  it('shows a rate-limit message on a 429', async () => {
    const fixture = await render();
    login.mockReturnValue(throwError(() => ({ statusCode: 429 })));
    await submit(fixture, 'a@b.c', 'bad');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('auth.tooManyAttempts');
  });
});
