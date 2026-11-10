import { PhotoQualityReport } from '../../core/api/models';
import { QualityCheckName, QualityGateResult } from '../../core/quality-gate/quality-gate.model';

const UNSPECIFIED_ISSUE = 'scouting.quality.unspecified';

/** Translation keys of what the quality gate found wrong; the gate owns the thresholds and the wording. */
export function qualityIssueKeys(result: QualityGateResult): string[] {
  const keys = result.checks.flatMap((check) => (check.hintKey ? [check.hintKey] : []));
  return keys.length === 0 && !result.ok ? [UNSPECIFIED_ISSUE] : keys;
}

export function toPhotoQualityReport(result: QualityGateResult): PhotoQualityReport {
  const value = (name: QualityCheckName) => result.checks.find((check) => check.name === name)?.value ?? 0;
  return {
    sharpness: value('sharpness'),
    exposure: value('exposure'),
    plantCoverage: value('plantCoverage'),
    objectSize: value('objectSize'),
    passed: result.ok,
  };
}
