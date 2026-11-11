/** A Map that keeps at most `max` entries, dropping the least recently used first. */
export class LruMap<K, V> {
  readonly #max: number;
  readonly #entries = new Map<K, V>();

  constructor(max: number) {
    this.#max = max;
  }

  /** Reads an entry and marks it as most recently used. */
  get(key: K): V | undefined {
    if (!this.#entries.has(key)) return undefined;
    const value = this.#entries.get(key)!;
    this.#entries.delete(key);
    this.#entries.set(key, value);
    return value;
  }

  /** Reads an entry without changing its place in the eviction order. */
  peek(key: K): V | undefined {
    return this.#entries.get(key);
  }

  /** Stores an entry as most recently used, then drops the oldest beyond `max`. */
  set(key: K, value: V): void {
    this.#entries.delete(key);
    this.#entries.set(key, value);
    while (this.#entries.size > this.#max)
      this.#entries.delete(this.#entries.keys().next().value!);
  }

  delete(key: K): boolean {
    return this.#entries.delete(key);
  }
}
