import { FieldDto } from '../../core/api/models';
import { contourAreaHa, polygonFromPoints, toMapFeatures } from './contour-geometry';

const SQUARE_KM_IN_HA = 100;
const square = polygonFromPoints([
  { lat: 0, lng: 0 }, { lat: 0, lng: 0.008983 }, { lat: 0.008983, lng: 0.008983 }, { lat: 0.008983, lng: 0 },
])!;

describe('contour geometry', () => {
  it('returns undefined for fewer than three vertices', () => {
    expect(polygonFromPoints([{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }])).toBeUndefined();
  });

  it('closes the ring and uses lng/lat order', () => {
    const ring = polygonFromPoints([{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, { lat: 5, lng: 6 }])!.coordinates[0];
    expect(ring[0]).toEqual([2, 1]);
    expect(ring[ring.length - 1]).toEqual(ring[0]);
  });

  it('computes about one square kilometre near the equator', () => {
    expect(contourAreaHa(square)).toBeCloseTo(SQUARE_KM_IN_HA, 0);
  });

  it('subtracts holes and returns 0 without a contour', () => {
    const outer = square.coordinates[0];
    const withHole = { type: 'Polygon' as const, coordinates: [outer, [...outer].reverse()] };
    expect(contourAreaHa(withHole)).toBe(0);
    expect(contourAreaHa(undefined)).toBe(0);
  });

  it('sums the polygons of a multipolygon', () => {
    const multi = { type: 'MultiPolygon' as const, coordinates: [square.coordinates, square.coordinates] };
    expect(contourAreaHa(multi)).toBeCloseTo(2 * contourAreaHa(square), 5);
  });

  it('maps only fields that have a contour', () => {
    const fields = [
      { id: 'a', name: 'A', contour: square },
      { id: 'b', name: 'B' },
    ] as FieldDto[];
    expect(toMapFeatures(fields).map((f) => f.id)).toEqual(['a']);
  });
});
