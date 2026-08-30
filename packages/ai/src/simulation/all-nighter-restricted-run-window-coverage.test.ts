import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("All-Nighter restricted run-window plan-first coverage", () => {
  it("declines an observed hybrid continuation with no payoff and never fabricates a missing bonus window", () => {
    const slotId = "strategy_panel_hybrid_score_punish_cheap_bag";
    const seed = "ai-behavior-baseline-v1-05";
    const maxActions = 128;
    const slot = listMatchProgressionBenchmarkDeckSlots().find(
      (candidate) => candidate.slotId === slotId,
    );
    if (!slot) throw new Error(`Missing benchmark slot ${slotId}`);
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateAiGame({
      seed,
      maxActions,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: maxActions }, (_, index) => index),
        capture: (snapshot) => {
          captures.push(snapshot);
        },
      },
    });
    const actionId =
      "runner.start_run.archives.bonus_run.onr_v1_076_all-nighter";
    const capture = captures.find((snapshot) =>
      snapshot.input.legalActions.some(
        (action) => action.actionId === actionId,
      ),
    );

    if (!capture) {
      expect(
        summary.actionSequence.some((entry) =>
          entry.selectedActionId?.includes("onr_v1_076_all-nighter"),
        ),
      ).toBe(false);
      expect(summary.errors).toEqual([]);
      expect(summary.runtimeFailures).toEqual([]);
      return;
    }
    expect(capture.state.timingPoint).toBe("runner_action.main");
    expect(capture.input.playerView.run).toBeUndefined();
    expect(capture.input.legalActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId,
          side: "runner",
          type: "start_run",
          costs: [],
          payload: expect.objectContaining({
            serverId: "archives",
            effectKind: "run",
            restrictedActionGrantActionType: "start_run",
            restrictedActionGrantCostProfile: "no_click",
            restrictedActionGrantRemainingActions: 1,
          }),
        }),
      ]),
    );

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stateVersionBefore: capture.state.stateVersion,
          actionType: "trigger_ability",
          planKind: "runner.convert_run_window",
          reasonCode: "plan_first.runner.convert_run_window",
          fallbackUsed: false,
          evidence: expect.arrayContaining([
            "plan_action_assessment_evidence:runner_optional_bonus_run_decline",
            "plan_action_assessment_evidence:runner_optional_bonus_run_decline_preserves_ordinary_actions",
            `plan_first_executor:plan:runner.convert_run_window:run%3A${capture.state.stateVersion}`,
            `plan_first_root:plan:runner.convert_run_window:run%3A${capture.state.stateVersion}`,
            "plan_step_capability:continue_engine_restricted_run_sequence",
            `plan_step_id:plan:runner.convert_run_window:run%3A${capture.state.stateVersion}:convert`,
          ]),
        }),
      ]),
    );
  }, 30_000);
});
