import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import d114CaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d602f9af7bf40b06-01-prebuild-remote-d114.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildRemoteDoctrineProfile } from "../../remote-doctrine-profile";
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

const INSTALL_NERVE_LABYRINTH =
  "corp.install_card.corp_onr_v1_257_nerve-labyrinth_1.remote_2.corp_onr_v1_257_nerve-labyrinth_1.1";

describe("match d602f9af7bf40b06 strategic remote prebuild", () => {
  it("draws for the missing concrete HQ defense before prebuilding another remote", () => {
    const capture = structuredClone(
      d114CaptureJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    capture.input.ownRemoteDoctrineProfile = buildRemoteDoctrineProfile({
      ...(capture.input.ownDeckStrategyProfile
        ? { strategyProfile: capture.input.ownDeckStrategyProfile }
        : {}),
      ...(capture.input.ownDeckCapabilities
        ? { deckCapabilities: capture.input.ownDeckCapabilities }
        : {}),
      ...(capture.input.ownStrategicIntentState
        ? { strategicIntentState: capture.input.ownStrategicIntentState }
        : {}),
      plannerEffect: "plan_portfolio",
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe("corp.draw_card");
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:allocate_server_defense",
        "plan_assessment_evidence:corp_missing_concrete_defense_draw:hq",
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.defend_servers",
      instanceId: "plan:corp.defend_servers:server-defense-portfolio",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      rootModuleId: "corp.defend_servers",
      nodes: [{ semanticActionType: "draw.card" }],
    });
    expect(decision.actionId).not.toBe(INSTALL_NERVE_LABYRINTH);
  });
});
