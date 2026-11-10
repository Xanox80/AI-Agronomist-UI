import { inject, Injectable } from '@angular/core';
import { ObservationInput } from '../../core/api/models';
import { OutboxService } from '../../core/offline/outbox.service';
import { SyncService } from '../../core/offline/sync.service';
import { UploadQueueService } from '../../core/offline/upload-queue.service';
import { newClientId } from './client-id';
import { resolveDeviceModel } from './device-model';
import { ScoutingContextService } from './scouting-context.service';
import { CapturedPhoto, ObservationOutboxPayload, ScoutingDraft } from './scouting.types';

/** Turns the finished wizard draft into an outbox entry (FR-5 metadata included) and nudges the sync. */
@Injectable({ providedIn: 'root' })
export class ScoutingSubmitService {
  private readonly outbox = inject(OutboxService);
  private readonly sync = inject(SyncService);
  private readonly uploads = inject(UploadQueueService);
  private readonly context = inject(ScoutingContextService);

  /** Returns the observation id: the server adopts the client id as the row id and remembers the crop per field. */
  async submit(draft: ScoutingDraft): Promise<string> {
    const clientId = newClientId();
    const now = new Date().toISOString();
    await this.outbox.enqueue({
      entityType: 'observation',
      clientId,
      operation: 'upsert',
      clientTimestamp: now,
      payload: await this.toPayload(draft, clientId, now),
    });
    await this.nudgeSync();
    this.context.rememberCropLocally(draft.fieldId, draft.cropId);
    return clientId;
  }

  /** FR-8: extra photos go straight to the upload queue of an observation that already exists on the server. */
  async addPhotos(observationId: string, existingPhotoCount: number, photos: CapturedPhoto[]): Promise<void> {
    const queuedAt = new Date().toISOString();
    await this.uploads.addAll(photos.map((photo, index) => ({
      kind: 'photo' as const, clientId: photo.clientId, observationId, seq: existingPhotoCount + index + 1,
      qualityReport: photo.report, file: photo.blob, queuedAt, attempts: 0, nextAttemptAt: 0,
    })));
    await this.nudgeSync();
  }

  private async toPayload(draft: ScoutingDraft, clientId: string, now: string): Promise<ObservationOutboxPayload> {
    const observation: ObservationInput = {
      clientId,
      fieldId: draft.fieldId,
      fieldLinkMethod: draft.fieldLinkMethod,
      cropId: draft.cropId,
      bbchStage: draft.bbchStage,
      lat: draft.fix?.lat,
      lng: draft.fix?.lng,
      gpsAccuracyM: draft.fix?.accuracyM,
      capturedAt: now,
      deviceModel: await resolveDeviceModel(),
      organ: draft.organ,
      textNote: draft.textNote.trim() || undefined,
      scaleMarkerUsed: draft.scaleMarkerUsed,
      isQuickCapture: draft.isQuickCapture,
    };
    return {
      ...observation,
      attachments: {
        photos: draft.photos.map((photo, index) => ({
          clientId: photo.clientId, seq: index + 1, qualityReport: photo.report, file: photo.blob,
        })),
        voiceNote: draft.voiceNote
          ? { clientId: newClientId(), durationSec: draft.voiceNote.durationSec, file: draft.voiceNote.blob }
          : undefined,
      },
    };
  }

  /** Waits for the cycle so the observation and its photos are on the server before the diagnosis opens (FR-24, FR-26). */
  private async nudgeSync(): Promise<void> {
    try {
      await this.sync.syncNow();
    } catch {
      // the outbox already holds the entry; the periodic sync will pick it up
    }
  }
}
