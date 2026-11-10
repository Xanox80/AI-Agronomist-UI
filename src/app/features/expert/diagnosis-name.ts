import { CatalogDiagnosisDto } from '../../core/api/models';

export function diagnosisName(
  diagnoses: readonly CatalogDiagnosisDto[], id: string | undefined, lang: string,
): string {
  const found = diagnoses.find((d) => d.id === id);
  if (!found) return '';
  return lang === 'en' ? found.nameEn : found.nameUk;
}
