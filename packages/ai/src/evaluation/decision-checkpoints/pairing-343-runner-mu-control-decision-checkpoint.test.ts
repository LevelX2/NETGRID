import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-343-king-road-mu-control-d226.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1";
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "runner";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("pairing 343 Runner strategic MU control checkpoint", () => {
  it("does not force MU support when the current R&D route is already economical", () => {
    const capture = structuredClone(
      captureJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const portfolio = residentPlanPortfolioSnapshot(capture.input);

    expect(decision).toMatchObject({
      actionId: "runner.start_run.rd",
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:pressure_rd_access",
        "plan_assessment_evidence:target:rd",
      ]),
    );
    expect(
      portfolio?.instances.some(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      ),
    ).toBe(false);
    expect(
      decision.decisionDebug?.actionAlternatives?.find((alternative) =>
        alternative.actionId.includes("wutech-mem-chip"),
      ),
    ).toMatchObject({
      selected: false,
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner_install_has_no_bound_development_or_specialized_plan",
        ),
      ]),
    });
  });
});
