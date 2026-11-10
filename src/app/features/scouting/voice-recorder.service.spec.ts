import { VoiceNote } from './scouting.types';
import { VoiceRecorderService } from './voice-recorder.service';

class FakeRecorder {
  static last: FakeRecorder;
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() { FakeRecorder.last = this; }
  start(): void { this.state = 'recording'; }
  stop(): void {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio']) });
    this.onstop?.();
  }
}

describe('VoiceRecorderService', () => {
  const stopTrack = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
      configurable: true,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('records until stop and hands over the note', async () => {
    const service = new VoiceRecorderService();
    let note: VoiceNote | undefined;
    await service.start((finished) => (note = finished));
    expect(service.recording()).toBe(true);
    service.stop();
    expect(service.recording()).toBe(false);
    expect(note?.blob.type).toBe('audio/webm');
    expect(stopTrack).toHaveBeenCalled();
  });

  it('stops by itself after the configured maximum', async () => {
    vi.useFakeTimers();
    const service = new VoiceRecorderService();
    const onFinished = vi.fn();
    await service.start(onFinished);
    vi.advanceTimersByTime(60_000);
    vi.useRealTimers();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('reports support from the platform APIs', () => {
    expect(new VoiceRecorderService().isSupported()).toBe(true);
  });
});
