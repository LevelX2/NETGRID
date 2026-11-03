import { runnerAffordableCoverageSearchActionIds } from "./coverage-search-alternatives";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it("uses the already bound affordable stack search before funding an unaffordable held sentry", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta587-affordable-search.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const snapshot = JSON.stringify(input),
    decision = chooseAiAction(input);
  const search = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "play_event" && a.source?.includes("temple-microcode"),
  );
  expect(search.payload.cardImplementationEffectKind).toBeUndefined();
  expect(decision.actionId).toBe(search.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const p = decision.decisionDebug!.planFirstDecision!;
  expect(p.selectedPlan!.moduleId).toBe("runner.rig_and_coverage");
  expect(p.selectedPlan!.phase).toBe("search_answer");
  expect(p.rootPlanInstanceId).toBe(
    "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
  );
  expect(p.route).toMatchObject({
    actionId: search.actionId,
    stateVersion: 158,
    planInstanceId: p.leafExecutorInstanceId,
  });
  const plan = residentPlanPortfolioSnapshot(input)!.instances.find(
    (x) => x.instanceId === p.rootPlanInstanceId,
  )!;
  const gap = (
    plan.moduleState as {
      gap: {
        directSearchChoiceBindings: Array<{
          actionId: string;
          targetDefinitionId: string;
        }>;
      };
    }
  ).gap;
  expect(gap.directSearchChoiceBindings).toContainEqual(
    expect.objectContaining({
      actionId: search.actionId,
      targetDefinitionId: "onr_v1_072_wild-card",
    }),
  );
  expect(JSON.stringify(input)).toBe(snapshot);
});

it.each([
  "affordable_hand",
  "no_memory",
  "full_hand",
  "no_stack_copy",
  "insufficient_cash",
  "non_stack_search",
] as const)("preserves acquisition boundary %s", (boundary) => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta587-affordable-search.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input),
    port = residentPlanPortfolioSnapshot(input)!;
  const plan = port.instances.find(
    (x) =>
      x.instanceId ===
      decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId,
  )!;
  const gap = (plan.moduleState as { gap: RunnerCoverageGapSignal }).gap;
  const action = input.legalActions.find(
    (a: { actionId: string }) => a.actionId === decision.actionId,
  );
  const effects = AI_HINTS_BY_CARD.get(
    "onr_v1_114_temple-microcode-outlet",
  )!.actionCapabilitySemantics!.find(
    (s) => s.capabilityKey === action.payload.cardImplementationAbilityKey,
  )!.effects;
  const candidate = {
    actionId: action.actionId,
    functionalEffects: effects,
    costProfile: { costKnownStatus: "known", creditCost: 1 },
  } as unknown as ActionSemanticCandidate;
  expect(
    runnerAffordableCoverageSearchActionIds(input, [candidate], gap),
  ).toEqual([action.actionId]);
  if (boundary === "affordable_hand") input.playerView.own.credits = 10;
  if (boundary === "no_memory")
    input.playerView.own.memoryUsed = input.playerView.own.memoryLimit;
  if (boundary === "full_hand")
    input.playerView.own.maxHandSize = input.playerView.own.gripOrHq.length;
  if (boundary === "no_stack_copy") {
    const target = input.ownDeckCapabilities.runner.breakerInventory.find(
      (c: { cardId: string }) =>
        c.cardId === gap.directSearchChoiceBindings![0]!.targetDefinitionId,
    );
    target.quantityKnownInDeck = 0;
    target.locations = ["in_heap"];
  }
  if (boundary === "insufficient_cash") input.playerView.own.credits = 0;
  if (boundary === "non_stack_search")
    candidate.functionalEffects = [
      {
        kind: "search",
        scope: "heap",
        timing: "action",
        resource: "cards",
        target: "program",
        finite: true,
      },
    ];
  expect(
    runnerAffordableCoverageSearchActionIds(input, [candidate], gap),
  ).toEqual([]);
});
