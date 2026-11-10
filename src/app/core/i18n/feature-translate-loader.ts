import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

/** Loads assets/i18n/<lang>.json plus assets/i18n/<feature>/<lang>.json for every feature and merges them. */
export class FeatureTranslateLoader implements TranslateLoader {
  constructor(
    private readonly http: HttpClient,
    private readonly prefix: string,
    private readonly features: readonly string[],
  ) {}

  getTranslation(lang: string): Observable<TranslationObject> {
    const folders = ['', ...this.features.map((feature) => `${feature}/`)];
    const requests = folders.map((folder) =>
      this.http.get<TranslationObject>(`${this.prefix}${folder}${lang}.json`).pipe(catchError(() => of({}))),
    );
    return forkJoin(requests).pipe(map((parts) => parts.reduce(mergeDeep, {})));
  }
}

export function mergeDeep(target: TranslationObject, source: TranslationObject): TranslationObject {
  const result: TranslationObject = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    result[key] = isObject(existing) && isObject(value) ? mergeDeep(existing, value) : value;
  }
  return result;
}

function isObject(value: unknown): value is TranslationObject {
  return typeof value === 'object' && value !== null;
}
