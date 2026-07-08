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
});

function inputWithActions(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions,
    playerView: { own: { clicks: 1 } },
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
