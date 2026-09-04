import { describe, expect, it } from "vitest";

import game36Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-01-game36-score-parent-funding-gap.json";
import game34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-02-game34-score-parent-funding-gap.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("SP-082 score-campaign loss-point checkpoints", () => {
  it.each([
    ["game 36", game36Json],
    ["game 34", game34Json],
  ])(
    "reproduces the unbound economy head while a concrete score parent is blocked in %s",
    (_label, json) => {
      const result = runAiDecisionCheckpoint(
        structuredClone(json) as AiDecisionCheckpointV1,
      );

      expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
      expect(result.selectedAction?.type).toBe("gain_credit");

      const planFirst = result.decision?.decisionDebug?.planFirstDecision;
      expect(planFirst?.rootPlanInstanceId).toMatch(
        /^plan:corp\.economy:economy-(visible-liquidity-development|immediate-operation)/,
      );
      const blockedScoreParent = planFirst?.portfolio.find(
        (instance) =>
          instance.moduleId === "corp.score_agenda" &&
          instance.phase === "install_agenda" &&
          instance.viability === "blocked",
      );
      expect(blockedScoreParent).toBeDefined();
      expect(blockedScoreParent?.openNeedIds).toEqual([]);
      expect(blockedScoreParent?.blockers).toContain(
        "corp_score_route_unavailable",
      );

      expect(
        planFirst?.turnPlanning?.heads.some(
          (head) =>
            head.executorParentPlanInstanceId ===
            blockedScoreParent?.instanceId,
        ),
      ).toBe(false);
      expect(planFirst?.turnPlanning?.coverage.progressRoots).toEqual([]);
    },
  );
});
