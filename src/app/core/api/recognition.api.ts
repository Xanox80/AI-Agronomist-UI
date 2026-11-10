import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { AnswerQuestionsRequest, DiagnosisResultDto, RecognitionStatusDto } from './models';

@Injectable({ providedIn: 'root' })
export class RecognitionApi extends ApiClient {
  diagnose(observationId: string): Observable<DiagnosisResultDto> {
    return this.http.post<DiagnosisResultDto>(this.url(`/observations/${observationId}/diagnose`), {});
  }

  getDiagnosis(observationId: string): Observable<DiagnosisResultDto> {
    return this.http.get<DiagnosisResultDto>(this.url(`/observations/${observationId}/diagnosis`));
  }

  answerQuestions(resultId: string, body: AnswerQuestionsRequest): Observable<DiagnosisResultDto> {
    return this.http.post<DiagnosisResultDto>(this.url(`/diagnoses/${resultId}/answers`), body);
  }

  refine(observationId: string): Observable<DiagnosisResultDto> {
    return this.http.post<DiagnosisResultDto>(this.url(`/observations/${observationId}/refine`), {});
  }

  status(): Observable<RecognitionStatusDto> {
    return this.http.get<RecognitionStatusDto>(this.url('/recognition/status'));
  }
}
