import { toAffectedRegion, toNormalizedPoint, toSvgPoints } from './polygon-geometry';

describe('polygon-geometry', () => {
  const box = { left: 100, top: 50, width: 200, height: 100 };

  it('normalises a pointer position relative to the image box', () => {
    expect(toNormalizedPoint(200, 100, box)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('clamps pointer positions outside the image to the 0..1 range', () => {
    expect(toNormalizedPoint(0, 1000, box)).toEqual({ x: 0, y: 1 });
  });

  it('returns nothing for an empty image box', () => {
    expect(toNormalizedPoint(1, 1, { ...box, width: 0 })).toBeUndefined();
  });

  it('formats points for an svg polygon', () => {
    expect(toSvgPoints([{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }])).toBe('0.1,0.2 0.3,0.4');
  });

  it('builds a region only from three or more points', () => {
    const two = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    expect(toAffectedRegion(two, 1)).toBeUndefined();
    expect(toAffectedRegion([...two, { x: 0, y: 1 }], 2)).toMatchObject({ type: 'polygon', photoSeq: 2 });
  });
});
