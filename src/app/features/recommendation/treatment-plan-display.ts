import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/** What the treatment-plan panel shows after a request: the plan itself, or why there is none. */
export type TreatmentPlanFailure = 'unavailable' | 'error';

/** 503 means Groq is not configured or not answering: a known state, not a broken screen. */
export function treatmentPlanFailure(error: unknown): TreatmentPlanFailure {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.ServiceUnavailable ? 'unavailable' : 'error';
}
