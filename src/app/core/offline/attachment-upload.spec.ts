import { splitAttachments } from './attachment-upload';

const report = { sharpness: 1, exposure: 0.5, plantCoverage: 0.4, objectSize: 0.2, passed: true };
const file = new Blob(['x']);

describe('splitAttachments', () => {
  it('removes attachments from the JSON sent to the server', () => {
    const { json } = splitAttachments({ clientId: 'o1', attachments: { photos: [] } }, 'o1', 't');
    expect(json).toEqual({ clientId: 'o1' });
  });

  it('turns photos and the voice note into queued uploads for the observation', () => {
    const payload = {
      attachments: {
        photos: [{ clientId: 'p1', seq: 1, qualityReport: report, file }],
        voiceNote: { clientId: 'v1', durationSec: 4, file },
      },
    };
    const { uploads } = splitAttachments(payload, 'o1', '2026-01-01T00:00:00Z');
    expect(uploads.map((u) => [u.kind, u.clientId, u.observationId])).toEqual([
      ['photo', 'p1', 'o1'],
      ['voice', 'v1', 'o1'],
    ]);
    expect(uploads[0]).toMatchObject({ attempts: 0, nextAttemptAt: 0, seq: 1 });
  });

  it('handles payloads without attachments', () => {
    expect(splitAttachments({ clientId: 't1' }, 't1', 't').uploads).toEqual([]);
    expect(splitAttachments(undefined, 't1', 't').json).toEqual({});
  });
});
