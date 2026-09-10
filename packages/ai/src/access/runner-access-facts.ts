/** Side-safe facts published by the access-payoff owner, never parsed from evidence. */
export type RunnerAccessFacts = {
  knownTargetDefinitionIds: string[];
  /** General credits; dedicated trash pools have already been deducted by the owner. */
  trashBudget: number | "unknown" | "not_applicable";
};
