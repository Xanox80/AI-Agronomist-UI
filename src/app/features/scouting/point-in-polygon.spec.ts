import { FieldContour } from '../../core/api/models';
import { contourContains } from './point-in-polygon';

const square = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
const hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];

describe('contourContains', () => {
  it('detects a point inside a polygon using lng/lat order', () => {
    const contour: FieldContour = { type: 'Polygon', coordinates: [square] };
    expect(contourContains(contour, { lat: 2, lng: 8 })).toBe(true);
  });

  it('rejects a point outside the polygon', () => {
    const contour: FieldContour = { type: 'Polygon', coordinates: [square] };
    expect(contourContains(contour, { lat: 2, lng: 11 })).toBe(false);
  });

  it('rejects a point that falls into a hole', () => {
    const contour: FieldContour = { type: 'Polygon', coordinates: [square, hole] };
    expect(contourContains(contour, { lat: 5, lng: 5 })).toBe(false);
  });

  it('matches any polygon of a multipolygon', () => {
    const far = square.map(([x, y]) => [x + 100, y]);
    const contour: FieldContour = { type: 'MultiPolygon', coordinates: [[square], [far]] };
    expect(contourContains(contour, { lat: 5, lng: 105 })).toBe(true);
    expect(contourContains(contour, { lat: 5, lng: 50 })).toBe(false);
  });
});
