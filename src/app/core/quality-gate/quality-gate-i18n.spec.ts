import { describe, expect, it } from 'vitest';
import en from '../../../assets/i18n/quality-gate/en.json';
import uk from '../../../assets/i18n/quality-gate/uk.json';

function keysOf(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('quality gate translations', () => {
  it('uk and en define the same keys', () => {
    expect(keysOf(uk).sort()).toEqual(keysOf(en).sort());
  });

  it('every hint key produced by the evaluator exists', () => {
    const keys = keysOf(uk);
    for (const hint of ['blurry', 'tooDark', 'tooBright', 'clippedHighlights', 'clippedShadows', 'noPlant', 'tooFar']) {
      expect(keys).toContain(`qualityGate.hint.${hint}`);
    }
  });
});
