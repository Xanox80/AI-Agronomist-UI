export const ROLES = ['scout', 'chief_agronomist', 'mechanic', 'expert'] as const;
export type Role = (typeof ROLES)[number];

export type ProblemCategory =
  | 'disease' | 'pest' | 'weed' | 'nutrition' | 'abiotic_stress' | 'mechanical_damage' | 'normal';
export type Organ = 'leaf' | 'ear' | 'stem' | 'fruit' | 'root' | 'pest' | 'field';
export type ActionLevel = 'observe' | 'threshold' | 'treat' | 'urgent';
export type RecommendationStatus = 'draft' | 'approved' | 'rejected';
export type TaskType = 'treatment' | 'reinspection' | 'sampling';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ObservationStatus = 'draft' | 'pending_sync' | 'synced' | 'diagnosed' | 'confirmed';
export type WeatherVerdict = 'go' | 'no_go' | 'wait';
export type ExpertCaseReason =
  | 'low_confidence' | 'user_model_disagreement' | 'rare_class' | 'out_of_distribution' | 'unsure_mode';
export type ExpertCaseStatus = 'open' | 'in_review' | 'resolved';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type ProductSource = 'registry' | 'internal_tech_card' | 'demo_seed';
export type PestStage = 'imago' | 'larva' | 'nymph' | 'egg' | 'pupa' | 'unknown';
export type LabelSource = 'user' | 'expert' | 'model';
export type DiagnosisPass = 'initial' | 'server_refined' | 'confirmed';
export type FieldLinkMethod = 'gps' | 'manual' | 'none';
export type FieldSource = 'manual' | 'import_kml' | 'import_geojson' | 'import_shp' | 'drawn';
export type PollinatorHazard = 'high' | 'moderate' | 'low' | 'unknown';
export type ResistanceSystem = 'FRAC' | 'IRAC' | 'HRAC' | 'none';
export type SyncEntityType = 'observation' | 'task' | 'treatment' | 'field' | 'feedback';
