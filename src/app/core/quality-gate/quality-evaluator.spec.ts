import { describe, expect, it } from 'vitest';
import { evaluateQuality } from './quality-evaluator';
import { DEFAULT_QUALITY_GATE_CONFIG as config } from './quality-gate.config';
import { QualityCheckName, QualityGateResult } from './quality-gate.model';
import { boxBlur, checkerboard, fromPixels, GRAY_DARK, GRAY_LIGHT, LEAF_DARK, LEAF_LIGHT, SIZE, solid } from './__fixtures__/synthetic-images';

const check = (result: QualityGateResult, name: QualityCheckName) => result.checks.find((c) => c.name === name)!;

describe('evaluateQuality', () => {
  const sharpLeaf = fromPixels(SIZE, SIZE, (x, y) => (Math.floor(x / 2 + y / 2) % 2 === 0 ? LEAF_DARK : LEAF_LIGHT));

  it('passes a sharp, well exposed green image', () => {
    const result = evaluateQuality(sharpLeaf, config);
    expect(result.ok).toBe(true);
    expect(result.checks.map((c) => c.name)).toEqual(['sharpness', 'exposure', 'plantCoverage', 'objectSize']);
    expect(result.checks.every((c) => c.hintKey === undefined)).toBe(true);
  });

  it('flags a blurred image as blurry while a sharp one passes the sharpness check', () => {
    const blurred = evaluateQuality(boxBlur(sharpLeaf, 2, 3), config);
    expect(check(blurred, 'sharpness')).toMatchObject({ passed: false, hintKey: 'qualityGate.hint.blurry' });
    expect(blurred.ok).toBe(false);
    expect(check(evaluateQuality(sharpLeaf, config), 'sharpness').passed).toBe(true);
  });

  it('flags a dark image', () => {
    const result = evaluateQuality(solid([8, 20, 8]), config);
    expect(check(result, 'exposure')).toMatchObject({ passed: false, hintKey: 'qualityGate.hint.tooDark' });
  });

  it('flags an overexposed image', () => {
    const result = evaluateQuality(solid([255, 255, 255]), config);
    expect(check(result, 'exposure')).toMatchObject({ passed: false, hintKey: 'qualityGate.hint.tooBright' });
  });

  it('flags clipped highlights even when mean luminance is acceptable', () => {
    const image = fromPixels(SIZE, SIZE, (x) => (x < SIZE / 2 ? [255, 255, 255] : LEAF_DARK));
    const result = evaluateQuality(image, config);
    expect(check(result, 'exposure').hintKey).toBe('qualityGate.hint.clippedHighlights');
  });

  it('flags clipped shadows when most pixels are black but mean stays above the minimum', () => {
    const image = fromPixels(SIZE, SIZE, (x) => (x < SIZE * 0.6 ? [0, 0, 0] : [255, 255, 255]));
    const relaxed = { ...config, exposureMin: 0, exposureMax: 1, maxClippedHighlightShare: 1 };
    expect(check(evaluateQuality(image, relaxed), 'exposure').hintKey).toBe('qualityGate.hint.clippedShadows');
  });

  it('flags a non-green image as having no plant', () => {
    const result = evaluateQuality(checkerboard(GRAY_DARK, GRAY_LIGHT), config);
    expect(check(result, 'plantCoverage')).toMatchObject({ passed: false, hintKey: 'qualityGate.hint.noPlant' });
    expect(check(result, 'plantCoverage').value).toBe(0);
    expect(result.ok).toBe(false);
  });

  it('flags a plant that is too small in the frame even when green share is high', () => {
    const scattered = checkerboard(LEAF_LIGHT, GRAY_LIGHT);
    const result = evaluateQuality(scattered, config);
    expect(check(result, 'plantCoverage').passed).toBe(true);
    expect(check(result, 'objectSize')).toMatchObject({ passed: false, hintKey: 'qualityGate.hint.tooFar' });
  });

  it('respects thresholds from the injected config', () => {
    const strict = { ...config, minLaplacianVariance: Number.MAX_SAFE_INTEGER };
    expect(check(evaluateQuality(sharpLeaf, strict), 'sharpness').passed).toBe(false);
  });
});
