import { describe, expect, it } from "vitest";
import { runnerRecurringEconomyRunDeferral } from "./recurring-economy-run-deferral";
import type { RunnerRecurringEconomySignal } from "./recurring-economy-types";

describe("recurring income owner run deferral", () => {
  it("defers a run for an active waiting investment with value at risk", () => {
    expect(runnerRecurringEconomyRunDeferral([signal()])).toBe(
      "runner_recurring_economy_defers_run_until_payout:income-source",
    );
  });

  it.each(["allow_run", "preempt_for_urgent_run"] as const)(
    "releases the run when the investment owner decides %s",
    (decision) => {
      const investment = signal();
      investment.investmentHorizon = {
        ...investment.investmentHorizon,
        decision,
      };
      expect(runnerRecurringEconomyRunDeferral([investment])).toBeUndefined();
    },
  );

  it("does not defer runs for an uninstalled source or exhausted future value", () => {
    const uninstalled = signal();
    uninstalled.commitmentActive = false;
    const exhausted = signal();
    exhausted.investmentHorizon = {
      ...exhausted.investmentHorizon,
      futureValueAtRisk: 0,
    };
    expect(
      runnerRecurringEconomyRunDeferral([uninstalled, exhausted]),
    ).toBeUndefined();
  });
});

function signal(): RunnerRecurringEconomySignal {
  return {
    commitmentId: "income-1",
    definitionId: "income-source",
    commitmentActive: true,
    phase: "hold",
    actionIds: [],
    priorityClass: "P3",
    value: 700,
    evidenceCodes: [],
    investmentHorizon: {
      installCost: 1,
      earliestPayout: "start_of_runner_turn",
      projectedHoldTurns: 1,
      invalidatingActionType: "start_run",
      realizedPayoutCount: 0,
      realizedValue: 0,
      futureValueAtRisk: 2,
      bestVisibleRunPayoff: 0,
      decision: "wait",
    },
  };
}
