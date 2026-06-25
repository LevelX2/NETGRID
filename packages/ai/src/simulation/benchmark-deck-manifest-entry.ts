export function benchmarkDeckManifestEntry<
  TEntry extends { readonly localDeckId: string },
>(entries: readonly TEntry[], localDeckId: string): TEntry | undefined {
  return entries.find((entry) => entry.localDeckId === localDeckId);
}
