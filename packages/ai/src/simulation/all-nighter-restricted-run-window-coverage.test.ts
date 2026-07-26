import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("All-Nighter restricted run-window plan-first coverage", () => {
  it.each([
    {
      label: "Fast Advance central-origin continuation",
      slotId: "strategy_panel_fast_advance_chrome_rush",
      seed: "ai-behavior-baseline-v1-03",
      actionIndex: 51,
    },
    {
      label: "Hybrid central-origin continuation",
      slotId: "strategy_panel_hybrid_score_punish_cheap_bag",
      seed: "ai-behavior-baseline-v1-05",
      actionIndex: 12,
    },
  ])(
    "converts the exact $label state without a remote-disposition conflict",
    ({ slotId, seed, actionIndex }) => {
      const slot = listMatchProgressionBenchmarkDeckSlots().find(
        (candidate) => candidate.slotId === slotId,
      );
      if (!slot) throw new Error(`Missing benchmark slot ${slotId}`);
      const resolved = resolveBenchmarkDeckSlot(slot);
      if (!resolved.ok) throw new Error(resolved.reason);

      let capture: AiSimulationDecisionCheckpointCapture | undefined;
      const summary = simulateAiGame({
        seed,
        maxActions: actionIndex + 2,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
        ...resolved.config,
        testOnlyDecisionCheckpointCapture: {
          actionIndices: [actionIndex],
          capture: (snapshot) => {
            capture = snapshot;
          },
        },
      });

      expect(capture).toBeDefined();
      if (!capture) {
        throw new Error(
          `Missing ${slotId}/${seed} stateVersion-${actionIndex} capture`,
        );
      }
      expect(capture.state.stateVersion).toBe(actionIndex);
      expect(capture.state.timingPoint).toBe("runner_action.main");
      expect(capture.input.playerView.run).toBeUndefined();
      expect(capture.input.legalActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actionId:
              "runner.start_run.remote_1.bonus_run.onr_v1_076_all-nighter",
            side: "runner",
            type: "start_run",
            costs: [],
            payload: expect.objectContaining({
              serverId: "remote_1",
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
            stateVersionBefore: actionIndex,
            actionType: "start_run",
            planKind: "runner.convert_run_window",
            reasonCode: "plan_first.runner.convert_run_window",
            fallbackUsed: false,
            evidence: expect.arrayContaining([
              "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
              "plan_action_assessment_evidence:runner_restricted_run_sequence_remaining:1",
              "plan_step_capability:continue_engine_restricted_run_sequence",
            ]),
          }),
        ]),
      );
    },
    30_000,
  );
});
