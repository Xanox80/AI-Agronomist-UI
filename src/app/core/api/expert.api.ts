import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import {
  CreateLabelRequest, DatasetStatsDto, ExpertCaseDto, ExpertCasesQuery, FeedbackRequest, LabelDto, Page,
  ResolveCaseRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class ExpertApi extends ApiClient {
  cases(query: ExpertCasesQuery = {}): Observable<Page<ExpertCaseDto>> {
    return this.http.get<Page<ExpertCaseDto>>(this.url('/expert/cases'), { params: toHttpParams(query) });
  }

  getCase(id: string): Observable<ExpertCaseDto> {
    return this.http.get<ExpertCaseDto>(this.url(`/expert/cases/${id}`));
  }

  claim(id: string): Observable<ExpertCaseDto> {
    return this.http.post<ExpertCaseDto>(this.url(`/expert/cases/${id}/claim`), {});
  }

  addLabel(id: string, body: CreateLabelRequest): Observable<LabelDto> {
    return this.http.post<LabelDto>(this.url(`/expert/cases/${id}/labels`), body);
  }

  resolve(id: string, body: ResolveCaseRequest): Observable<ExpertCaseDto> {
    return this.http.post<ExpertCaseDto>(this.url(`/expert/cases/${id}/resolve`), body);
  }

  sendFeedback(body: FeedbackRequest): Observable<void> {
    return this.http.post<void>(this.url('/feedback'), body);
  }

  datasetStats(): Observable<DatasetStatsDto> {
    return this.http.get<DatasetStatsDto>(this.url('/expert/dataset/stats'));
  }

  exportDataset(since?: string): Observable<Blob> {
    return this.http.get(this.url('/expert/dataset/export'), { params: toHttpParams({ since }), responseType: 'blob' });
  }
}
