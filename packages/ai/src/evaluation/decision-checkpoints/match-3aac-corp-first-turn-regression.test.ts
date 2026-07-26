import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3aac-01-corp-first-turn-no-premature-end-d4.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match 3aac Corp first-turn regression evidence", () => {
  it("uses one exact score-material observation step instead of completing the turn", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(checkpoint.difficulty).toBe("hard");
    expect(result.input.playerView.own.clicks).toBe(2);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("draw_card");
    const portfolio = residentPlanPortfolioSnapshot(result.input);
    const scoreRootInstanceId = "plan:corp.score_agenda:general";
    const scoreMaterialNeedId = "score-material:general";
    const drawLeafInstanceId =
      "plan:corp.hand_and_agenda_management:draw-for-score-material";
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    const scoreRoot = portfolio?.instances.find(
      (instance) => instance.instanceId === scoreRootInstanceId,
    );
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: scoreRootInstanceId,
      executorInstanceId: drawLeafInstanceId,
    });
    expect(scoreRoot).toMatchObject({
      moduleId: "corp.score_agenda",
      dedupeKey: "general",
      phase: "select_agenda",
      persistencePolicy: "sticky_goal",
      openNeedIds: [scoreMaterialNeedId],
    });
    expect(executor).toMatchObject({
      moduleId: "corp.hand_and_agenda_management",
      parentInstanceId: scoreRootInstanceId,
      parentNeedId: scoreMaterialNeedId,
      persistencePolicy: "flexible_support",
      moduleState: {
        kind: "hand",
        signal: {
          handPlanId: "draw-for-score-material",
          uncertainty: {
            kind: "draw_then_observe",
            unknownOutcome: "drawn_card_identity",
            revalidateAfterCurrentHead: true,
          },
          drawAttemptState: {
            turnKey: "corp:0",
            remainingAttempts: 0,
            selectedAtStateVersion: 4,
          },
          evidenceCode: "corp_score_campaign_missing_agenda_material",
        },
      },
    });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${scoreRootInstanceId}`,
        `plan_first_executor:${drawLeafInstanceId}`,
        `plan_priority_delegated_from:${scoreRootInstanceId}`,
        `plan_priority_need:${scoreMaterialNeedId}`,
        "plan_assessment_evidence:corp_score_campaign_missing_agenda_material",
      ]),
    );
    expect(JSON.stringify(portfolio)).not.toContain(
      '"immediateDefenseConversion":true',
    );
  });
});
