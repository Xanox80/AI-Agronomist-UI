import { InjectionToken } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiParams } from './models/common';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});

/** Builds query params, dropping undefined and null values. */
export function toHttpParams(params: object = {}): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(params as ApiParams)) {
    if (value !== undefined && value !== null) {
      result = result.set(key, String(value));
    }
  }
  return result;
}

export function toFormData(fields: Record<string, Blob | string | number | object>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    const isPlain = typeof value === 'string' || value instanceof Blob;
    form.append(key, isPlain ? value : JSON.stringify(value));
  }
  return form;
}
