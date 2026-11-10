import { describe, expect, it } from 'vitest';
import {
  exposureStats,
  greenMask,
  largestBlobBoxShare,
  laplacianVariance,
  luminanceGrid,
  maskShare,
} from './image-metrics';
import { DEFAULT_QUALITY_GATE_CONFIG as config } from './quality-gate.config';
import { boxBlur, checkerboard, fromPixels, GRAY_DARK, GRAY_LIGHT, LEAF_DARK, LEAF_LIGHT, SIZE, solid } from './__fixtures__/synthetic-images';

const greenOptions = { minExcessGreen: config.minExcessGreen, minChannelSum: config.minGreenChannelSum };

describe('laplacianVariance', () => {
  it('is zero for a flat image', () => {
    const luma = luminanceGrid(solid(GRAY_LIGHT));
    expect(laplacianVariance(luma, SIZE, SIZE)).toBe(0);
  });

  it('is high for a sharp checkerboard and much lower once blurred', () => {
    const sharp = checkerboard(GRAY_DARK, GRAY_LIGHT);
    const blurred = boxBlur(sharp, 2, 3);
    const sharpValue = laplacianVariance(luminanceGrid(sharp), SIZE, SIZE);
    const blurredValue = laplacianVariance(luminanceGrid(blurred), SIZE, SIZE);
    expect(sharpValue).toBeGreaterThan(config.minLaplacianVariance);
    expect(blurredValue).toBeLessThan(config.minLaplacianVariance);
  });

  it('returns zero for images smaller than the kernel', () => {
    expect(laplacianVariance(new Float32Array(4), 2, 2)).toBe(0);
  });
});

describe('exposureStats', () => {
  it('reports full clipping for a white image', () => {
    const stats = exposureStats(luminanceGrid(solid([255, 255, 255])), config.clipLowLevel, config.clipHighLevel);
    expect(stats.meanLuminance).toBeCloseTo(1, 2);
    expect(stats.clippedHighlightShare).toBe(1);
    expect(stats.clippedShadowShare).toBe(0);
  });

  it('reports full shadow clipping for a black image', () => {
    const stats = exposureStats(luminanceGrid(solid([0, 0, 0])), config.clipLowLevel, config.clipHighLevel);
    expect(stats.meanLuminance).toBe(0);
    expect(stats.clippedShadowShare).toBe(1);
  });
});

describe('greenMask', () => {
  it('marks green pixels and ignores gray and near-black ones', () => {
    expect(maskShare(greenMask(solid(LEAF_DARK), greenOptions))).toBe(1);
    expect(maskShare(greenMask(solid(GRAY_LIGHT), greenOptions))).toBe(0);
    expect(maskShare(greenMask(solid([0, 5, 0]), greenOptions))).toBe(0);
  });

  it('does not mark red or blue pixels', () => {
    expect(maskShare(greenMask(solid([200, 40, 40]), greenOptions))).toBe(0);
    expect(maskShare(greenMask(solid([40, 40, 200]), greenOptions))).toBe(0);
  });
});

describe('largestBlobBoxShare', () => {
  const maskWithRects = (...rects: [number, number, number, number][]) => {
    const image = fromPixels(SIZE, SIZE, (x, y) =>
      rects.some(([x0, y0, w, h]) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h) ? LEAF_LIGHT : GRAY_LIGHT,
    );
    return greenMask(image, greenOptions);
  };

  it('returns the bounding-box share of a single rectangle', () => {
    const mask = maskWithRects([10, 10, 32, 16]);
    expect(largestBlobBoxShare(mask, SIZE, SIZE)).toBeCloseTo((32 * 16) / (SIZE * SIZE));
  });

  it('uses the largest blob and ignores smaller ones', () => {
    const mask = maskWithRects([0, 0, 40, 40], [50, 50, 4, 4]);
    expect(largestBlobBoxShare(mask, SIZE, SIZE)).toBeCloseTo((40 * 40) / (SIZE * SIZE));
  });

  it('is zero when nothing is green', () => {
    expect(largestBlobBoxShare(new Uint8Array(SIZE * SIZE), SIZE, SIZE)).toBe(0);
  });
});
