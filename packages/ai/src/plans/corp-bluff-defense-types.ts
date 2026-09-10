/** A Defense-owned, requoted single-layer budget, consumed by the Ambush parent. */
export type CorpBluffDefenseNeed = Readonly<{
  serverId: string;
  sourceInstanceId: string;
  iceInstanceId: string;
  observedAtStateVersion: number;
  requiredCredits: number;
  fundingGap: number;
  encounterCredits: number;
  runnerCreditTax?: number;
  outcome: "access_cost" | "visible_stop" | "paid_encounter_opportunity";
}>;

