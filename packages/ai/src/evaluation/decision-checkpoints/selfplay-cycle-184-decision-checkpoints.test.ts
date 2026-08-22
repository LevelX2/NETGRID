import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import emptyGripRdJackOutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-01-empty-grip-rd-jack-out-d43.json";
import confirmedDamageTaxedDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-02-confirmed-damage-taxed-draw-d164.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  provenance: "reconstructed_from_persisted_decision_sources";
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("selfplay cycle 184 decision checkpoints", () => {
  it("jacks out before unknown central access with an empty grip under critical damage pressure", () => {
    const capture = structuredClone(
      emptyGripRdJackOutJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.jack_out",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
          leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_39",
          selectedStep: {
            planInstanceId: "plan:runner.convert_run_window:run%3Arun_39",
            parentInstanceId: "plan:runner.pressure_central:central%3Ard",
          },
          route: {
            actionType: "jack_out",
            capabilityId: "convert_active_run_window",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "runner_critical_empty_grip_unknown_central_access_requires_jack_out",
        ),
      ]),
    );
  });

  it("does not treat a guaranteed draw-tax tag as defensive hand buffering under confirmed damage pressure", () => {
    const capture = structuredClone(
      confirmedDamageTaxedDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.gain_credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          leafExecutorInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          route: {
            actionType: "gain_credit",
            capabilityId: "gain_general_liquid_credits",
          },
        },
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.portfolio.find(
        (plan) => plan.moduleId === "runner.defense_and_recovery",
      ),
    ).toBeUndefined();
  });
});
