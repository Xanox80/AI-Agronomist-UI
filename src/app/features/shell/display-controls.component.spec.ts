import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DisplayControlsComponent } from './display-controls.component';
import { DisplayPreferences } from './display-preferences.service';

describe('DisplayControlsComponent', () => {
  it('switches language and sun mode through the preferences service', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const prefs = TestBed.inject(DisplayPreferences);
    const fixture = TestBed.createComponent(DisplayControlsComponent);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.length).toBe(prefs.locales.length + 1);
    buttons[1].click();
    buttons[buttons.length - 1].click();

    expect(prefs.locale()).toBe(prefs.locales[1]);
    expect(prefs.sunMode()).toBe(true);
    prefs.toggleSunMode();
  });
});
