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
  it("stages exact score protection before the remote score child", () => {
    const capture = structuredClone(d52CaptureJson) as PersistedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe(
      "corp.install_card.corp_onr_v1_243_fetch-4-0-1_2.remote_1.corp_onr_v1_243_fetch-4-0-1_2.2",
    );
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:develop_score_protection",
        "plan_priority_class:P4",
        "plan_assessment_evidence:score_protection_staging_install:agenda:corp_onr_v1_207_netwatch-operations-office_1:remote_1:remote_1:development_risk_unmodeled_access_path",
        "plan_scheduler:route:install.card:plan:corp.defend_servers:server-defense-portfolio",
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      instanceId: "plan:corp.defend_servers:server-defense-portfolio",
      moduleId: "corp.defend_servers",
      executionState: "executor",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine,
    ).toMatchObject({
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases: [
        {
          rootPlanInstanceId:
            "plan:corp.score_agenda:agenda%3Acorp_onr_v1_207_netwatch-operations-office_1%3Aremote_1",
          rootModuleId: "corp.score_agenda",
          transitionKind: "projected_plan_discovery_required",
          supportBindings: [
            {
              planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
            },
          ],
          nodes: [
            {
              semanticActionType: "install.card",
            },
          ],
        },
      ],
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.commitment,
    ).toMatchObject({
      rematerialization: {
        status: "executable",
        actionId:
          "corp.install_card.corp_onr_v1_243_fetch-4-0-1_2.remote_1.corp_onr_v1_243_fetch-4-0-1_2.2",
      },
      observationClass: "expected_no_material_change",
    });
    expect(decision.decisionDebug?.planFirstDecision?.selectionAuthority).toBe(
      "turn_plan_commitment",
    );
    expect(decision.selectedChoices).toBeUndefined();
  });
});
