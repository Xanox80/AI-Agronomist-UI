import { inject, Injectable } from '@angular/core';
import { PhotoQualityReport } from '../api/models';
import { ImageDataLoader } from './image-data-loader';
import { evaluateQuality } from './quality-evaluator';
import { QUALITY_GATE_CONFIG } from './quality-gate.config';
import { QualityCheckName, QualityGateResult } from './quality-gate.model';

/** On-device photo quality gate (FR-2): no network, analysis runs on a downscaled copy. */
@Injectable({ providedIn: 'root' })
export class QualityGateService {
  private readonly loader = inject(ImageDataLoader);
  private readonly config = inject(QUALITY_GATE_CONFIG);

  /** Full result with per-check i18n hint keys, for showing the user what to fix. */
  async check(image: Blob): Promise<QualityGateResult> {
    const pixels = await this.loader.load(image, this.config.analysisMaxEdgePx);
    return evaluateQuality(pixels, this.config);
  }

  async assess(image: Blob): Promise<PhotoQualityReport> {
    const { ok, checks } = await this.check(image);
    const value = (name: QualityCheckName) => checks.find((check) => check.name === name)?.value ?? 0;
    return {
      sharpness: value('sharpness'),
      exposure: value('exposure'),
      plantCoverage: value('plantCoverage'),
      objectSize: value('objectSize'),
      passed: ok,
    };
  }
}
