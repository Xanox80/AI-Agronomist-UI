import { backoffDelayMs } from './backoff';

const policy = { baseMs: 2000, maxMs: 30000, factor: 2 };

describe('backoffDelayMs', () => {
  it('starts at the base delay on the first failure', () => {
    expect(backoffDelayMs(1, policy)).toBe(2000);
  });

  it('grows by the factor on every further failure', () => {
    expect(backoffDelayMs(2, policy)).toBe(4000);
    expect(backoffDelayMs(3, policy)).toBe(8000);
  });

  it('never exceeds the maximum', () => {
    expect(backoffDelayMs(20, policy)).toBe(30000);
  });

  it('treats zero attempts as the base delay', () => {
    expect(backoffDelayMs(0, policy)).toBe(2000);
  });
});
