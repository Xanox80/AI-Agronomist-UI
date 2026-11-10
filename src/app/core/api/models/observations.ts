import { PageQuery } from './common';
import { FieldLinkMethod, Organ, ObservationStatus } from './enums';
import { DiagnosisResultDto } from './recognition';

export interface PhotoQualityReport {
  sharpness: number;
  exposure: number;
  plantCoverage: number;
  objectSize: number;
  passed: boolean;
}

export interface PhotoDto {
  id: string; clientId: string; seq: number; widthPx: number; heightPx: number;
  qualityReport: PhotoQualityReport; url: string;
}

export interface VoiceNoteDto {
  id: string; clientId: string; durationSec: number; transcript?: string; url?: string;
}

export interface ObservationDto {
  id: string;
  clientId: string;
  fieldId?: string;
  fieldLinkMethod: FieldLinkMethod;
  cropId?: string;
  bbchStage?: number;
  lat?: number;
  lng?: number;
  gpsAccuracyM?: number;
  capturedAt: string;
  deviceModel?: string;
  temperatureC?: number;
  humidityPct?: number;
  organ?: Organ;
  textNote?: string;
  scaleMarkerUsed: boolean;
  isQuickCapture: boolean;
  status: ObservationStatus;
  photos: PhotoDto[];
  voiceNote?: VoiceNoteDto;
  confirmedDiagnosisId?: string;
  diagnosis?: DiagnosisResultDto;
}

export type ObservationInput = Omit<
  ObservationDto, 'id' | 'status' | 'photos' | 'voiceNote' | 'confirmedDiagnosisId' | 'diagnosis'
>;
export interface ObservationPatch {
  fieldId?: string; cropId?: string; bbchStage?: number; textNote?: string; organ?: Organ;
}
export interface ObservationsQuery extends PageQuery {
  fieldId?: string; cropId?: string; status?: ObservationStatus; from?: string; to?: string;
}
export interface PhotoUploadRequest {
  file: Blob; clientId: string; seq: number; qualityReport: PhotoQualityReport;
}
export interface VoiceNoteUploadRequest { file: Blob; clientId: string; durationSec: number }
export interface ConfirmObservationRequest { diagnosisId: string; correctedFromModel: boolean }
