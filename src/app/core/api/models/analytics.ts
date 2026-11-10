import { FieldContour } from './common';

export interface AnalyticsFilter {
  fieldId?: string; cropId?: string; diagnosisId?: string; from?: string; to?: string; season?: string;
}
export interface HeatmapPointDto {
  lat: number; lng: number; weight: number; diagnosisCode: string; observationId: string;
}
export interface HeatmapDto {
  points: HeatmapPointDto[];
  fields: { fieldId: string; name: string; count: number; contour?: FieldContour }[];
}
export interface AnalyticsSummaryDto {
  total: number;
  byDiagnosis: { code: string; name: string; count: number }[];
  byField: { fieldId: string; name: string; count: number }[];
  byWeek: { week: string; count: number }[];
}
export type ExportFormat = 'csv' | 'geojson';
export type ExportResource = 'observations' | 'fields' | 'tasks' | 'treatments';
