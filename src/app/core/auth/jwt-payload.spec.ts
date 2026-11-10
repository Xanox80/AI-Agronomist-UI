import { decodeJwtPayload } from './jwt-payload';

function tokenWith(claims: object): string {
  return `header.${btoa(JSON.stringify(claims))}.signature`;
}

describe('decodeJwtPayload', () => {
  it('returns the role claim of a valid token', () => {
    expect(decodeJwtPayload(tokenWith({ sub: 'u1', role: 'expert' }))?.role).toBe('expert');
  });

  it('drops an unknown role value', () => {
    expect(decodeJwtPayload(tokenWith({ role: 'admin' }))?.role).toBeUndefined();
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('a.%%%.c')).toBeNull();
  });
});
