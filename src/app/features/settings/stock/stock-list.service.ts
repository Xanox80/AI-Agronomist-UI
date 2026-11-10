import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StockApi } from '../../../core/api/stock.api';
import { StockItemDto } from '../../../core/api/models';
import { SETTINGS_CONFIG } from '../settings.config';

/** FR-15: read-only warehouse list; stock is maintained through import. */
@Injectable({ providedIn: 'root' })
export class StockListService {
  private readonly api = inject(StockApi);
  private latestRequest = 0;
  private query = '';

  readonly pageSize = SETTINGS_CONFIG.stockPageSize;
  readonly items = signal<StockItemDto[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);

  async search(q: string): Promise<void> {
    this.query = q.trim();
    await this.goToPage(1);
  }

  async goToPage(page: number): Promise<void> {
    const request = ++this.latestRequest;
    const result = await firstValueFrom(
      this.api.list({ q: this.query || undefined, page, pageSize: this.pageSize }),
    );
    if (request !== this.latestRequest) return;
    this.items.set(result.items);
    this.total.set(result.total);
    this.page.set(page);
  }
}
