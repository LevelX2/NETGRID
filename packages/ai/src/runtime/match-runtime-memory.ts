const releaseStores = new Set<(matchId: string) => void>();

/** Process memory belongs to one match even when its opaque key has more parts. */
export class MatchRuntimeMemory<T> {
  private readonly entries = new Map<string, { matchId: string; value: T }>();

  constructor() {
    releaseStores.add((matchId) => {
      for (const [key, entry] of this.entries) {
        if (entry.matchId === matchId) this.entries.delete(key);
      }
    });
  }

  get(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }

  set(key: string, value: T, matchId: string): void {
    this.entries.set(key, { matchId, value });
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

export function releaseAiMatchRuntime(matchId: string): void {
  for (const release of releaseStores) release(matchId);
}
