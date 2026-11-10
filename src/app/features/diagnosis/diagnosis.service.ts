import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { ObservationsApi } from '../../core/api/observations.api';
import { RecognitionApi } from '../../core/api/recognition.api';
import { CatalogDiagnosisDto, CropDto, DiagnosisResultDto, ObservationDto } from '../../core/api/models';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { isAwaitingServer } from './diagnosis-view';
import { DIAGNOSIS_CONFIG } from './diagnosis.config';

const HTTP_NOT_FOUND = 404;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface DiagnosisSnapshot { observation?: ObservationDto; diagnosis?: DiagnosisResultDto }
export interface ReferenceData { catalogue: CatalogDiagnosisDto[]; crops: CropDto[] }

@Injectable({ providedIn: 'root' })
export class DiagnosisService {
  private readonly observations = inject(ObservationsApi);
  private readonly recognition = inject(RecognitionApi);
  private readonly catalog = inject(CatalogApi);
  private readonly connectivity = inject(ConnectivityService);

  /** Polls while the observation, its photos or the server diagnosis are still on their way (scenario steps 3-4). */
  async load(observationId: string): Promise<DiagnosisSnapshot> {
    let snapshot: DiagnosisSnapshot = {};
    for (let attempt = 0; attempt < DIAGNOSIS_CONFIG.pollMaxAttempts; attempt++) {
      if (attempt > 0) await delay(DIAGNOSIS_CONFIG.pollIntervalMs);
      const observation = await this.readObservation(observationId);
      if (!observation) {
        if (!this.connectivity.online()) return snapshot;
        continue;
      }
      snapshot = { observation };
      if (observation.diagnosis) return { observation, diagnosis: observation.diagnosis };
      if (isAwaitingServer(observation)) continue;
      const diagnosis = await this.fetchDiagnosis(observationId);
      if (diagnosis) return { observation, diagnosis };
    }
    return snapshot;
  }

  /** Undefined when the server does not have the observation yet (404) or the device is offline. */
  private async readObservation(observationId: string): Promise<ObservationDto | undefined> {
    try {
      return await firstValueFrom(this.observations.get(observationId));
    } catch (error) {
      const notYetSynced = error instanceof HttpErrorResponse && error.status === HTTP_NOT_FOUND;
      if (notYetSynced || !this.connectivity.online()) return undefined;
      throw error;
    }
  }

  private fetchDiagnosis(observationId: string): Promise<DiagnosisResultDto | undefined> {
    return firstValueFrom(
      this.recognition.getDiagnosis(observationId).pipe(catchError(() => this.recognition.diagnose(observationId))),
    ).catch(() => undefined);
  }

  answer(resultId: string, answers: Record<string, string>): Promise<DiagnosisResultDto> {
    return firstValueFrom(this.recognition.answerQuestions(resultId, { answers }));
  }

  confirm(observationId: string, diagnosisId: string, correctedFromModel: boolean): Promise<ObservationDto> {
    return firstValueFrom(this.observations.confirm(observationId, { diagnosisId, correctedFromModel }));
  }

  async referenceData(cropId?: string): Promise<ReferenceData> {
    const [catalogue, crops] = await Promise.all([
      firstValueFrom(this.catalog.diagnoses({ cropId })).catch(() => []),
      firstValueFrom(this.catalog.crops()).catch(() => []),
    ]);
    return { catalogue, crops };
  }
}
