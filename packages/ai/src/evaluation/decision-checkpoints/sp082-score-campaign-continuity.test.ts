import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import fundingCaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-03-game36-cross-turn-score-funding.json";
import closedGapCaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-04-game36-funding-gap-closed.json";
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

const SCORE_ROOT =
  "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";
const SCORE_SUPPORT =
  "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";
const SCORE_NEED =
  "score-support:agenda:corp_onr_proteus_005_marked-accounts_1:remote_1";

function decide(
  source: unknown,
): { capture: ReconstructedDecisionCapture; decision: AiDecision } {
  const capture = structuredClone(source) as ReconstructedDecisionCapture;
  const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
  expect(deckSnapshotId).toBeDefined();
  expect(capture.validation).toMatchObject({
    snapshotHashMatches: true,
    sideSafeInput: true,
    humanPrivateHandExcluded: true,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);
  return {
    capture,
    decision: chooseAiAction(capture.input as AiDecisionInput),
  };
}

describe("SP-082 score campaign continuity checkpoints", () => {
  it("keeps an exactly quoted current funding head bound across the opponent turn", () => {
    const first = decide(fundingCaptureJson);
    const second = decide(fundingCaptureJson);

    expect(first.capture.stateVersion).toBe(117);
    expect(first.decision).toMatchObject({
      actionId: "corp.gain_credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(first.decision.decisionDebug).toMatchObject({
      planKind: "corp.economy",
      planFirstDecision: {
        selectedPlan: {
          moduleId: "corp.economy",
          instanceId: SCORE_SUPPORT,
        },
      },
    });
    expect(first.decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${SCORE_ROOT}`,
        `plan_first_executor:${SCORE_SUPPORT}`,
        `plan_priority_delegated_from:${SCORE_ROOT}`,
        `plan_priority_need:${SCORE_NEED}`,
        `plan_step_id:${SCORE_SUPPORT}:fund`,
      ]),
    );
    expect(
      first.decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine,
    ).toMatchObject({
      phases: [
        {
          rootPlanInstanceId: SCORE_ROOT,
          nodes: [
            {
              semanticActionType: "economy.gain_credit",
            },
          ],
        },
      ],
    });
    expect(second.decision).toEqual(first.decision);
  });

  it("ends the score-labelled funding need as soon as the exact gap is closed", () => {
    const { capture, decision } = decide(closedGapCaptureJson);

    expect(capture.stateVersion).toBe(118);
    expect(decision).toMatchObject({
      actionId: "corp.gain_credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(decision.decisionDebug).toMatchObject({
      planKind: "corp.economy",
      planFirstDecision: {
        selectedPlan: {
          moduleId: "corp.economy",
          instanceId:
            "plan:corp.economy:economy-residual-capacity%3Acorp%3A12",
        },
      },
    });
    expect(decision.evidence).not.toEqual(
      expect.arrayContaining([
        `plan_first_executor:${SCORE_SUPPORT}`,
        `plan_priority_delegated_from:${SCORE_ROOT}`,
      ]),
    );
  });
});
