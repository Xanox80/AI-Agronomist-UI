import { TestBed } from '@angular/core/testing';
import { OutboxService } from '../../core/offline/outbox.service';
import { SyncService } from '../../core/offline/sync.service';
import { UploadQueueService } from '../../core/offline/upload-queue.service';
import { ScoutingContextService } from './scouting-context.service';
import { ScoutingSubmitService } from './scouting-submit.service';
import { ObservationOutboxPayload, ScoutingDraft } from './scouting.types';

const draft: ScoutingDraft = {
  fieldId: 'f1',
  fieldLinkMethod: 'gps',
  cropId: 'c1',
  bbchStage: 31,
  organ: 'leaf',
  photos: [
    { clientId: 'p1', blob: new Blob(['a']), previewUrl: 'u1', issues: [], report: { sharpness: 1, exposure: 1, plantCoverage: 1, objectSize: 1, passed: true } },
  ],
  scaleMarkerUsed: true,
  textNote: '  spots  ',
  voiceNote: { blob: new Blob(['v']), durationSec: 4 },
  fix: { lat: 49, lng: 31, accuracyM: 5 },
  isQuickCapture: false,
};

describe('ScoutingSubmitService', () => {
  const enqueue = vi.fn().mockResolvedValue(undefined);
  const syncNow = vi.fn().mockResolvedValue(undefined);
  const rememberCropLocally = vi.fn();
  const addAll = vi.fn().mockResolvedValue(undefined);
  let service: ScoutingSubmitService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: OutboxService, useValue: { enqueue } },
        { provide: SyncService, useValue: { syncNow } },
        { provide: UploadQueueService, useValue: { addAll } },
        { provide: ScoutingContextService, useValue: { rememberCropLocally } },
      ],
    });
    service = TestBed.inject(ScoutingSubmitService);
  });

  it('enqueues an observation upsert with FR-5 metadata and returns its client id', async () => {
    const id = await service.submit(draft);
    const item = enqueue.mock.calls[0][0];
    const payload = item.payload as ObservationOutboxPayload;
    expect(item).toMatchObject({ entityType: 'observation', clientId: id, operation: 'upsert' });
    expect(payload).toMatchObject({
      clientId: id, fieldId: 'f1', fieldLinkMethod: 'gps', cropId: 'c1', bbchStage: 31, lat: 49, lng: 31,
      organ: 'leaf', textNote: 'spots', scaleMarkerUsed: true, isQuickCapture: false,
    });
    expect(payload.capturedAt).toBeTruthy();
  });

  it('numbers photos from 1 and carries the voice note as an attachment', async () => {
    await service.submit(draft);
    const { attachments } = enqueue.mock.calls[0][0].payload as ObservationOutboxPayload;
    expect(attachments.photos.map((p) => [p.clientId, p.seq])).toEqual([['p1', 1]]);
    expect(attachments.voiceNote?.durationSec).toBe(4);
  });

  it('flags quick capture for the mechanic flow', async () => {
    await service.submit({ ...draft, isQuickCapture: true });
    expect((enqueue.mock.calls[0][0].payload as ObservationOutboxPayload).isQuickCapture).toBe(true);
  });

  it('remembers the crop locally and leaves server memory to the observation sync', async () => {
    await service.submit(draft);
    expect(rememberCropLocally).toHaveBeenCalledWith('f1', 'c1');
  });

  it('still succeeds when the sync trigger throws', async () => {
    syncNow.mockImplementationOnce(() => { throw new Error('not implemented'); });
    await expect(service.submit(draft)).resolves.toBeTruthy();
  });

  it('queues extra photos for an existing observation after its stored photos', async () => {
    await service.addPhotos('o1', 1, draft.photos);
    expect(addAll).toHaveBeenCalledWith([expect.objectContaining({ kind: 'photo', observationId: 'o1', seq: 2, clientId: 'p1' })]);
    expect(enqueue).not.toHaveBeenCalled();
  });
});
