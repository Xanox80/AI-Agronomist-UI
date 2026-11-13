import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecommendationApi } from '../../core/api/recommendation.api';
import { ObservationsApi } from '../../core/api/observations.api';
import { ObservationDto, RecommendationDto, TreatmentPlanDto } from '../../core/api/models';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly api = inject(RecommendationApi);
  private readonly observations = inject(ObservationsApi);

  /** Opens the latest recommendation of the observation, building a draft with the rules engine when none exists. */
  async loadOrCreate(observationId: string): Promise<RecommendationDto> {
    const [latest] = await firstValueFrom(this.api.listForObservation(observationId));
    return latest ?? firstValueFrom(this.api.create({ observationId }));
  }

  observation(id: string): Promise<ObservationDto> {
    return firstValueFrom(this.observations.get(id));
  }

  load(id: string): Promise<RecommendationDto> {
    return firstValueFrom(this.api.get(id));
  }

  approve(id: string): Promise<RecommendationDto> {
    return firstValueFrom(this.api.approve(id));
  }

  reject(id: string, reason: string): Promise<RecommendationDto> {
    return firstValueFrom(this.api.reject(id, { reason: reason.trim() }));
  }

  recompute(id: string, damagePercent?: number): Promise<RecommendationDto> {
    return firstValueFrom(this.api.recompute(id, { damagePercent }));
  }

  /** Asks the backend language model for a treatment course; it answers 503 when Groq is not configured or down. */
  treatmentPlan(id: string, tankVolumeL?: number): Promise<TreatmentPlanDto> {
    return firstValueFrom(this.api.treatmentPlan(id, { tankVolumeL }));
  }
}
