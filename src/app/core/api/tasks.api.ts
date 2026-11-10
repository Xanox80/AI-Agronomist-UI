import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import {
  CompleteTaskRequest, CreateTreatmentRequest, Page, TaskDto, TaskInput, TaskPatch, TasksQuery, TreatmentDto,
  TreatmentsQuery,
} from './models';

@Injectable({ providedIn: 'root' })
export class TasksApi extends ApiClient {
  list(query: TasksQuery = {}): Observable<Page<TaskDto>> {
    return this.http.get<Page<TaskDto>>(this.url('/tasks'), { params: toHttpParams(query) });
  }

  get(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(this.url(`/tasks/${id}`));
  }

  create(body: TaskInput): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.url('/tasks'), body);
  }

  update(id: string, body: TaskPatch): Observable<TaskDto> {
    return this.http.patch<TaskDto>(this.url(`/tasks/${id}`), body);
  }

  complete(id: string, body: CompleteTaskRequest = {}): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.url(`/tasks/${id}/complete`), body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/tasks/${id}`));
  }

  treatments(query: TreatmentsQuery = {}): Observable<Page<TreatmentDto>> {
    return this.http.get<Page<TreatmentDto>>(this.url('/treatments'), { params: toHttpParams(query) });
  }

  createTreatment(body: CreateTreatmentRequest): Observable<TreatmentDto> {
    return this.http.post<TreatmentDto>(this.url('/treatments'), body);
  }
}
