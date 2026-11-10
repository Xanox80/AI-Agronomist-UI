export type QualityCheckName = 'sharpness' | 'exposure' | 'plantCoverage' | 'objectSize';

export interface QualityCheck {
  name: QualityCheckName;
  value: number;
  passed: boolean;
  /** i18n key explaining what is wrong; absent when the check passed. */
  hintKey?: string;
}

export interface QualityGateResult {
  ok: boolean;
  checks: QualityCheck[];
}

export interface PixelImage {
  readonly data: ArrayLike<number>;
  readonly width: number;
  readonly height: number;
}
