import { EMPTY_HEATMAP_FILTER, isDateRangeValid, seasonYears, toAnalyticsFilter } from './heatmap-filter';

describe('heatmap-filter', () => {
  it('omits empty filter values', () => {
    expect(toAnalyticsFilter({ ...EMPTY_HEATMAP_FILTER, cropId: 'c1', from: '2026-05-01' })).toEqual({
      cropId: 'c1', from: '2026-05-01',
    });
  });

  it('returns an empty filter for an untouched form', () => {
    expect(toAnalyticsFilter(EMPTY_HEATMAP_FILTER)).toEqual({});
  });

  it('lists seasons from the current year backwards', () => {
    expect(seasonYears(2026, 3)).toEqual(['2026', '2025', '2024']);
  });

  it('flags a reversed date range only', () => {
    expect(isDateRangeValid({ ...EMPTY_HEATMAP_FILTER, from: '2026-05-02', to: '2026-05-01' })).toBe(false);
    expect(isDateRangeValid({ ...EMPTY_HEATMAP_FILTER, from: '2026-05-01' })).toBe(true);
  });
});
