import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toFormData, toHttpParams } from './api-base-url';
import {
  CropMemoryDto, FieldDto, FieldImportResult, FieldInput, FieldLocateResult, FieldPatch, FieldsQuery, LatLng, Page,
} from './models';

@Injectable({ providedIn: 'root' })
export class FieldsApi extends ApiClient {
  list(query: FieldsQuery = {}): Observable<Page<FieldDto>> {
    return this.http.get<Page<FieldDto>>(this.url('/fields'), { params: toHttpParams(query) });
  }

  get(id: string): Observable<FieldDto> {
    return this.http.get<FieldDto>(this.url(`/fields/${id}`));
  }

  create(body: FieldInput): Observable<FieldDto> {
    return this.http.post<FieldDto>(this.url('/fields'), body);
  }

  update(id: string, body: FieldPatch): Observable<FieldDto> {
    return this.http.patch<FieldDto>(this.url(`/fields/${id}`), body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/fields/${id}`));
  }

  import(file: File, dryRun = false): Observable<FieldImportResult> {
    return this.http.post<FieldImportResult>(this.url('/fields/import'), toFormData({ file }), {
      params: toHttpParams({ dryRun }),
    });
  }

  locate(point: LatLng): Observable<FieldLocateResult> {
    return this.http.get<FieldLocateResult>(this.url('/fields/locate'), { params: toHttpParams(point) });
  }

  getCropMemory(fieldId: string): Observable<CropMemoryDto> {
    return this.http.get<CropMemoryDto>(this.url(`/fields/${fieldId}/crop-memory`));
  }

  setCropMemory(fieldId: string, cropId: string): Observable<void> {
    return this.http.put<void>(this.url(`/fields/${fieldId}/crop-memory`), { cropId });
  }
}
