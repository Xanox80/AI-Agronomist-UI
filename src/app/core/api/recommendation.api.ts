import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  AutoApproveSettingDto, AutoApproveSettingInput, CreateRecommendationRequest, RecomputeRecommendationRequest,
  RecommendationDto, RejectRecommendationRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class RecommendationApi extends ApiClient {
  create(body: CreateRecommendationRequest): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(this.url('/recommendations'), body);
  }

  get(id: string): Observable<RecommendationDto> {
    return this.http.get<RecommendationDto>(this.url(`/recommendations/${id}`));
  }

  listForObservation(observationId: string): Observable<RecommendationDto[]> {
    return this.http.get<RecommendationDto[]>(this.url(`/observations/${observationId}/recommendations`));
  }

  approve(id: string): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(this.url(`/recommendations/${id}/approve`), {});
  }

  reject(id: string, body: RejectRecommendationRequest): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(this.url(`/recommendations/${id}/reject`), body);
  }

  recompute(id: string, body: RecomputeRecommendationRequest = {}): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(this.url(`/recommendations/${id}/recompute`), body);
  }

  autoApproveSettings(): Observable<AutoApproveSettingDto[]> {
    return this.http.get<AutoApproveSettingDto[]>(this.url('/auto-approve-settings'));
  }

  saveAutoApproveSetting(body: AutoApproveSettingInput): Observable<AutoApproveSettingDto> {
    return this.http.put<AutoApproveSettingDto>(this.url('/auto-approve-settings'), body);
  }

  removeAutoApproveSetting(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/auto-approve-settings/${id}`));
  }
}
