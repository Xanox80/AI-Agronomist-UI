import { parseProposalPayload } from './proposal-payload';

describe('parseProposalPayload', () => {
  it('returns the object for valid JSON', () => {
    expect(parseProposalPayload('{"nameUk":"Іржа"}')).toEqual({ nameUk: 'Іржа' });
  });

  it('rejects malformed JSON', () => {
    expect(parseProposalPayload('{oops')).toBeNull();
  });

  it('rejects arrays and primitives', () => {
    expect(parseProposalPayload('[1]')).toBeNull();
    expect(parseProposalPayload('5')).toBeNull();
    expect(parseProposalPayload('null')).toBeNull();
  });
});
