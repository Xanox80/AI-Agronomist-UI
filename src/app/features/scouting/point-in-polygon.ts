import { FieldContour, LatLng } from '../../core/api/models';

type Ring = number[][];

function ringContains(ring: Ring, point: LatLng): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygonContains(rings: Ring[], point: LatLng): boolean {
  const [outer, ...holes] = rings;
  return !!outer && ringContains(outer, point) && !holes.some((hole) => ringContains(hole, point));
}

/** Offline field link (FR-21): ray casting over GeoJSON [lng, lat] rings. */
export function contourContains(contour: FieldContour, point: LatLng): boolean {
  return contour.type === 'Polygon'
    ? polygonContains(contour.coordinates, point)
    : contour.coordinates.some((polygon) => polygonContains(polygon, point));
}
