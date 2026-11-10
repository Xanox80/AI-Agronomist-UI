import { emptyTreatmentForm, toTreatmentInput } from './treatment-form.model';

const today = new Date('2026-11-10T09:00:00Z');

describe('treatment form model', () => {
  it('prefills the treated area from the field area', () => {
    expect(emptyTreatmentForm(42.5, today).treatedAreaHa).toBe(42.5);
  });

  it('rejects a form without product, dose or area', () => {
    expect(toTreatmentInput(emptyTreatmentForm(undefined, today))).toBeNull();
    expect(toTreatmentInput({ ...emptyTreatmentForm(10, today), productId: 'p', doseValue: 0 })).toBeNull();
  });

  it('maps a valid form to a treatment with a date-only appliedAt', () => {
    const value = { ...emptyTreatmentForm(10, today), productId: 'p', doseValue: 1.5 };
    expect(toTreatmentInput(value)).toEqual({
      productId: 'p', doseValue: 1.5, doseUnit: 'l/ha', treatedAreaHa: 10, appliedAt: '2026-11-10',
    });
  });
});
