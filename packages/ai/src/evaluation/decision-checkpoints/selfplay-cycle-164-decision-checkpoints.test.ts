import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import brainDrainInformationBudgetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-164-01-brain-drain-information-budget-d201.json";
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

describe("selfplay cycle 164 decision checkpoints", () => {
  it("keeps visible random core damage mitigation above an information-probe spend limit", () => {
    const capture = structuredClone<unknown>(
      brainDrainInformationBudgetJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    expect(
      capture.input.playerView.run?.encounteredIce?.effectiveRunQuote?.subroutines.map(
        (s) => s.id,
      ),
    ).toEqual(["0"]);
    const continuation = capture.input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    expect(continuation.payload?.unbrokenSubroutineCount).toBe(1);
    expect(continuation.encounterSubroutineIds).toEqual(["0"]);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId:
        "rj.c1n5.c1n5.c1n5.c2l.348",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
          leafExecutorInstanceId:
            "p9nlmml78ptx7h1ghtu23kmpnw",
          route: {
            actionType: "pump_breaker",
            capabilityId: "convert_active_run_window",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:runner_visible_encounter_requires_mitigation:11",
      ]),
    );
  });
});
