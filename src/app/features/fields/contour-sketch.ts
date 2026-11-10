import type { Polygon } from 'geojson';
import { LatLng } from '../../core/api/models';
import { polygonFromPoints } from './contour-geometry';

/** Immutable vertex list for a contour being drawn on the map. */
export class ContourSketch {
  constructor(readonly points: readonly LatLng[] = []) {}

  add(point: LatLng): ContourSketch {
    return new ContourSketch([...this.points, point]);
  }

  undo(): ContourSketch {
    return new ContourSketch(this.points.slice(0, -1));
  }

  clear(): ContourSketch {
    return new ContourSketch();
  }

  toPolygon(): Polygon | undefined {
    return polygonFromPoints(this.points);
  }
}
