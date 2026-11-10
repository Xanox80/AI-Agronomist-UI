import { FieldContour, FieldDto, FieldInput, FieldSource } from '../../core/api/models';

export interface FieldFormModel {
  name: string;
  areaHa: number | null;
  cropId: string | null;
  variety: string;
  sowingDate: Date | null;
  nearWater: boolean;
  nearApiary: boolean;
  nearSettlement: boolean;
}

export const EMPTY_FIELD_FORM: FieldFormModel = {
  name: '', areaHa: null, cropId: null, variety: '', sowingDate: null, nearWater: false, nearApiary: false, nearSettlement: false,
};

export function formFromField(field: FieldDto): FieldFormModel {
  return {
    name: field.name,
    areaHa: field.areaHa,
    cropId: field.cropId ?? null,
    variety: field.variety ?? '',
    sowingDate: field.sowingDate ? parseIsoDate(field.sowingDate) : null,
    nearWater: field.nearWater,
    nearApiary: field.nearApiary,
    nearSettlement: field.nearSettlement,
  };
}

/** The backend accepts a manual area only for fields without a contour. */
export type FieldFormInput = FieldInput & { areaHa?: number };

export function inputFromForm(model: FieldFormModel, contour: FieldContour | undefined, source: FieldSource): FieldFormInput {
  return {
    name: model.name.trim(),
    areaHa: contour ? undefined : (model.areaHa ?? undefined),
    cropId: model.cropId ?? undefined,
    variety: model.variety.trim() || undefined,
    sowingDate: model.sowingDate ? formatIsoDate(model.sowingDate) : undefined,
    contour,
    source,
    nearWater: model.nearWater,
    nearApiary: model.nearApiary,
    nearSettlement: model.nearSettlement,
  };
}

/** Local calendar date as YYYY-MM-DD (no timezone shift). */
export function formatIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}
