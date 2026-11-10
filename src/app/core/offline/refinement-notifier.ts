import { Injectable, signal } from '@angular/core';
import { DiagnosisResultDto } from '../api/models';

/** Tells open screens that the server refined a diagnosis while the device was away (FR-26). */
@Injectable({ providedIn: 'root' })
export class RefinementNotifier {
  private readonly latest = signal<DiagnosisResultDto | undefined>(undefined);
  readonly refinedDiagnosis = this.latest.asReadonly();

  announce(diagnosis: DiagnosisResultDto): void {
    this.latest.set(diagnosis);
  }
}
