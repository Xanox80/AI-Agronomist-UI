import { angleKeyFor, hintKeysFor, OBJECT_TYPES } from './object-types';

describe('object-types', () => {
  it('lists the six capture objects', () => {
    expect(OBJECT_TYPES).toEqual(['leaf', 'ear', 'stem', 'fruit', 'pest', 'field']);
  });

  it('gives four contextual hint keys per object type', () => {
    expect(hintKeysFor('pest')).toEqual([
      'scouting.hints.pest.frame', 'scouting.hints.pest.distance', 'scouting.hints.pest.light', 'scouting.hints.pest.extra',
    ]);
  });

  it('names the angle prompt of the n-th photo', () => {
    expect(angleKeyFor(2)).toBe('scouting.angles.2');
  });
});
