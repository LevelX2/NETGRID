import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { assessRunnerHandRotation } from "../../runtime/runner-hand-rotation-assessment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { coverageSupportActionIds } from "../../runner/rig-coverage/coverage-support";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r3-g40-d334.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
function support(input: AiDecisionInputWithDeckCapabilities) {
  return coverageSupportActionIds(
    input,
    buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }),
    input.ownDeckCapabilities!,
    "breaker_wall",
    {
      terminalRemoteCoverageThreat: true,
      handRotation: assessRunnerHandRotation(input, []),
    },
  );
}
afterEach(resetResidentPlanPortfolioMemory);
it("admits and materializes the native terminal Coverage draw to a remaining heap-recovery out without assuming its stack order", () => {
  const cp = fixture(),
    input = cp.input;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(
    input.ownDeckCapabilities!.runner!.breakerInventory.every(
      (b) => b.quantityKnownInDeck === 0,
    ),
  ).toBe(true);
  expect(input.playerView.own.stackOrRdCount).toBe(2);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(cp.runtime.residentPlanPortfolio!),
  );
  const before = JSON.stringify([input.playerView, input.legalActions]);
  const result = chooseAiAction(input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const coverage = portfolio.instances.find(
    (p) =>
      p.moduleId === "runner.rig_and_coverage" &&
      p.dedupeKey === "coverage:breaker_code_gate",
  );
  expect(coverage).toMatchObject({
    viability: "ready",
    parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    moduleState: {
      phase: "draw_for_answer",
      gap: {
        deckHasAnswer: true,
        drawForAnswerActionIds: ["runner.draw_card"],
      },
    },
  });
  expect(pf.turnPlanning?.heads).toContainEqual(
    expect.objectContaining({
      moduleId: "runner.rig_and_coverage",
      actionId: "runner.draw_card",
      rootPlanInstanceId: coverage!.parentInstanceId,
      witnessValid: true,
      assessment: expect.objectContaining({
        effectivePriorityClass: "P2",
        readiness: "executable_now",
      }),
    }),
  );
  expect(pf.turnPlanning?.consideredLines).toContainEqual(
    expect.objectContaining({
      firstActionId: "runner.draw_card",
      priorityClass: "P2",
      stopReason: "observation_boundary",
    }),
  );
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
});
it("admits draw but keeps direct Stack search and search-engine setup unavailable when all breakers are in Heap", () => {
  const route = support(fixture().input);
  expect(route.drawForAnswerActionIds).toContain("runner.draw_card");
  expect(route.directSearchActionIds).toEqual([]);
  expect(route.searchEngineSetupActionIds).toEqual([]);
});
it.each([
  "empty_stack",
  "no_recovery_remaining",
  "no_matching_heap_answer",
  "stack_search_only",
  "top_only_recovery",
])("does not invent a heap-recovery draw answer for %s", (boundary) => {
  const input = fixture().input;
  const tools = input.ownDeckCapabilities!.runner!.searchAccess.tools;
  if (boundary === "empty_stack") input.playerView.own.stackOrRdCount = 0;
  if (boundary === "no_matching_heap_answer")
    input.playerView.own.heapOrArchives =
      input.playerView.own.heapOrArchives.filter(
        (c) => c.definitionId !== "onr_classic_031_rent-i-con",
      );
  if (boundary === "no_recovery_remaining")
    for (const tool of tools) tool.status = "discarded";
  if (boundary === "stack_search_only" || boundary === "top_only_recovery") {
    for (const tool of tools) tool.status = "discarded";
    const tool = tools[0]!;
    tool.status = "in_deck";
    tool.cardId =
      boundary === "stack_search_only"
        ? "onr_v1_114_temple-microcode-outlet"
        : "onr_v1_165_junkyard-bbs";
  }
  expect(support(input).drawForAnswerActionIds).not.toContain(
    "runner.draw_card",
  );
});

it("preserves the explicit cost-improvement answer restriction", () => {
  const input = fixture().input;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  });
  expect(
    coverageSupportActionIds(
      input,
      candidates,
      input.ownDeckCapabilities!,
      "breaker_wall",
      {
        deckHasStackAnswerOverride: false,
        terminalRemoteCoverageThreat: true,
        handRotation: assessRunnerHandRotation(input, []),
      },
    ).drawForAnswerActionIds,
  ).toEqual([]);
});
