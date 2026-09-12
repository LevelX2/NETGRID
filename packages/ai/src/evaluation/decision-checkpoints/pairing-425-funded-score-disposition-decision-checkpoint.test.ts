import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-425-funded-score-disposition-d196.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("classifies the displaced basic advance using the same funded conversion as its score parent", () => {
  const capture = structuredClone(captureJson) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  expect(decision).toMatchObject({
    actionId:
      "corp.play_operation.corp_onr_v1_281_accounts-receivable_1.corp_onr_v1_281_accounts-receivable_1.onr_v1_281_accounts-receivable:abilities_on_play_gain_credits",
    fallbackUsed: false,
  });
  expect(
    capture.input.legalActions.some(
      (action) => action.actionId === decision.actionId,
    ),
  ).toBe(true);
  const plan = decision.decisionDebug?.planFirstDecision;
  expect(plan).toMatchObject({
    rootPlanInstanceId:
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_206_marine-arcology_1%3Aremote_1",
    leafExecutorInstanceId:
      "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_v1_206_marine-arcology_1%3Aremote_1",
    turnPlanning: {
      coverage: {
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      },
    },
  });
  expect(plan?.dispositions).toContainEqual(
    expect.objectContaining({
      actionId:
        "corp.advance_card.corp_onr_v1_206_marine-arcology_1.corp_onr_v1_206_marine-arcology_1",
      ownerModuleId: "corp.score_agenda",
      disposition: "explicitly_nonproductive",
      evidenceCode:
        "corp_same_turn_score_conversion_requires_committed_first_step:place_advancement",
    }),
  );
});
