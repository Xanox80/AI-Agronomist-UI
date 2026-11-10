import { ContourSketch } from './contour-sketch';

describe('ContourSketch', () => {
  const a = { lat: 0, lng: 0 };
  const b = { lat: 0, lng: 1 };
  const c = { lat: 1, lng: 1 };

  it('does not mutate the previous sketch when a point is added', () => {
    const empty = new ContourSketch();
    expect(empty.add(a).points).toHaveLength(1);
    expect(empty.points).toHaveLength(0);
  });

  it('builds a polygon only from three or more points', () => {
    expect(new ContourSketch().add(a).add(b).toPolygon()).toBeUndefined();
    expect(new ContourSketch().add(a).add(b).add(c).toPolygon()?.type).toBe('Polygon');
  });

  it('undoes the last point and clears all points', () => {
    const sketch = new ContourSketch().add(a).add(b);
    expect(sketch.undo().points).toEqual([a]);
    expect(sketch.clear().points).toEqual([]);
  });
});
