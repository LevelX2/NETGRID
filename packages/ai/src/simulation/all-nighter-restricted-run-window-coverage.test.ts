import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("All-Nighter restricted run-window plan-first coverage", () => {
  it("converts the deterministic hybrid central-origin continuation without a remote-disposition conflict", () => {
    const slotId = "strategy_panel_hybrid_score_punish_cheap_bag";
    const seed = "ai-behavior-baseline-v1-05";
    const maxActions = 27;
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

    expect(capture).toBeDefined();
    if (!capture) {
      throw new Error(`Missing ${slotId}/${seed} All-Nighter run window`);
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
          actionType: "start_run",
          planKind: "runner.convert_run_window",
          reasonCode: "plan_first.runner.convert_run_window",
          fallbackUsed: false,
          evidence: expect.arrayContaining([
            "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_remaining:1",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_cost_profile:no_click",
            "plan_step_capability:continue_engine_restricted_run_sequence",
          ]),
        }),
      ]),
    );
  }, 30_000);
});
