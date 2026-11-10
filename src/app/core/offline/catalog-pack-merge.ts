import { CatalogPackDto } from '../api/models';

type EntityKey = Exclude<keyof CatalogPackDto, 'regionCode' | 'version' | 'publishedAt' | 'deleted'>;

const ENTITY_KEYS: readonly EntityKey[] = [
  'crops', 'bbch', 'diagnoses', 'thresholds', 'products', 'registrations', 'activeSubstances', 'referenceImages',
];

/** Applies a delta pack onto the cached one: upsert by id, then drop the ids listed under `deleted`. */
export function mergePack(cached: CatalogPackDto | undefined, delta: CatalogPackDto): CatalogPackDto {
  if (!cached) return { ...delta, deleted: {} };
  const merged: CatalogPackDto = { ...delta, deleted: {} };
  for (const key of ENTITY_KEYS) {
    const byId = new Map<string, { id: string }>((cached[key] as { id: string }[]).map((row) => [row.id, row]));
    for (const row of delta[key] as { id: string }[]) byId.set(row.id, row);
    for (const id of delta.deleted[key] ?? []) byId.delete(id);
    (merged[key] as { id: string }[]) = [...byId.values()];
  }
  return merged;
}
