import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ImageDataLoader } from './image-data-loader';
import { DEFAULT_QUALITY_GATE_CONFIG, QUALITY_GATE_CONFIG } from './quality-gate.config';
import { QualityGateService } from './quality-gate.service';
import { PixelImage } from './quality-gate.model';
import { fromPixels, GRAY_LIGHT, LEAF_DARK, LEAF_LIGHT, SIZE, solid } from './__fixtures__/synthetic-images';

function serviceWith(image: PixelImage) {
  const load = vi.fn().mockResolvedValue(image);
  TestBed.configureTestingModule({
    providers: [
      { provide: ImageDataLoader, useValue: { load } },
      { provide: QUALITY_GATE_CONFIG, useValue: DEFAULT_QUALITY_GATE_CONFIG },
    ],
  });
  return { service: TestBed.inject(QualityGateService), load };
}

describe('QualityGateService', () => {
  const sharpLeaf = fromPixels(SIZE, SIZE, (x, y) => (Math.floor(x / 2 + y / 2) % 2 === 0 ? LEAF_DARK : LEAF_LIGHT));

  it('asks the loader to downscale to the configured analysis edge', async () => {
    const { service, load } = serviceWith(sharpLeaf);
    const blob = new Blob(['x']);
    await service.check(blob);
    expect(load).toHaveBeenCalledWith(blob, DEFAULT_QUALITY_GATE_CONFIG.analysisMaxEdgePx);
  });

  it('assess maps check values to a passing photo quality report', async () => {
    const { service } = serviceWith(sharpLeaf);
    const report = await service.assess(new Blob(['x']));
    expect(report.passed).toBe(true);
    expect(report.sharpness).toBeGreaterThan(DEFAULT_QUALITY_GATE_CONFIG.minLaplacianVariance);
    expect(report.plantCoverage).toBe(1);
    expect(report.objectSize).toBe(1);
  });

  it('assess reports passed=false for a non-plant photo', async () => {
    const { service } = serviceWith(solid(GRAY_LIGHT));
    const report = await service.assess(new Blob(['x']));
    expect(report.passed).toBe(false);
    expect(report.plantCoverage).toBe(0);
  });

  it('check exposes hint keys for failed checks', async () => {
    const { service } = serviceWith(solid(GRAY_LIGHT));
    const result = await service.check(new Blob(['x']));
    expect(result.checks.filter((c) => !c.passed).every((c) => c.hintKey?.startsWith('qualityGate.hint.'))).toBe(true);
  });
});
