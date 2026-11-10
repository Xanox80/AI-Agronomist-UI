import {
  exposureStats,
  greenMask,
  largestBlobBoxShare,
  laplacianVariance,
  luminanceGrid,
  maskShare,
} from './image-metrics';
import { QualityGateConfig } from './quality-gate.config';
import { PixelImage, QualityCheck, QualityCheckName, QualityGateResult } from './quality-gate.model';

interface Metrics {
  sharpness: number;
  meanLuminance: number;
  clippedHighlightShare: number;
  clippedShadowShare: number;
  plantCoverage: number;
  objectFraction: number;
}

interface CheckStrategy {
  run(metrics: Metrics, config: QualityGateConfig): QualityCheck;
}

const HINT_PREFIX = 'qualityGate.hint.';

function outcome(name: QualityCheckName, value: number, failedHint?: string): QualityCheck {
  return failedHint ? { name, value, passed: false, hintKey: HINT_PREFIX + failedHint } : { name, value, passed: true };
}

interface ExposureRule {
  hint: string;
  fails(metrics: Metrics, config: QualityGateConfig): boolean;
}

/** Ordered: the first failing rule names the hint. */
const EXPOSURE_RULES: readonly ExposureRule[] = [
  { hint: 'tooDark', fails: (m, c) => m.meanLuminance < c.exposureMin },
  { hint: 'tooBright', fails: (m, c) => m.meanLuminance > c.exposureMax },
  { hint: 'clippedHighlights', fails: (m, c) => m.clippedHighlightShare > c.maxClippedHighlightShare },
  { hint: 'clippedShadows', fails: (m, c) => m.clippedShadowShare > c.maxClippedShadowShare },
];

const CHECKS: readonly CheckStrategy[] = [
  {
    run: (m, c) => outcome('sharpness', m.sharpness, m.sharpness < c.minLaplacianVariance ? 'blurry' : undefined),
  },
  {
    run: (m, c) => outcome('exposure', m.meanLuminance, EXPOSURE_RULES.find((rule) => rule.fails(m, c))?.hint),
  },
  {
    run: (m, c) =>
      outcome('plantCoverage', m.plantCoverage, m.plantCoverage < c.minPlantCoverage ? 'noPlant' : undefined),
  },
  {
    run: (m, c) =>
      outcome('objectSize', m.objectFraction, m.objectFraction < c.minObjectFraction ? 'tooFar' : undefined),
  },
];

function measure(image: PixelImage, config: QualityGateConfig): Metrics {
  const luma = luminanceGrid(image);
  const exposure = exposureStats(luma, config.clipLowLevel, config.clipHighLevel);
  const mask = greenMask(image, { minExcessGreen: config.minExcessGreen, minChannelSum: config.minGreenChannelSum });
  return {
    sharpness: laplacianVariance(luma, image.width, image.height),
    meanLuminance: exposure.meanLuminance,
    clippedHighlightShare: exposure.clippedHighlightShare,
    clippedShadowShare: exposure.clippedShadowShare,
    plantCoverage: maskShare(mask),
    objectFraction: largestBlobBoxShare(mask, image.width, image.height),
  };
}

/** Runs every quality check on an already downscaled image; pure and synchronous. */
export function evaluateQuality(image: PixelImage, config: QualityGateConfig): QualityGateResult {
  const metrics = measure(image, config);
  const checks = CHECKS.map((check) => check.run(metrics, config));
  return { ok: checks.every((check) => check.passed), checks };
}
