import { PhotoQualityReport } from '../api/models';
import { Retryable } from './retry-queue';

export interface PhotoUpload extends Retryable {
  kind: 'photo';
  clientId: string;
  observationId: string;
  seq: number;
  qualityReport: PhotoQualityReport;
  file: Blob;
  queuedAt: string;
}

export interface VoiceUpload extends Retryable {
  kind: 'voice';
  clientId: string;
  observationId: string;
  durationSec: number;
  file: Blob;
  queuedAt: string;
}

export type AttachmentUpload = PhotoUpload | VoiceUpload;

interface PhotoAttachment { clientId: string; seq: number; qualityReport: PhotoQualityReport; file: Blob }
interface VoiceAttachment { clientId: string; durationSec: number; file: Blob }
interface ObservationAttachments { photos?: PhotoAttachment[]; voiceNote?: VoiceAttachment }

/** Splits an observation payload into the JSON part for /sync/push and the binary uploads that follow it. */
export function splitAttachments(
  payload: unknown,
  observationId: string,
  queuedAt: string,
): { json: unknown; uploads: AttachmentUpload[] } {
  const { attachments, ...json } = (payload ?? {}) as { attachments?: ObservationAttachments };
  const pending = { attempts: 0, nextAttemptAt: 0, observationId, queuedAt };
  const photos = (attachments?.photos ?? []).map(
    (photo): AttachmentUpload => ({ ...pending, kind: 'photo', ...photo }),
  );
  const voice = attachments?.voiceNote
    ? [{ ...pending, kind: 'voice', ...attachments.voiceNote } as AttachmentUpload]
    : [];
  return { json, uploads: [...photos, ...voice] };
}
