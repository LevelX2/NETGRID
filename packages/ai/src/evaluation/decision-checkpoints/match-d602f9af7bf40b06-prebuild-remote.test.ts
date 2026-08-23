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

const REMOTE_PARENT_ID =
  "plan:corp.establish_scoring_remote:strategic-score-remote";
const REMOTE_NEED_ID = "remote-hardening:strategic-score-remote:0";
const INSTALL_NERVE_LABYRINTH =
  "corp.install_card.corp_onr_v1_257_nerve-labyrinth_1.remote_2.corp_onr_v1_257_nerve-labyrinth_1.1";

describe("match d602f9af7bf40b06 strategic remote prebuild", () => {
  it("installs Nerve Labyrinth before the payload through the resident remote parent's defense route", () => {
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

    expect(decision.actionId).toBe(INSTALL_NERVE_LABYRINTH);
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P6",
        `plan_priority_delegated_from:${REMOTE_PARENT_ID}`,
        `plan_priority_need:${REMOTE_NEED_ID}`,
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.defend_servers",
      parentInstanceId: REMOTE_PARENT_ID,
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: REMOTE_PARENT_ID,
      rootModuleId: "corp.establish_scoring_remote",
      nodes: [{ semanticActionType: "install.card" }],
    });
  });
});
