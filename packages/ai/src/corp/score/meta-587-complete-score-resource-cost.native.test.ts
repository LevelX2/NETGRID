import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta587-complete-score-resource-cost.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
it("finishes the equally valuable installed agenda through the cheaper complete score route", () => {
  const cp = capture();
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input);
  const advance = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "advance_card" &&
      a.source === "corp_onr_proteus_007_project-venice_1",
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(advance.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const p = decision.decisionDebug!.planFirstDecision!;
  expect(p.selectionAuthority).toBe("turn_plan_commitment");
  expect(p.selectedPlan!.moduleId).toBe("corp.score_agenda");
  expect(p.rootPlanInstanceId).toBe(
    "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_007_project-venice_1%3Aremote_1",
  );
  expect(p.leafExecutorInstanceId).toBe(p.rootPlanInstanceId);
  expect(p.selectedStep!.stepId).toContain(":advance_agenda");
  expect(p.route).toMatchObject({
    actionId: advance.actionId,
    stateVersion: 161,
    planInstanceId: p.rootPlanInstanceId,
  });
  expect(JSON.stringify(input)).toBe(before);
});
