import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { DisplayPreferences } from './display-preferences.service';
import { SUN_MODE_STORAGE_KEY } from './shell.config';

function create(): DisplayPreferences {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  return TestBed.inject(DisplayPreferences);
}

describe('DisplayPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('defaults to Ukrainian without sun mode', () => {
    const prefs = create();
    expect(prefs.locale()).toBe('uk');
    expect(prefs.sunMode()).toBe(false);
  });

  it('switches the language, persists it and ignores unsupported locales', () => {
    const prefs = create();
    prefs.setLocale('en');
    prefs.setLocale('de');
    expect(prefs.locale()).toBe('en');
    expect(TestBed.inject(TranslateService).currentLang).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(create().locale()).toBe('en');
  });

  it('toggles the sun theme on the document and remembers it', () => {
    const prefs = create();
    prefs.toggleSunMode();
    expect(document.documentElement.dataset['theme']).toBe('sun');
    expect(localStorage.getItem(SUN_MODE_STORAGE_KEY)).toBe('true');
    expect(create().sunMode()).toBe(true);
    TestBed.inject(DisplayPreferences).toggleSunMode();
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });
});
