import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import d184CaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b244055277fb21bd-01-terminal-remote-contest-d184.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
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
  validation: {
    snapshotHashMatches: true;
    sideSafeInput: true;
    inputMatchesActor: true;
    inputMatchesStateVersion: true;
    legalActionSetMatchesHistoricalAudit: true;
    actorStateMatchesHistoricalSnapshot: true;
    publicEventPrefixComplete: true;
    deckConsumersMatchPersistedProjection: true;
    humanPrivateHandExcluded: true;
  };
};

describe("match b244055277fb21bd terminal remote contest", () => {
  it("takes the already executable terminal contest instead of developing Broker", () => {
    const capture = structuredClone(
      d184CaptureJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe("runner.start_run.remote_1");
    expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:contest_remote",
        "plan_assessment_evidence:runner_terminal_remote_contest_mandatory:remote_1:runner.start_run.remote_1",
      ]),
    );
    expect(decision.evidence).not.toEqual(
      expect.arrayContaining(["plan_root_module:runner.credit_bank"]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      moduleId: "runner.contest_remote",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      rootModuleId: "runner.contest_remote",
      nodes: [{ semanticActionType: "run.start" }],
    });
  });
});
