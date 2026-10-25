/** Shared by actual scoring and public definition quotes; no game-state access. */
export function overadvanceAgendaPointBonus(
  advancementCounters: number,
  effectiveAdvancementRequirement: number,
  perExcessAdvancementCounters: number,
): number {
  return Math.floor(
    Math.max(0, advancementCounters - effectiveAdvancementRequirement) /
      perExcessAdvancementCounters,
  );
}
