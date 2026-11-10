/** Wizard steps in display order; the flow length and the template switch both derive from this list. */
export const SCOUTING_STEPS = ['field', 'object', 'photos', 'note'] as const;

export type ScoutingStep = (typeof SCOUTING_STEPS)[number];
