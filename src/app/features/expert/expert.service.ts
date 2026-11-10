import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { ExpertApi } from '../../core/api/expert.api';
import {
  CatalogDiagnosisDto, CreateLabelRequest, CropDto, ExpertCaseDto, ExpertCaseStatus, LabelDto, UserDto,
} from '../../core/api/models';
import { EXPERT_CONFIG } from './expert.config';

/** Queue order: highest priority first, then oldest. */
export function sortQueue(cases: readonly ExpertCaseDto[]): ExpertCaseDto[] {
  return [...cases].sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));
}

@Injectable({ providedIn: 'root' })
export class ExpertService {
  private readonly api = inject(ExpertApi);
  private readonly catalog = inject(CatalogApi);
  private readonly auth = inject(AuthApi);
  private readonly http = inject(HttpClient);

  async queue(status: ExpertCaseStatus | undefined): Promise<ExpertCaseDto[]> {
    const page = await firstValueFrom(this.api.cases({ status, pageSize: EXPERT_CONFIG.pageSize }));
    return sortQueue(page.items);
  }

  getCase(id: string): Promise<ExpertCaseDto> {
    return firstValueFrom(this.api.getCase(id));
  }

  claim(id: string): Promise<ExpertCaseDto> {
    return firstValueFrom(this.api.claim(id));
  }

  addLabel(id: string, request: CreateLabelRequest): Promise<LabelDto> {
    return firstValueFrom(this.api.addLabel(id, request));
  }

  resolve(id: string, finalDiagnosisId: string): Promise<ExpertCaseDto> {
    return firstValueFrom(this.api.resolve(id, { finalDiagnosisId }));
  }

  diagnoses(): Promise<CatalogDiagnosisDto[]> {
    return firstValueFrom(this.catalog.diagnoses());
  }

  crops(): Promise<CropDto[]> {
    return firstValueFrom(this.catalog.crops());
  }

  me(): Promise<UserDto> {
    return firstValueFrom(this.auth.me());
  }

  /** Photos are farm-scoped, so they are fetched through the auth interceptor and shown as object URLs. */
  async photoObjectUrl(photoUrl: string): Promise<string> {
    const blob = await firstValueFrom(this.http.get(photoUrl, { responseType: 'blob' }));
    return URL.createObjectURL(blob);
  }
}
