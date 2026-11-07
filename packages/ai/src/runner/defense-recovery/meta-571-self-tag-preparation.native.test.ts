import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
function decide(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  const i = f.input;
  i.planningStateIdentity = buildPlanningStateIdentity(i);
  restoreAiRuntimeCheckpoint(i, i.ownDeckSnapshot!.deckSnapshotId, f.runtime);
  const before = JSON.stringify(i),
    d = chooseAiAction(i);
  expect(JSON.stringify(i)).toBe(before);
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(i.legalActions.some((a) => a.actionId === d.actionId)).toBe(true);
  return {
    input: i,
    decision: d,
    portfolio: residentPlanPortfolioSnapshot(i)!,
  };
}
it.each([
  "cp-meta571-r1-g8-selftag-preparation",
  "cp-meta571-r2-g37-selftag-preparation",
])("binds the cheaper complete prevention/run line in %s", (name) => {
  const { input, decision, portfolio } = decide(name);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("install_card");
  expect(action.source).toContain("fall-guy");
  const parent = "plan:runner.pressure_central:central%3Ahq";
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    parent,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.defense_and_recovery");
  const support = portfolio.instances.find(
    (p) =>
      p.moduleId === "runner.defense_and_recovery" &&
      p.parentInstanceId === parent,
  );
  expect(support?.parentNeedId).toBeDefined();
  expect(
    portfolio.instances.find((p) => p.instanceId === parent)?.openNeedIds,
  ).toContain(support!.parentNeedId);
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    stateVersion: input.playerView.stateVersion,
    actionId: decision.actionId,
  });
});
it.each([
  "cp-meta571-r1-g34-selftag-hand-floor",
  "cp-meta571-r1-g26-paid-selftag",
])("does not prepare a displaced or more expensive run in %s", (name) => {
  const { input, decision, portfolio } = decide(name);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  // Normal development may install a resource. This contract excludes the
  // displaced Fall Guy preparation, not every unrelated installation.
  if (action.type === "install_card") {
    const source = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    );
    expect(source?.definitionId).not.toBe("onr_v1_161_fall-guy");
  }
  expect(
    portfolio.instances
      .filter((p) => p.moduleId === "runner.pressure_central")
      .some(
        (p) =>
          (p.moduleState as { signal: { selfTagPreventionNeed?: unknown } })
            .signal.selfTagPreventionNeed !== undefined,
      ),
  ).toBe(false);
});
