import { ActionLevel, RecommendationStatus, ProblemCategory, WeatherVerdict } from './enums';
import { ProductDto } from './catalog';

export interface SafetyWarningDto {
  code: string; params: Record<string, string | number>; severity: 'info' | 'warning' | 'critical';
}
export interface RecommendationSourceDto { kind: string; ref: string; verifiedAt?: string }

export interface ReasonDto { code: string; params: Record<string, string | number> }

export interface RecommendationItemDto {
  rank: number;
  product: ProductDto;
  activeSubstanceCodes: string[];
  rate: { value: number; unit: string };
  applicationTiming: string;
  bbchFrom: number;
  bbchTo: number;
  preHarvestIntervalDays: number;
  resistance: { system: string; group: string; rotationOk: boolean; note?: ReasonDto | null };
  stock: { inStock: boolean; quantity?: number; unit?: string };
  costPerHaUah?: number;
  score: number;
  excludedReason?: ReasonDto | null;
}

export interface RecommendationDto {
  id: string;
  observationId: string;
  diagnosisId?: string | null;
  status: RecommendationStatus;
  actionLevel: ActionLevel;
  thresholdExceeded?: boolean;
  weather: {
    verdict: WeatherVerdict; reason: string; reasonParams: Record<string, string | number>; forecastSummary: unknown;
  } | null;
  safetyWarnings: SafetyWarningDto[];
  items: RecommendationItemDto[];
  excludedItems: RecommendationItemDto[];
  explanation: string;
  sources: RecommendationSourceDto[];
  catalogVersion: number;
  catalogStale: boolean;
  autoApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  disclaimerCode: string;
}

export interface CreateRecommendationRequest { observationId: string; diagnosisId?: string; bbchStage?: number; damagePercent?: number }
export interface RecomputeRecommendationRequest { bbchStage?: number; damagePercent?: number }
export interface RejectRecommendationRequest { reason: string }
export interface AutoApproveSettingDto {
  id: string; problemCategory?: ProblemCategory; diagnosisId?: string; minConfidence: number; enabled: boolean;
}
export type AutoApproveSettingInput = Omit<AutoApproveSettingDto, 'id'>;
