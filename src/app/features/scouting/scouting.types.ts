import { ObservationInput, Organ, PhotoQualityReport } from '../../core/api/models';

export interface CapturedPhoto {
  clientId: string;
  blob: Blob;
  previewUrl: string;
  report: PhotoQualityReport;
  /** Translation keys of the problems the quality gate found. */
  issues: string[];
}

export interface VoiceNote {
  blob: Blob;
  durationSec: number;
}

export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number;
}

export type ScoutingOrgan = Extract<Organ, 'leaf' | 'ear' | 'stem' | 'fruit' | 'pest' | 'field'>;

export interface ScoutingDraft {
  fieldId?: string;
  fieldLinkMethod: ObservationInput['fieldLinkMethod'];
  cropId?: string;
  bbchStage?: number;
  organ: ScoutingOrgan;
  photos: CapturedPhoto[];
  scaleMarkerUsed: boolean;
  textNote: string;
  voiceNote: VoiceNote | null;
  fix: GeoFix | null;
  isQuickCapture: boolean;
}

/** Media travels inside the outbox payload; fe-offline uploads it after the observation is applied. */
export interface ObservationAttachments {
  photos: { clientId: string; seq: number; qualityReport: PhotoQualityReport; file: Blob }[];
  voiceNote?: { clientId: string; durationSec: number; file: Blob };
}

export type ObservationOutboxPayload = ObservationInput & { attachments: ObservationAttachments };
