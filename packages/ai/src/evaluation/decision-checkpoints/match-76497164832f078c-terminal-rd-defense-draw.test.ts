import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import d52CaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-76497164832f078c-52-terminal-rd-defense-draw.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type PersistedDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-capture-v1";
  provenance: "persisted_at_decision";
  actor: "corp";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: {
    sideSafeInput: true;
    inputMatchesActor: true;
    inputMatchesStateVersion: true;
    legalActionSetMatchesHistoricalAudit: true;
    humanPrivateHandExcluded: true;
  };
};

describe("match 76497164832f078c terminal R&D defense", () => {
  it("draws toward concrete terminal R&D defense before a remote score line", () => {
    const capture = structuredClone(d52CaptureJson) as PersistedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    expect(decision.actionId).toBe("corp.draw_card");
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:allocate_server_defense",
        "plan_assessment_evidence:corp_missing_concrete_defense_draw:rd",
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      instanceId: "plan:corp.defend_servers:server-defense-portfolio",
      moduleId: "corp.defend_servers",
      executionState: "executor",
    });
    const selectedLine =
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine;
    expect(selectedLine?.cursor).toMatchObject({ phaseIndex: 0, nodeIndex: 0 });
    expect(selectedLine?.phases.at(0)).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      rootModuleId: "corp.defend_servers",
      nodes: [{ semanticActionType: "draw.card" }],
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.commitment,
    ).toMatchObject({
      rematerialization: {
        status: "executable",
        actionId: "corp.draw_card",
      },
      observationClass: "scheduled_information_boundary",
    });
    expect(decision.decisionDebug?.planFirstDecision?.selectionAuthority).toBe(
      "turn_plan_commitment",
    );
    expect(decision.selectedChoices).toBeUndefined();
  });
});
