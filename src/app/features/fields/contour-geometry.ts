import type { Polygon, Position } from 'geojson';
import { FieldContour, FieldDto, LatLng } from '../../core/api/models';
import { FIELDS_CONFIG } from './fields.config';

export interface MapFeature {
  id: string;
  name: string;
  contour: FieldContour;
}

export function toMapFeatures(fields: readonly FieldDto[]): MapFeature[] {
  return fields.flatMap((f) => (f.contour ? [{ id: f.id, name: f.name, contour: f.contour }] : []));
}

/** Builds a closed GeoJSON polygon (lng/lat) from drawn vertices, or undefined when too few. */
export function polygonFromPoints(points: readonly LatLng[]): Polygon | undefined {
  if (points.length < FIELDS_CONFIG.minContourVertices) return undefined;
  const ring: Position[] = points.map((p) => [p.lng, p.lat]);
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
}

/** Geodesic area in hectares: outer rings minus holes, spherical excess approximation. */
export function contourAreaHa(contour: FieldContour | undefined): number {
  if (!contour) return 0;
  const polygons = contour.type === 'Polygon' ? [contour.coordinates] : contour.coordinates;
  const squareMeters = polygons.reduce((sum, rings) => sum + polygonAreaM2(rings), 0);
  return squareMeters / FIELDS_CONFIG.squareMetersPerHectare;
}

function polygonAreaM2(rings: Position[][]): number {
  const [outer, ...holes] = rings;
  return Math.max(0, ringAreaM2(outer) - holes.reduce((sum, hole) => sum + ringAreaM2(hole), 0));
}

function ringAreaM2(ring: Position[] | undefined): number {
  if (!ring || ring.length < FIELDS_CONFIG.minContourVertices + 1) return 0;
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i].map(toRadians);
    const [lng2, lat2] = ring[i + 1].map(toRadians);
    total += (lng2 - lng1) * (FIELDS_CONFIG.areaTermBase + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * FIELDS_CONFIG.earthRadiusM ** 2) / 2);
}

function toRadians(degrees: number): number {
  return degrees * FIELDS_CONFIG.radiansPerDegree;
}
