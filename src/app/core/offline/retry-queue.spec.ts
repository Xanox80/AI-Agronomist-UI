import { InMemoryStore } from './__fixtures__/in-memory-store';
import { RetryQueue, Retryable } from './retry-queue';

interface Entry extends Retryable { id: string; createdAt: string }

function queue(): RetryQueue<Entry> {
  const store = new InMemoryStore<Entry>((entry) => entry.id);
  return new RetryQueue(store, (entry) => entry.id, () => ({ baseMs: 1000, maxMs: 8000, factor: 2 }), (entry) => entry.createdAt, 3);
}

const entry = (id: string, createdAt: string, nextAttemptAt = 0): Entry => ({ id, createdAt, attempts: 0, nextAttemptAt });

describe('RetryQueue', () => {
  it('returns due entries oldest first and honours the limit', async () => {
    const q = queue();
    await q.add(entry('b', '2026-01-02'));
    await q.add(entry('a', '2026-01-01'));
    await q.add(entry('c', '2026-01-03'));
    expect((await q.due(0, 2)).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('keeps a failed entry hidden until its backoff has elapsed', async () => {
    const q = queue();
    await q.add(entry('a', '2026-01-01'));
    await q.markFailed('a', 10_000);
    expect(await q.due(10_500, 10)).toEqual([]);
    const [retried] = await q.due(11_000, 10);
    expect(retried.attempts).toBe(1);
  });

  it('doubles the delay on repeated failures', async () => {
    const q = queue();
    await q.add(entry('a', '2026-01-01'));
    await q.markFailed('a', 0);
    await q.markFailed('a', 0);
    expect(await q.due(1999, 10)).toEqual([]);
    expect(await q.due(2000, 10)).toHaveLength(1);
  });

  it('removes finished entries and counts the rest', async () => {
    const q = queue();
    await q.add(entry('a', '2026-01-01'));
    await q.add(entry('b', '2026-01-02'));
    await q.remove('a');
    expect(await q.count()).toBe(1);
  });

  it('ignores failure marks for unknown entries', async () => {
    const q = queue();
    await expect(q.markFailed('missing', 0)).resolves.toBeUndefined();
    expect(await q.count()).toBe(0);
  });

  it('stops retrying after the maximum attempts and reports the entry as stuck', async () => {
    const q = queue();
    await q.add(entry('a', '2026-01-01'));
    for (let i = 0; i < 3; i++) await q.markFailed('a', 0);
    expect(await q.due(Number.MAX_SAFE_INTEGER, 10)).toEqual([]);
    expect(await q.count()).toBe(0);
    expect(await q.stuckCount()).toBe(1);
  });
});
