/** Consume the current public prevention pools once, in damage order. */
export function projectVisibleDamagePrevention(
  amount: number,
  damageType: string | undefined,
  pools: { netOrCore: number; run: number },
): { damage: number; netOrCore: number; run: number } {
  const typed =
    damageType === "net" || damageType === "core"
      ? Math.min(amount, pools.netOrCore)
      : 0;
  const run = Math.min(amount - typed, pools.run);
  return {
    damage: amount - typed - run,
    netOrCore: pools.netOrCore - typed,
    run: pools.run - run,
  };
}
