import { actionSeverity, isReasonMissing, toTimelineHours, verdictSeverity } from './recommendation-display';

describe('recommendation display helpers', () => {
  it('maps urgent action to the danger severity', () => {
    expect(actionSeverity('urgent')).toBe('danger');
  });

  it('maps a go verdict to the success severity', () => {
    expect(verdictSeverity('go')).toBe('success');
  });

  it('keeps only well-formed hourly entries from the forecast snapshot', () => {
    const hours = toTimelineHours({
      hours: [
        { time: '2026-11-10T08:00:00Z', verdict: 'no_go', causes: ['weather.cause.wind_high'] },
        { time: '2026-11-10T09:00:00Z', verdict: 'maybe' },
        null,
      ],
    });
    expect(hours).toEqual([
      { time: '2026-11-10T08:00:00Z', verdict: 'no_go', causes: ['weather.cause.wind_high'] },
    ]);
  });

  it('returns an empty timeline for an unknown snapshot shape', () => {
    expect(toTimelineHours(undefined)).toEqual([]);
  });

  it('treats a blank rejection reason as missing', () => {
    expect(isReasonMissing('   ')).toBe(true);
  });
});
