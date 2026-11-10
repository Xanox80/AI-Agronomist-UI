import { QualityCheck, QualityGateResult } from '../../core/quality-gate/quality-gate.model';
import { qualityIssueKeys, toPhotoQualityReport } from './quality-issues';

const pass = (name: QualityCheck['name'], value: number): QualityCheck => ({ name, value, passed: true });
const good: QualityGateResult = {
  ok: true,
  checks: [pass('sharpness', 200), pass('exposure', 0.5), pass('plantCoverage', 0.6), pass('objectSize', 0.4)],
};

describe('qualityIssueKeys', () => {
  it('returns nothing for a good photo', () => {
    expect(qualityIssueKeys(good)).toEqual([]);
  });

  it('passes through the gate hint of every failed check, including clipping', () => {
    const result: QualityGateResult = {
      ok: false,
      checks: [
        { name: 'sharpness', value: 1, passed: false, hintKey: 'qualityGate.hint.blurry' },
        { name: 'exposure', value: 0.5, passed: false, hintKey: 'qualityGate.hint.clippedHighlights' },
      ],
    };
    expect(qualityIssueKeys(result)).toEqual(['qualityGate.hint.blurry', 'qualityGate.hint.clippedHighlights']);
  });

  it('falls back to unspecified when the gate failed without a hint', () => {
    expect(qualityIssueKeys({ ...good, ok: false })).toEqual(['scouting.quality.unspecified']);
  });
});

describe('toPhotoQualityReport', () => {
  it('maps check values and the verdict', () => {
    expect(toPhotoQualityReport(good)).toEqual({
      sharpness: 200, exposure: 0.5, plantCoverage: 0.6, objectSize: 0.4, passed: true,
    });
  });
});
