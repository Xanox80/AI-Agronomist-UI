import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toFormData, toHttpParams } from './api-base-url';
import { Page, StockImportResult, StockItemDto, StockQuery, UpdateStockRequest } from './models';

@Injectable({ providedIn: 'root' })
export class StockApi extends ApiClient {
  list(query: StockQuery = {}): Observable<Page<StockItemDto>> {
    return this.http.get<Page<StockItemDto>>(this.url('/stock'), { params: toHttpParams(query) });
  }

  upsert(productId: string, body: UpdateStockRequest): Observable<StockItemDto> {
    return this.http.put<StockItemDto>(this.url(`/stock/${productId}`), body);
  }

  importCsv(file: File): Observable<StockImportResult> {
    return this.http.post<StockImportResult>(this.url('/stock/import'), toFormData({ file }));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(`/stock/${id}`));
  }
}
