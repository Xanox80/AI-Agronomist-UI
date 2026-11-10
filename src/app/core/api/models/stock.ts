import { PageQuery } from './common';

export interface StockItemDto {
  id: string; productId: string; productName: string; quantity: number; unit: string;
  warehouse?: string; lotNumber?: string; expiresAt?: string; source: 'manual' | 'csv' | 'erp'; syncedAt?: string;
}
export interface StockQuery extends PageQuery { q?: string; productId?: string }
export interface UpdateStockRequest {
  quantity: number; unit: string; warehouse?: string; lotNumber?: string; expiresAt?: string;
}
export interface StockImportResult { upserted: number; skipped: unknown[] }
