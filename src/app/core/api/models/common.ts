import type { MultiPolygon, Polygon } from 'geojson';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type FieldContour = Polygon | MultiPolygon;

export type ApiParams = Record<string, string | number | boolean | undefined | null>;
