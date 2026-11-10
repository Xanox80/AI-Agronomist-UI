import { ActionLevel, RecommendationStatus, SafetyWarningDto, WeatherVerdict } from '../../core/api/models';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

export interface TimelineHour {
  time: string;
  verdict: WeatherVerdict;
  causes: string[];
}

const ACTION_SEVERITY: Record<ActionLevel, TagSeverity> = {
  observe: 'info', threshold: 'warn', treat: 'warn', urgent: 'danger',
};
const VERDICT_SEVERITY: Record<WeatherVerdict, TagSeverity> = { go: 'success', wait: 'warn', no_go: 'danger' };
const STATUS_SEVERITY: Record<RecommendationStatus, TagSeverity> = {
  draft: 'secondary', approved: 'success', rejected: 'danger',
};
const WARNING_SEVERITY: Record<SafetyWarningDto['severity'], TagSeverity> = {
  info: 'info', warning: 'warn', critical: 'danger',
};
const VERDICTS: readonly string[] = ['go', 'wait', 'no_go'];

export const actionSeverity = (level: ActionLevel): TagSeverity => ACTION_SEVERITY[level];
export const verdictSeverity = (verdict: WeatherVerdict): TagSeverity => VERDICT_SEVERITY[verdict];
export const statusSeverity = (status: RecommendationStatus): TagSeverity => STATUS_SEVERITY[status];
export const warningSeverity = (severity: SafetyWarningDto['severity']): TagSeverity => WARNING_SEVERITY[severity];

/** The forecast snapshot is stored as opaque JSON; only well-formed hourly entries are shown. */
export function toTimelineHours(summary: unknown): TimelineHour[] {
  const hours = Array.isArray(summary) ? summary : (summary as { hours?: unknown } | null)?.hours;
  if (!Array.isArray(hours)) return [];
  return hours
    .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
    .filter((h) => typeof h['time'] === 'string' && VERDICTS.includes(h['verdict'] as string))
    .map((h) => ({
      time: h['time'] as string,
      verdict: h['verdict'] as WeatherVerdict,
      causes: Array.isArray(h['causes']) ? (h['causes'] as string[]) : [],
    }));
}

export function isReasonMissing(reason: string): boolean {
  return reason.trim().length === 0;
}
