import { CropDto } from '../../core/api/models';

export function cropName(crops: readonly CropDto[], cropId: string | undefined, lang: string): string {
  const crop = crops.find((c) => c.id === cropId);
  if (!crop) return '';
  return lang === 'en' ? crop.nameEn : crop.nameUk;
}
