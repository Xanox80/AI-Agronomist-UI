import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from './api-base-url';

/** Shared plumbing for the per-module API clients. */
export abstract class ApiClient {
  protected readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
