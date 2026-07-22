import { describe, expect, it } from "vitest";

import {
  compareActionDemandPriority,
  createCorpActionDemand,
  createRunnerActionDemand,
} from "./action-demand";

describe("action demands", () => {
  it("ranks an acute score blocker above a phase reserve", () => {
    const closeout = createCorpActionDemand({
      demandId: "corp:score-closeout",
      sourcePlanId: "corp:score-remote",
      purpose: "current_score_closeout",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions: 2,
      targetActions: 3,
      requiredActionTypes: ["advance_card", "score_agenda"],
    });
    const reserve = createCorpActionDemand({
      demandId: "corp:reserve",
      purpose: "phase_reserve",
      priority: "phase_reserve",
      hardness: "soft",
      deadline: "within_three_own_turns",
      currentActions: 2,
      targetActions: 4,
    });

    expect([reserve, closeout].sort(compareActionDemandPriority)).toEqual([
      closeout,
      reserve,
    ]);
    expect(closeout.gap).toBe(1);
  });

  it("normalizes Runner restrictions and action types without conflating them", () => {
    const demand = createRunnerActionDemand({
      demandId: "runner:install-breaker",
      purpose: "current_breaker_install",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentActions: 0,
      targetActions: 1,
      acceptedRestrictions: [
        "unrestricted",
        "program_install_only",
        "unrestricted",
      ],
      requiredActionTypes: ["install_card", "install_card"],
    });

    expect(demand).toMatchObject({
      schemaVersion: "action-demand-v1",
      side: "runner",
      gap: 1,
      acceptedRestrictions: ["unrestricted", "program_install_only"],
      requiredActionTypes: ["install_card"],
    });
  });

  it("marks an already sufficient Engine action total as gap-free", () => {
    expect(
      createCorpActionDemand({
        demandId: "corp:five-actions",
        purpose: "foreground_plan",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        currentActions: 5,
        targetActions: 4,
      }).gap,
    ).toBe(0);
  });
});
