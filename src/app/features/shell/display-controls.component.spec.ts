import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DisplayControlsComponent } from './display-controls.component';
import { DisplayPreferences } from './display-preferences.service';

describe('DisplayControlsComponent', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const prefs = TestBed.inject(DisplayPreferences);
    const fixture = TestBed.createComponent(DisplayControlsComponent);
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    return { prefs, fixture, buttons };
  }

  it('switches language and sun mode through the preferences service', () => {
    const { prefs, buttons } = render();
    expect(buttons.length).toBe(prefs.locales.length + 1);
    buttons[1].click();
    buttons[buttons.length - 1].click();

    expect(prefs.locale()).toBe(prefs.locales[1]);
    expect(prefs.sunMode()).toBe(true);
    prefs.toggleSunMode();
  });

  it('announces the pressed state on the focusable buttons', () => {
    const { prefs, fixture, buttons } = render();
    const sun = buttons[buttons.length - 1];
    expect(buttons[0].getAttribute('aria-pressed')).toBe(String(prefs.locale() === prefs.locales[0]));
    expect(sun.getAttribute('aria-pressed')).toBe('false');
    sun.click();
    fixture.detectChanges();
    expect(sun.getAttribute('aria-pressed')).toBe('true');
    prefs.toggleSunMode();
  });
});
