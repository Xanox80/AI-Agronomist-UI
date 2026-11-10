import { FieldContour, LatLng, PageQuery } from './common';
import { FieldSource } from './enums';

export interface FieldDto {
  id: string;
  clientId?: string;
  name: string;
  areaHa: number;
  cropId?: string;
  cropCode?: string;
  variety?: string;
  sowingDate?: string;
  contour?: FieldContour;
  centroid?: LatLng;
  source: FieldSource;
  nearWater: boolean;
  nearApiary: boolean;
  nearSettlement: boolean;
}

export type FieldInput = Partial<Omit<FieldDto, 'id' | 'areaHa' | 'cropCode'>> & Pick<FieldDto, 'name'>;
export type FieldPatch = Partial<FieldInput>;
export interface FieldsQuery extends PageQuery { q?: string; cropId?: string }
export interface FieldImportResult {
  imported: FieldDto[];
  skipped: { index: number; reason: string }[];
}
export interface FieldLocateResult { matches: { fieldId: string; name: string }[] }
export interface CropMemoryDto { cropId?: string }
