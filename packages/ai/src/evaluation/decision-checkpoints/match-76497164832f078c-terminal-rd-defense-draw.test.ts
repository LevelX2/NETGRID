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
  it("takes the engine-certified terminal remote score line", () => {
    const capture = structuredClone(d52CaptureJson) as PersistedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    expect(decision.actionId).toBe(
      "corp.install_card.corp_onr_v1_207_netwatch-operations-office_1.remote_2.corp_onr_v1_207_netwatch-operations-office_1",
    );
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:install_score_agenda",
        "plan_priority_class:P4",
        "plan_assessment_evidence:corp_engine_certified_mature_remote_score_install:remote_2",
        "plan_scheduler:route:install.card:plan:corp.score_agenda:agenda%3Acorp_onr_v1_207_netwatch-operations-office_1%3Aremote_2",
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      instanceId:
        "plan:corp.score_agenda:agenda%3Acorp_onr_v1_207_netwatch-operations-office_1%3Aremote_2",
      moduleId: "corp.score_agenda",
      executionState: "executor",
    });
    const selectedLine =
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine;
    expect(selectedLine?.cursor).toMatchObject({ phaseIndex: 0, nodeIndex: 0 });
    expect(selectedLine?.phases.at(0)).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Acorp_onr_v1_207_netwatch-operations-office_1%3Aremote_2",
      rootModuleId: "corp.score_agenda",
      nodes: [{ semanticActionType: "install.card" }],
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.commitment,
    ).toMatchObject({
      rematerialization: {
        status: "executable",
        actionId:
          "corp.install_card.corp_onr_v1_207_netwatch-operations-office_1.remote_2.corp_onr_v1_207_netwatch-operations-office_1",
      },
      observationClass: "expected_no_material_change",
    });
    expect(decision.decisionDebug?.planFirstDecision?.selectionAuthority).toBe(
      "turn_plan_commitment",
    );
    expect(decision.selectedChoices).toBeUndefined();
  });
});
