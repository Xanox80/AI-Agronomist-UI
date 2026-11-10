import { FieldDto } from '../../core/api/models';
import { EMPTY_FIELD_FORM, formFromField, formatIsoDate, inputFromForm, parseIsoDate } from './field-form.model';

describe('field form model', () => {
  it('round-trips a calendar date without timezone shift', () => {
    expect(formatIsoDate(parseIsoDate('2026-03-05'))).toBe('2026-03-05');
  });

  it('trims text and omits empty optional values', () => {
    const input = inputFromForm({ ...EMPTY_FIELD_FORM, name: '  North  ', variety: ' ' }, undefined, 'manual');
    expect(input.name).toBe('North');
    expect(input.variety).toBeUndefined();
    expect(input.cropId).toBeUndefined();
    expect(input.sowingDate).toBeUndefined();
  });

  it('sends the manual area only when there is no contour', () => {
    const model = { ...EMPTY_FIELD_FORM, name: 'A', areaHa: 7.5 };
    expect(inputFromForm(model, undefined, 'manual').areaHa).toBe(7.5);
    const contour = { type: 'Polygon', coordinates: [] } as FieldDto['contour'];
    expect(inputFromForm(model, contour, 'drawn').areaHa).toBeUndefined();
  });

  it('maps a field to form values and back', () => {
    const field = {
      id: '1', name: 'Field A', areaHa: 5, cropId: 'c1', variety: 'V', sowingDate: '2026-04-10',
      source: 'drawn', nearWater: true, nearApiary: false, nearSettlement: false,
    } as FieldDto;
    const input = inputFromForm(formFromField(field), field.contour, field.source);
    expect(input).toMatchObject({ name: 'Field A', cropId: 'c1', variety: 'V', sowingDate: '2026-04-10', nearWater: true });
  });
});
