import { CropDto } from '../../core/api/models';
import { cropName } from './crop-name';

describe('cropName', () => {
  const crops = [{ id: 'c1', code: 'maize', nameUk: 'Кукурудза', nameEn: 'Maize' }] as CropDto[];

  it('returns the name in the active language', () => {
    expect(cropName(crops, 'c1', 'uk')).toBe('Кукурудза');
    expect(cropName(crops, 'c1', 'en')).toBe('Maize');
  });

  it('returns an empty string for an unknown crop', () => {
    expect(cropName(crops, undefined, 'uk')).toBe('');
  });
});
