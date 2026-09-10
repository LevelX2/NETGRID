import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import d43CaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-match-f291a822-d43-hq-defense.json";
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
  actor: "corp";
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

const INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ =
  "corp.install_card.corp_onr_proteus_032_misleading-access-menus_1.hq.corp_onr_proteus_032_misleading-access-menus_1.0";

describe("match f291a822 HQ defense allocation", () => {
  it("protects the exposed HQ before an unsupported score-remote staging route", () => {
    const capture = structuredClone(
      d43CaptureJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    expect(capture.validation.humanPrivateHandExcluded).toBe(true);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe(INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["plan_step_capability:allocate_server_defense"]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.defend_servers",
      instanceId: "plan:corp.defend_servers:server-defense-portfolio",
    });
    expect(decision.decisionDebug?.planFirstDecision?.selectionAuthority).toBe(
      "turn_plan_commitment",
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      rootModuleId: "corp.defend_servers",
      nodes: [{ semanticActionType: "install.card" }],
    });
  });
});
