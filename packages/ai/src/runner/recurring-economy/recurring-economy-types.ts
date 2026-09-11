export type RunnerRecurringEconomySignal = {
  commitmentId: string;
  definitionId: string;
  commitmentActive: boolean;
  phase: "install" | "hold";
  actionIds: string[];
  priorityClass: "P3" | "P4" | "P5";
  value: number;
  evidenceCodes: string[];
  investmentHorizon: Readonly<{
    installCost: number;
    earliestPayout: "start_of_runner_turn" | "next_compatible_icebreaker_use";
    projectedHoldTurns: number;
    invalidatingActionType: "start_run" | "none";
    realizedPayoutCount: number;
    realizedValue: number;
    futureValueAtRisk: number;
    bestVisibleRunPayoff: number;
    decision: "install" | "wait" | "allow_run" | "preempt_for_urgent_run";
  }>;
};

export type RecurringEconomyState = {
  kind: "recurring_economy";
  phase: RunnerRecurringEconomySignal["phase"];
  signal: RunnerRecurringEconomySignal;
};
