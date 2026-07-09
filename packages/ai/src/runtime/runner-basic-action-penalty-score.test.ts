import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerBasicActionPenaltyScoreComponents } from "./runner-basic-action-penalty-score";

describe("runnerBasicActionPenaltyScoreComponents", () => {
  it("penalizes continuing through an end-the-run subroutine when a break is legal", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([
      continueRun,
      action("break_subroutine", { encounterWillEndRun: false }),
    ]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_continue_run_ends_run_with_break_available",
          value: -2500,
          reason: "break_or_pump_available",
        }),
      ]),
    );
  });

  it("penalizes continuing through an end-the-run subroutine when a pump can lead to a break", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([
      continueRun,
      action("pump_breaker", { encounterWillEndRun: false }),
    ]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_continue_run_ends_run_with_break_available",
          value: -2500,
          reason: "break_or_pump_available",
        }),
      ]),
    );
  });

  it("does not penalize the only legal continue through an encounter", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([continueRun]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ).some(
        (component) =>
          component.key ===
          "runner_continue_run_ends_run_with_break_available",
      ),
    ).toBe(false);
  });

  it("penalizes basic setup when a high-priority central pressure goal is ready", () => {
    const gain = action("gain_credit");
    gain.source = "basic_action";
    const run = action("start_run", { serverId: "rd" });
    const input = inputWithActions([gain, run]);
    input.playerView.own.credits = 8;
    (input as AiDecisionInput & { ownRunnerTacticalGoals: unknown[] })
      .ownRunnerTacticalGoals = [
      {
        goalId: "runner.pressure_good_central_target",
        priority: 900,
        targetServerId: "rd",
      },
    ];

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        gain,
        "basic_economy_draw",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_basic_setup_over_ready_pressure",
          value: -1200,
          reason: expect.stringContaining("target:rd"),
        }),
      ]),
    );
  });
});

function inputWithActions(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions,
    playerView: { own: { clicks: 1, credits: 0 } },
  } as AiDecisionInput;
}

function action(
  type: LegalAction["type"],
  payload: Record<string, unknown> = {},
): LegalAction {
  return {
    actionId: `runner.${type}`,
    side: "runner",
    type,
    payload,
  } as LegalAction;
}
