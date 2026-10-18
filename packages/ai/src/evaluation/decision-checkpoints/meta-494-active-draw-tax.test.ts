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
import { currentRuleTagRemovalCounterInput } from "./current-rule-tag-removal-counter.test-support";

afterEach(resetResidentPlanPortfolioMemory);
it.each([
  [9, 361, "runner.gain_credit", "fund_active_tag_removal"],
  [32, 106, "runner.remove_tag", "remove_active_tags"],
])(
  "rejects the incomplete historical quote and keeps active-tax Defense in the current-rule G%i D%i countermodel",
  (g, d, actionId, capabilityId) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-494-r2-g${g}-d${d}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    const historical = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    expect(() => chooseAiAction(historical)).toThrow(/missing_action_semantics/);
    resetResidentPlanPortfolioMemory();
    const input = currentRuleTagRemovalCounterInput(cp.input);
    const meat = input.legalActions.find((a: { actionId: string }) =>
      a.actionId.includes("meat-upgrade"),
    )!;
    expect(visibleRunnerDrawTaxSourceCount(input)).toBe(1);
    expect(runnerDrawTaxLiabilityProjection(input, meat)).toMatchObject({
      drawCount: 3,
      sourceCount: 1,
      projectedTagsAdded: 3,
    });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      structuredClone(cp.runtime.residentPlanPortfolio),
    );
    const before = JSON.stringify([input.playerView, input.legalActions]);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(actionId);
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
        capabilityId,
      },
      dispositions: expect.arrayContaining([
        expect.objectContaining({
          actionId: meat.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.defense_and_recovery",
          evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
        }),
      ]),
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toBeTruthy();
    expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
  },
);
