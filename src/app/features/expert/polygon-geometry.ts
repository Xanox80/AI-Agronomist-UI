import { AffectedRegion } from '../../core/api/models';
import { EXPERT_CONFIG } from './expert.config';

export interface NormalizedPoint { x: number; y: number }

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const round = (value: number): number => Number(value.toFixed(EXPERT_CONFIG.pointDecimals));

/** Converts a pointer position inside the image box to coordinates normalised to 0..1. */
export function toNormalizedPoint(
  clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number },
): NormalizedPoint | undefined {
  if (box.width <= 0 || box.height <= 0) return undefined;
  return { x: round(clamp01((clientX - box.left) / box.width)), y: round(clamp01((clientY - box.top) / box.height)) };
}

export function toSvgPoints(points: readonly NormalizedPoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function toAffectedRegion(points: readonly NormalizedPoint[], photoSeq: number): AffectedRegion | undefined {
  if (points.length < EXPERT_CONFIG.minPolygonVertices) return undefined;
  return { type: 'polygon', points: points.map((p) => ({ ...p })), photoSeq };
}
