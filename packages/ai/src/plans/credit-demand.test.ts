import { describe, expect, it } from "vitest";

import {
  compareCreditDemandPriority,
  createCorpCreditDemand,
  createRunnerCreditDemand,
} from "./credit-demand";

describe("credit demands", () => {
  it("ranks an acute breaker need above a general phase reserve", () => {
    const breaker = createRunnerCreditDemand({
      demandId: "runner:breaker",
      sourcePlanId: "runner:contest-remote",
      purpose: "breaker_for_current_plan",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentCredits: 2,
      targetCredits: 6,
    });
    const reserve = createRunnerCreditDemand({
      demandId: "runner:reserve",
      purpose: "phase_reserve",
      priority: "phase_reserve",
      hardness: "soft",
      deadline: "within_three_own_turns",
      currentCredits: 2,
      targetCredits: 8,
    });

    expect([reserve, breaker].sort(compareCreditDemandPriority)).toEqual([
      breaker,
      reserve,
    ]);
    expect(breaker.priorityRank).toBeGreaterThan(reserve.priorityRank);
    expect(breaker.gap).toBe(4);
  });

  it("uses the same normalized contract for Corp and Runner", () => {
    const corp = createCorpCreditDemand({
      demandId: "corp:rez",
      purpose: "current_rez_window",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: 3.9,
      targetCredits: 7.8,
      acceptedCreditRestrictions: ["general", "restricted", "general"],
    });

    expect(corp).toMatchObject({
      schemaVersion: "credit-demand-v1",
      side: "corp",
      currentCredits: 3,
      targetCredits: 7,
      gap: 4,
      acceptedCreditRestrictions: ["general", "restricted"],
    });
  });

  it("marks an already available target as gap-free", () => {
    expect(
      createRunnerCreditDemand({
        demandId: "runner:funded",
        purpose: "current_run",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "before_current_plan_action",
        currentCredits: 8,
        targetCredits: 5,
      }).gap,
    ).toBe(0);
  });

  it("fails closed when a credit amount is not finite", () => {
    expect(() =>
      createRunnerCreditDemand({
        demandId: "runner:invalid",
        purpose: "current_run",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "before_current_plan_action",
        currentCredits: 3,
        targetCredits: Number.NaN,
      }),
    ).toThrow(/credit demand value must be finite/);
  });
});
