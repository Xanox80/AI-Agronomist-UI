import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ObservationsApi } from '../api/observations.api';
import { AttachmentUpload } from './attachment-upload';
import { SyncPolicy } from './sync-policy';
import { UploadQueueService } from './upload-queue.service';

/** Uploads queued photos and voice notes through the observation endpoints. */
@Injectable({ providedIn: 'root' })
export class AttachmentUploader {
  private readonly queue = inject(UploadQueueService);
  private readonly api = inject(ObservationsApi);
  private readonly policy = inject(SyncPolicy);

  /** Returns the number of uploads that failed and stay queued. */
  async uploadDue(now: number): Promise<number> {
    let failed = 0;
    for (const upload of await this.queue.due(now, this.policy.batchSize)) {
      try {
        await firstValueFrom(this.send(upload));
        await this.queue.markDone(upload.clientId);
      } catch {
        await this.queue.markFailed(upload.clientId, now);
        failed++;
      }
    }
    return failed;
  }

  private send(upload: AttachmentUpload): Observable<unknown> {
    return upload.kind === 'photo'
      ? this.api.uploadPhoto(upload.observationId, {
          file: upload.file, clientId: upload.clientId, seq: upload.seq, qualityReport: upload.qualityReport,
        })
      : this.api.uploadVoiceNote(upload.observationId, {
          file: upload.file, clientId: upload.clientId, durationSec: upload.durationSec,
        });
  }
}
