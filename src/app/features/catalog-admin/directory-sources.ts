import { CatalogApi } from '../../core/api/catalog.api';
import { CatalogDiagnosisDto, CropDto, ProductDto, ThresholdDto } from '../../core/api/models';
import { firstValueFrom } from 'rxjs';
import { CATALOG_ADMIN_CONFIG, DirectoryId } from './catalog-admin.config';

export interface DirectoryRow {
  id: string;
  title: string;
  detail: string;
  source?: string;
  verifiedAt?: string;
  isDemo: boolean;
}

export type DirectorySource = (api: CatalogApi, lang: string) => Promise<DirectoryRow[]>;

const localized = (item: { nameUk: string; nameEn: string }, lang: string): string =>
  lang === 'en' ? item.nameEn : item.nameUk;

export function diagnosisRows(diagnoses: readonly CatalogDiagnosisDto[], lang: string): DirectoryRow[] {
  return diagnoses.map((d) => ({
    id: d.id, title: localized(d, lang), detail: d.latinName ?? d.code, isDemo: false,
  }));
}

export function thresholdRows(
  thresholds: readonly ThresholdDto[], diagnoses: readonly CatalogDiagnosisDto[], crops: readonly CropDto[], lang: string,
): DirectoryRow[] {
  const nameOf = (list: readonly { id: string; nameUk: string; nameEn: string }[], id: string) => {
    const found = list.find((item) => item.id === id);
    return found ? localized(found, lang) : id;
  };
  return thresholds.map((t) => ({
    id: t.id,
    title: `${nameOf(diagnoses, t.diagnosisId)} / ${nameOf(crops, t.cropId)}`,
    detail: `BBCH ${t.bbchFrom}-${t.bbchTo}: ${t.thresholdValue} ${t.unit}`,
    isDemo: false,
  }));
}

export function productRows(products: readonly ProductDto[]): DirectoryRow[] {
  return products.map((p) => ({
    id: p.id,
    title: p.name,
    detail: p.activeSubstances.map((s) => s.nameUk).join(', '),
    source: p.source,
    verifiedAt: p.verifiedAt,
    isDemo: p.isDemo,
  }));
}

export const DIRECTORY_SOURCES: Record<DirectoryId, DirectorySource> = {
  diagnoses: async (api, lang) => diagnosisRows(await firstValueFrom(api.diagnoses()), lang),
  thresholds: async (api, lang) => {
    const [thresholds, diagnoses, crops] = await Promise.all([
      firstValueFrom(api.thresholds()), firstValueFrom(api.diagnoses()), firstValueFrom(api.crops()),
    ]);
    return thresholdRows(thresholds, diagnoses, crops, lang);
  },
  products: async (api) => productRows(await firstValueFrom(api.products())),
};

export function isStale(verifiedAt: string | undefined, staleAfterDays: number, now: Date): boolean {
  if (!verifiedAt) return true;
  return (now.getTime() - new Date(verifiedAt).getTime()) / CATALOG_ADMIN_CONFIG.millisPerDay > staleAfterDays;
}
