import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toFormData, toHttpParams } from './api-base-url';
import {
  ConfirmObservationRequest, ObservationDto, ObservationInput, ObservationPatch, ObservationsQuery, Page, PhotoDto,
  PhotoUploadRequest, VoiceNoteDto, VoiceNoteUploadRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class ObservationsApi extends ApiClient {
  create(body: ObservationInput): Observable<ObservationDto> {
    return this.http.post<ObservationDto>(this.url('/observations'), body);
  }

  list(query: ObservationsQuery = {}): Observable<Page<ObservationDto>> {
    return this.http.get<Page<ObservationDto>>(this.url('/observations'), { params: toHttpParams(query) });
  }

  get(id: string): Observable<ObservationDto> {
    return this.http.get<ObservationDto>(this.url(`/observations/${id}`));
  }

  update(id: string, body: ObservationPatch): Observable<ObservationDto> {
    return this.http.patch<ObservationDto>(this.url(`/observations/${id}`), body);
  }

  uploadPhoto(observationId: string, request: PhotoUploadRequest): Observable<PhotoDto> {
    return this.http.post<PhotoDto>(this.url(`/observations/${observationId}/photos`), toFormData({ ...request }));
  }

  photoFileUrl(photoId: string): string {
    return this.url(`/photos/${photoId}/file`);
  }

  uploadVoiceNote(observationId: string, request: VoiceNoteUploadRequest): Observable<VoiceNoteDto> {
    return this.http.post<VoiceNoteDto>(this.url(`/observations/${observationId}/voice-note`), toFormData({ ...request }));
  }

  confirm(id: string, body: ConfirmObservationRequest): Observable<ObservationDto> {
    return this.http.post<ObservationDto>(this.url(`/observations/${id}/confirm`), body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/observations/${id}`));
  }
}
