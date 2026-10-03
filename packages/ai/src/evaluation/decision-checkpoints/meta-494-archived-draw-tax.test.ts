import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { visibleRunnerDrawTaxSourceCount } from "../../runtime/ai-feature-server";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";

afterEach(resetResidentPlanPortfolioMemory);
it.each([
  [28, 20],
  [29, 215],
])("ignores retired draw-tax sources in native G%i D%i", (g, d) => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-494-r1-g${g}-d${d}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const meat = input.legalActions.find((a: { actionId: string }) =>
    a.actionId.includes("meat-upgrade"),
  )!;
  expect(visibleRunnerDrawTaxSourceCount(input)).toBe(0);
  expect(runnerDrawTaxLiabilityProjection(input, meat)).toMatchObject({
    drawCount: 3,
    sourceCount: 0,
    projectedTagsAdded: 0,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(cp.runtime.residentPlanPortfolio),
  );
  const before = JSON.stringify([input.playerView, input.legalActions]);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.remove_tag");
  expect(decision.fallbackUsed).toBe(false);
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: decision.actionId,
      expiresAtStateVersion: input.playerView.stateVersion,
    }),
  );
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
    leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
    route: {
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
  ).toBeTruthy();
  expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
});
