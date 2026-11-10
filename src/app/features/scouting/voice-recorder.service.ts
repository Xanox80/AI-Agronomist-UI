import { Injectable, signal } from '@angular/core';
import { SCOUTING_CONFIG } from './scouting.config';
import { VoiceNote } from './scouting.types';

const MS_PER_SECOND = 1000;

/** MediaRecorder wrapper for the voice note; recording ends on stop() or after the configured maximum. */
@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  readonly recording = signal(false);
  private recorder: MediaRecorder | null = null;

  isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(onFinished: (note: VoiceNote) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    const limit = setTimeout(() => this.stop(), SCOUTING_CONFIG.maxVoiceSeconds * MS_PER_SECOND);
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => {
      clearTimeout(limit);
      stream.getTracks().forEach((track) => track.stop());
      this.recording.set(false);
      onFinished({
        blob: new Blob(chunks, { type: recorder.mimeType }),
        durationSec: (Date.now() - startedAt) / MS_PER_SECOND,
      });
    };
    this.recorder = recorder;
    recorder.start();
    this.recording.set(true);
  }

  stop(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }
}
