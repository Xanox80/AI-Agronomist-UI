import { AnalyticsFilter } from '../../core/api/models';

export interface HeatmapFilterForm {
  fieldId: string | null;
  cropId: string | null;
  diagnosisId: string | null;
  season: string | null;
  from: string | null;
  to: string | null;
}

export const EMPTY_HEATMAP_FILTER: HeatmapFilterForm = {
  fieldId: null, cropId: null, diagnosisId: null, season: null, from: null, to: null,
};

/** Drops empty values so only active filters reach the query string. */
export function toAnalyticsFilter(form: HeatmapFilterForm): AnalyticsFilter {
  const filter: AnalyticsFilter = {};
  for (const key of Object.keys(form) as (keyof HeatmapFilterForm)[]) {
    const value = form[key];
    if (value) filter[key] = value;
  }
  return filter;
}

export function seasonYears(currentYear: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(currentYear - i));
}

/** True unless both dates are set and the range is reversed (ISO dates compare lexically). */
export function isDateRangeValid(form: HeatmapFilterForm): boolean {
  return !form.from || !form.to || form.from <= form.to;
}
