import { TreatmentInput } from '../../core/api/models';
import { TASKS_CONFIG } from './tasks.config';

export interface TreatmentFormValue {
  productId: string | null;
  doseValue: number | null;
  doseUnit: string;
  treatedAreaHa: number | null;
  appliedAt: Date;
}

export function emptyTreatmentForm(areaHa: number | undefined, today: Date): TreatmentFormValue {
  return {
    productId: null, doseValue: null, doseUnit: TASKS_CONFIG.defaultDoseUnit, treatedAreaHa: areaHa ?? null,
    appliedAt: today,
  };
}

export function toTreatmentInput(value: TreatmentFormValue): TreatmentInput | null {
  const { productId, doseValue, treatedAreaHa } = value;
  if (!productId || !doseValue || doseValue <= 0 || !treatedAreaHa || treatedAreaHa <= 0) return null;
  return {
    productId, doseValue, doseUnit: value.doseUnit, treatedAreaHa, appliedAt: value.appliedAt.toISOString().slice(0, 10),
  };
}
