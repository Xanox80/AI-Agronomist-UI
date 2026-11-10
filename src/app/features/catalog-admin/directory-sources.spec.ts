import { isStale, productRows, thresholdRows } from './directory-sources';

describe('directory-sources', () => {
  const now = new Date('2026-11-10T00:00:00Z');

  it('treats a missing verification date as stale', () => {
    expect(isStale(undefined, 180, now)).toBe(true);
  });

  it('flags only data older than the stale limit', () => {
    expect(isStale('2026-10-01', 180, now)).toBe(false);
    expect(isStale('2026-01-01', 180, now)).toBe(true);
  });

  it('maps products with source, verification date and demo flag', () => {
    const rows = productRows([{
      id: 'p1', name: 'Fungex', activeSubstances: [{ nameUk: 'Тебуконазол' }], isDemo: true,
      source: 'demo_seed', verifiedAt: '2026-01-01',
    } as never]);
    expect(rows[0]).toMatchObject({ title: 'Fungex', detail: 'Тебуконазол', source: 'demo_seed', isDemo: true });
  });

  it('names a threshold by localized diagnosis and crop', () => {
    const rows = thresholdRows(
      [{ id: 't', diagnosisId: 'd', cropId: 'c', bbchFrom: 30, bbchTo: 39, thresholdValue: 10, unit: '%' } as never],
      [{ id: 'd', nameUk: 'Іржа', nameEn: 'Rust' } as never],
      [{ id: 'c', nameUk: 'Пшениця', nameEn: 'Wheat' } as never],
      'en',
    );
    expect(rows[0].title).toBe('Rust / Wheat');
    expect(rows[0].detail).toBe('BBCH 30-39: 10 %');
  });
});
