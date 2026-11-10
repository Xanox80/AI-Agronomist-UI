import { CatalogPackDto } from '../api/models';
import { mergePack } from './catalog-pack-merge';

function pack(version: number, overrides: Partial<CatalogPackDto> = {}): CatalogPackDto {
  return {
    regionCode: 'UA-DEFAULT', version, publishedAt: '2026-01-01T00:00:00Z',
    crops: [], bbch: [], diagnoses: [], thresholds: [], products: [], registrations: [],
    activeSubstances: [], referenceImages: [], deleted: {}, ...overrides,
  };
}
const crop = (id: string, nameUk: string) => ({ id, code: id, nameUk, nameEn: id });

describe('mergePack', () => {
  it('uses the full pack as is when nothing is cached', () => {
    const full = pack(1, { crops: [crop('a', 'A')] });
    expect(mergePack(undefined, full).crops).toHaveLength(1);
  });

  it('adds new rows and replaces changed ones by id', () => {
    const cached = pack(1, { crops: [crop('a', 'old'), crop('b', 'B')] });
    const delta = pack(2, { crops: [crop('a', 'new'), crop('c', 'C')] });
    const merged = mergePack(cached, delta);
    expect(merged.version).toBe(2);
    expect(merged.crops.map((c) => [c.id, c.nameUk])).toEqual([['a', 'new'], ['b', 'B'], ['c', 'C']]);
  });

  it('drops rows the server reports as deleted', () => {
    const cached = pack(1, { crops: [crop('a', 'A'), crop('b', 'B')] });
    const merged = mergePack(cached, pack(2, { deleted: { crops: ['a'] } }));
    expect(merged.crops.map((c) => c.id)).toEqual(['b']);
  });
});
