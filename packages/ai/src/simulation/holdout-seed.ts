export function isHoldoutSeed(
  seed: string,
  holdoutSeeds: readonly string[],
): boolean {
  const holdoutSeedSet = new Set(holdoutSeeds);
  return holdoutSeedSet.has(seed);
}
