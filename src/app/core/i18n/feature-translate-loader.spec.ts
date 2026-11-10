import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeatureTranslateLoader, mergeDeep } from './feature-translate-loader';

describe('FeatureTranslateLoader', () => {
  let http: HttpTestingController;
  let loader: FeatureTranslateLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    loader = new FeatureTranslateLoader(TestBed.inject(HttpClient), '/i18n/', ['fields', 'tasks']);
  });

  it('merges the common file with every feature file', () => {
    let result: unknown;
    loader.getTranslation('uk').subscribe((value) => (result = value));

    http.expectOne('/i18n/uk.json').flush({ common: { save: 'Зберегти' } });
    http.expectOne('/i18n/fields/uk.json').flush({ fields: { title: 'Поля' } });
    http.expectOne('/i18n/tasks/uk.json').flush({ tasks: { title: 'Завдання' } });

    expect(result).toEqual({
      common: { save: 'Зберегти' },
      fields: { title: 'Поля' },
      tasks: { title: 'Завдання' },
    });
  });

  it('skips a feature file that fails to load', () => {
    let result: unknown;
    loader.getTranslation('en').subscribe((value) => (result = value));

    http.expectOne('/i18n/en.json').flush({ common: { save: 'Save' } });
    http.expectOne('/i18n/fields/en.json').flush('missing', { status: 404, statusText: 'Not Found' });
    http.expectOne('/i18n/tasks/en.json').flush({ tasks: { title: 'Tasks' } });

    expect(result).toEqual({ common: { save: 'Save' }, tasks: { title: 'Tasks' } });
  });

  it('merges nested keys of the same namespace without dropping siblings', () => {
    expect(mergeDeep({ a: { x: '1' } }, { a: { y: '2' } })).toEqual({ a: { x: '1', y: '2' } });
  });
});
