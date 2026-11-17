export function isHoldoutSeed(
  seed: string,
  holdoutSeeds: readonly string[],
): boolean {
  return holdoutSeeds.includes(seed);
}
