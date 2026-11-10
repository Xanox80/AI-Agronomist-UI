import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import { HealthDto, SyncPullResponse, SyncPushRequest, SyncPushResponse, SyncStatusDto } from './models';

@Injectable({ providedIn: 'root' })
export class SyncApi extends ApiClient {
  push(body: SyncPushRequest): Observable<SyncPushResponse> {
    return this.http.post<SyncPushResponse>(this.url('/sync/push'), body);
  }

  pull(deviceId: string, since?: string, cursor?: string): Observable<SyncPullResponse> {
    return this.http.get<SyncPullResponse>(this.url('/sync/pull'), { params: toHttpParams({ deviceId, since, cursor }) });
  }

  status(deviceId: string): Observable<SyncStatusDto> {
    return this.http.get<SyncStatusDto>(this.url('/sync/status'), { params: toHttpParams({ deviceId }) });
  }

  health(): Observable<HealthDto> {
    return this.http.get<HealthDto>(this.url('/health'));
  }
}
