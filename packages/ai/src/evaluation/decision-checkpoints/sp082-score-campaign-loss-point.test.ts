import { describe, expect, it } from "vitest";

import game36Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-01-game36-score-parent-funding-gap.json";
import game34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-02-game34-score-parent-funding-gap.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("SP-082 score-campaign loss-point checkpoints", () => {
  it("binds game 36's exact current funding step to the known score-conversion floor", () => {
    const result = runAiDecisionCheckpoint(fixture(game36Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("gain_credit");

    const planFirst = result.decision?.decisionDebug?.planFirstDecision;
    const scoreParent = planFirst?.portfolio.find(
      (instance) =>
        instance.moduleId === "corp.score_agenda" &&
        instance.phase === "install_agenda" &&
        instance.target?.id === "rules_legal_score_action",
    );
    const supportLeaf = planFirst?.selectedPlan;
    expect(scoreParent).toMatchObject({
      viability: "ready",
      portfolioRole: "foreground",
      openNeedIds: [
        "score-support:agenda:corp_onr_proteus_005_marked-accounts_1:remote_1",
      ],
    });
    expect(planFirst?.rootPlanInstanceId).toBe(scoreParent?.instanceId);
    expect(supportLeaf).toMatchObject({
      moduleId: "corp.economy",
      parentInstanceId: scoreParent?.instanceId,
      parentNeedId:
        "score-support:agenda:corp_onr_proteus_005_marked-accounts_1:remote_1",
      executionState: "executor",
    });
    expect(planFirst?.leafExecutorInstanceId).toBe(supportLeaf?.instanceId);
    expect(
      planFirst?.turnPlanning?.selectedLine.phases[0]?.supportBindings[0],
    ).toMatchObject({
      planInstanceId: supportLeaf?.instanceId,
      parentNeedId: supportLeaf?.parentNeedId,
    });
  });

  it("retains game 34 as the remaining maturity-support loss point", () => {
    const result = runAiDecisionCheckpoint(fixture(game34Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("gain_credit");
    const planFirst = result.decision?.decisionDebug?.planFirstDecision;
    expect(planFirst?.rootPlanInstanceId).toMatch(
      /^plan:corp\.economy:economy-immediate-operation/,
    );
    const blockedScoreParents = planFirst?.portfolio.filter(
      (instance) =>
        instance.moduleId === "corp.score_agenda" &&
        instance.phase === "install_agenda" &&
        instance.viability === "blocked",
    );
    expect(blockedScoreParents).toHaveLength(2);
    expect(
      blockedScoreParents?.every((parent) => parent.openNeedIds.length === 0),
    ).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
