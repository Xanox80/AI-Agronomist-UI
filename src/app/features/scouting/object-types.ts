import { ScoutingOrgan } from './scouting.types';

export const OBJECT_TYPES: readonly ScoutingOrgan[] = ['leaf', 'ear', 'stem', 'fruit', 'pest', 'field'];

const HINT_TOPICS = ['frame', 'distance', 'light', 'extra'] as const;

/** Translation keys of the contextual capture hints for an object type (FR-1). */
export function hintKeysFor(organ: ScoutingOrgan): string[] {
  return HINT_TOPICS.map((topic) => `scouting.hints.${organ}.${topic}`);
}

/** Translation key recommending the angle of the n-th photo (FR-3), 1-based. */
export function angleKeyFor(seq: number): string {
  return `scouting.angles.${seq}`;
}
