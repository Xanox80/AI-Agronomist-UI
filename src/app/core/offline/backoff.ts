import { BackoffPolicy } from './offline.config';

/** Exponential delay for the given number of failed attempts (1 = first failure), capped at maxMs. */
export function backoffDelayMs(attempts: number, policy: BackoffPolicy): number {
  const exponent = Math.max(attempts - 1, 0);
  return Math.min(policy.baseMs * Math.pow(policy.factor, exponent), policy.maxMs);
}
