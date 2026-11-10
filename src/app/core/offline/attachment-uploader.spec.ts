import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ObservationsApi } from '../api/observations.api';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { AttachmentUpload } from './attachment-upload';
import { AttachmentUploader } from './attachment-uploader';
import { OfflineDb } from './offline-db';
import { UploadQueueService } from './upload-queue.service';

const report = { sharpness: 1, exposure: 0.5, plantCoverage: 0.4, objectSize: 0.2, passed: true };
const photo: AttachmentUpload = {
  kind: 'photo', clientId: 'p1', observationId: 'o1', seq: 1, qualityReport: report,
  file: new Blob(['x']), queuedAt: '2026-01-01', attempts: 0, nextAttemptAt: 0,
};
const voice: AttachmentUpload = {
  kind: 'voice', clientId: 'v1', observationId: 'o1', durationSec: 3, file: new Blob(['y']),
  queuedAt: '2026-01-02', attempts: 0, nextAttemptAt: 0,
};

describe('AttachmentUploader', () => {
  const api = { uploadPhoto: vi.fn(), uploadVoiceNote: vi.fn() };
  let uploader: AttachmentUploader;
  let queue: UploadQueueService;

  beforeEach(() => {
    api.uploadPhoto.mockReset();
    api.uploadVoiceNote.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }, { provide: ObservationsApi, useValue: api }],
    });
    uploader = TestBed.inject(AttachmentUploader);
    queue = TestBed.inject(UploadQueueService);
  });

  it('uploads photos and voice notes and clears them from the queue', async () => {
    await queue.addAll([photo, voice]);
    api.uploadPhoto.mockReturnValue(of({}));
    api.uploadVoiceNote.mockReturnValue(of({}));
    expect(await uploader.uploadDue(0)).toBe(0);
    expect(api.uploadPhoto).toHaveBeenCalledWith('o1', expect.objectContaining({ clientId: 'p1', seq: 1 }));
    expect(api.uploadVoiceNote).toHaveBeenCalledWith('o1', expect.objectContaining({ clientId: 'v1', durationSec: 3 }));
    expect(await queue.count()).toBe(0);
  });

  it('keeps a failed upload queued and still tries the others', async () => {
    await queue.addAll([photo, voice]);
    api.uploadPhoto.mockReturnValue(throwError(() => new Error('503')));
    api.uploadVoiceNote.mockReturnValue(of({}));
    expect(await uploader.uploadDue(0)).toBe(1);
    expect(await queue.count()).toBe(1);
    expect(await queue.due(0, 10)).toEqual([]);
  });
});
