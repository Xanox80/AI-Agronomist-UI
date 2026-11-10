import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface QualityGateConfig {
  minLaplacianVariance: number;
  exposureMin: number;
  exposureMax: number;
  minPlantCoverage: number;
  minObjectFraction: number;
  analysisMaxEdgePx: number;
  clipHighLevel: number;
  clipLowLevel: number;
  maxClippedHighlightShare: number;
  maxClippedShadowShare: number;
  minExcessGreen: number;
  minGreenChannelSum: number;
}

const ANALYSIS_DEFAULTS = {
  analysisMaxEdgePx: 480,
  clipHighLevel: 0.98,
  clipLowLevel: 0.02,
  maxClippedHighlightShare: 0.25,
  maxClippedShadowShare: 0.4,
  minExcessGreen: 0.1,
  minGreenChannelSum: 60,
};

/** Thresholds shared with the environment (single source); analysis-only tunables are added here. */
const { maxImageEdgePx: _unusedUploadEdge, ...GATE_THRESHOLDS } = environment.qualityGate;

export const DEFAULT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  ...ANALYSIS_DEFAULTS,
  ...GATE_THRESHOLDS,
};

export const QUALITY_GATE_CONFIG = new InjectionToken<QualityGateConfig>('QUALITY_GATE_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_QUALITY_GATE_CONFIG,
});
