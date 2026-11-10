import { PageQuery } from './common';
import { ProblemCategory, PollinatorHazard, ProductSource, ProposalStatus, ResistanceSystem } from './enums';
import { QuestionDto, ReferenceImageDto } from './recognition';

export interface CropDto { id: string; code: string; nameUk: string; nameEn: string }
export interface BbchStageDto {
  id: string; cropId: string; bbchFrom: number; bbchTo: number; nameUk: string; nameEn: string; phase: string;
}
export interface CatalogDiagnosisDto {
  id: string;
  code: string;
  nameUk: string;
  nameEn: string;
  latinName?: string;
  problemCategory: ProblemCategory;
  isQuarantine: boolean;
  isCritical: boolean;
  descriptionUk: string;
  descriptionEn: string;
  cropIds: string[];
  clarifyingQuestions: QuestionDto[];
}
export interface CatalogDiagnosesQuery { cropId?: string; category?: ProblemCategory; q?: string }

export type ThresholdMetric = 'percent_leaf_area' | 'pests_per_m2' | 'pests_per_plant' | 'percent_plants';
export interface ThresholdDto {
  id: string; diagnosisId: string; cropId: string; bbchFrom: number; bbchTo: number;
  metric: ThresholdMetric; thresholdValue: number; urgentValue?: number; unit: string;
}
export interface ThresholdsQuery { diagnosisId?: string; cropId?: string }

export interface ProductActiveSubstanceDto {
  code: string; nameUk: string; concentration: string;
  resistanceSystem: ResistanceSystem; resistanceGroup: string;
}
export interface ProductDto {
  id: string;
  name: string;
  registrationNumber?: string;
  activeSubstances: ProductActiveSubstanceDto[];
  pollinatorHazard: PollinatorHazard;
  zones: { water: number; apiary: number; settlement: number };
  isDemo: boolean;
  source: ProductSource;
  verifiedAt?: string;
}
export interface ProductsQuery { q?: string; cropId?: string; diagnosisId?: string; activeSubstance?: string }

export interface ProductRegistrationDto {
  id: string; productId: string; cropId: string; diagnosisId: string;
  rateMin: number; rateMax: number; rateUnit: 'l/ha' | 'kg/ha';
  maxApplications: number; minIntervalDays: number; preHarvestIntervalDays: number;
  bbchFrom: number; bbchTo: number; efficacyScore: number;
}
export interface ActiveSubstanceDto {
  id: string; code: string; nameUk: string; nameEn: string;
  resistanceSystem: ResistanceSystem; resistanceGroup: string; maxApplicationsPerSeason?: number;
}

export interface CatalogStatusDto {
  regionCode: string; version: number; publishedAt: string; lastVerifiedAt?: string;
  daysSinceVerified: number; stale: boolean; staleAfterDays: number; containsDemoData: boolean;
}

export interface CatalogPackDto {
  regionCode: string;
  version: number;
  publishedAt: string;
  crops: CropDto[];
  bbch: BbchStageDto[];
  diagnoses: CatalogDiagnosisDto[];
  thresholds: ThresholdDto[];
  products: ProductDto[];
  registrations: ProductRegistrationDto[];
  activeSubstances: ActiveSubstanceDto[];
  referenceImages: ReferenceImageDto[];
  deleted: Record<string, string[]>;
}
export interface CatalogPackQuery { region?: string; sinceVersion?: number }

export type ProposalEntityType =
  'product' | 'registration' | 'threshold' | 'diagnosis' | 'active_substance' | 'reference_image' | 'crop';
export interface ProposalDto {
  id: string;
  entityType: ProposalEntityType;
  entityId?: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: ProposalStatus;
  proposedByUserId: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewComment?: string;
}
export interface ProposalsQuery extends PageQuery { status?: ProposalStatus }
export interface CreateProposalRequest {
  entityType: ProposalEntityType; entityId?: string; operation: ProposalDto['operation']; payload: Record<string, unknown>;
}
export interface ReferenceImageUploadRequest {
  file: Blob; diagnosisId: string; caption: string; stage?: string; attribution: string;
}
export interface VerifyCatalogRequest { regionCode: string; note?: string }
