import { expect, it } from "vitest";
import purgeCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-purge-action-debt.json";
import creditCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-upfront-credit-admission.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  {
    id: "SP-290",
    checkpoint: purgeCheckpoint as unknown,
    stateVersion: 232,
    actionId:
      "corp.advance_card.corp_onr_v1_209_political-coup_1.corp_onr_v1_209_political-coup_1",
    leaf: "plan:corp.score_agenda:agenda%3Acorp_onr_v1_209_political-coup_1%3Aremote_1",
    step: "advance_agenda",
    capability: "advance_score_agenda",
  },
  {
    id: "SP-291",
    checkpoint: creditCheckpoint as unknown,
    stateVersion: 152,
    actionId:
      "corp.play_operation.corp_onr_v1_281_accounts-receivable_2.corp_onr_v1_281_accounts-receivable_2.onr_v1_281_accounts-receivable:abilities_on_play_gain_credits",
    leaf: "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_v1_209_political-coup_1%3Aremote_1",
    step: "fund",
    capability: "develop_or_convert_corp_economy",
  },
])(
  "$id chooses an executable current resource line under its existing owner",
  ({ checkpoint, stateVersion, actionId, leaf, step, capability }) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    const root =
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_209_political-coup_1%3Aremote_1";
    expect(
      input.legalActions.some((action) => action.actionId === actionId),
    ).toBe(true);
    expect(decision).toMatchObject({
      actionId,
      fallbackUsed: false,
      timeoutUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root,
          leafExecutorInstanceId: leaf,
          selectedStep: { planInstanceId: leaf, stepId: `${leaf}:${step}` },
          route: {
            actionId,
            stateVersion,
            planInstanceId: leaf,
            capabilityId: capability,
          },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
            search: { selectedLineStepCount: 1 },
          },
        },
      },
    });
    if (stateVersion === 232) {
      const turn = decision.decisionDebug!.planFirstDecision!.turnPlanning!;
      const purgeLines = turn.consideredLines!.filter(
        (line) => line.firstActionId === "corp.purge_runner_virus_counters",
      );
      expect(purgeLines.length).toBeGreaterThan(0);
      expect(purgeLines.every((line) => line.stepCount === 1)).toBe(true);
    }
  },
);
