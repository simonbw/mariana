export class Counter<K> {
  counts = new Map<K, number>();

  constructor() {}

  increment(key: K, amount: number = 1) {
    if (!this.counts.has(key)) {
      this.counts.set(key, 1);
    } else {
      this.counts.set(key, this.counts.get(key)! + 1);
    }
  }

  get(key: K): number {
    return this.counts.get(key) ?? 0;
  }

  entries() {
    return this.counts.entries();
  }
}
