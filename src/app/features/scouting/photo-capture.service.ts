import { inject, Injectable } from '@angular/core';
import { PhotoQualityReport } from '../../core/api/models';
import { QualityGateService } from '../../core/quality-gate/quality-gate.service';
import { newClientId } from './client-id';
import { qualityIssueKeys, toPhotoQualityReport } from './quality-issues';
import { CapturedPhoto } from './scouting.types';

const UNASSESSED_REPORT: PhotoQualityReport = {
  sharpness: 0, exposure: 0, plantCoverage: 0, objectSize: 0, passed: false,
};
const UNASSESSED_ISSUE = 'scouting.quality.unassessed';

/** Runs the on-device quality gate (FR-2) over a captured file and keeps the verdict next to the photo. */
@Injectable({ providedIn: 'root' })
export class PhotoCaptureService {
  private readonly qualityGate = inject(QualityGateService);

  async capture(file: Blob): Promise<CapturedPhoto> {
    const assessed = await this.qualityGate.check(file).then(
      (result) => ({ report: toPhotoQualityReport(result), issues: qualityIssueKeys(result) }),
      () => ({ report: UNASSESSED_REPORT, issues: [UNASSESSED_ISSUE] }),
    );
    return { clientId: newClientId(), blob: file, previewUrl: URL.createObjectURL(file), ...assessed };
  }

  release(photo: CapturedPhoto): void {
    URL.revokeObjectURL(photo.previewUrl);
  }
}
