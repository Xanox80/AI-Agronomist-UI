import { KeyValueStore } from '../offline-db';

/** In-memory KeyValueStore keyed by a field of the value (or an explicit key). */
export class InMemoryStore<T> implements KeyValueStore<T> {
  readonly data = new Map<string, T>();

  constructor(private readonly keyOf: (value: T) => string = () => { throw new Error('explicit key required'); }) {}

  async put(value: T, key?: string): Promise<void> { this.data.set(key ?? this.keyOf(value), value); }
  async get(key: string): Promise<T | undefined> { return this.data.get(key); }
  async getAll(): Promise<T[]> { return [...this.data.values()]; }
  async delete(key: string): Promise<void> { this.data.delete(key); }
  async count(): Promise<number> { return this.data.size; }
}
