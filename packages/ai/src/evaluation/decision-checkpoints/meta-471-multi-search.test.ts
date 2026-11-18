import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-471-r3-g5-d135.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreResidentPlanPortfolioMemorySnapshot } from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type { StrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { selectedBoundRunnerCoverageMultiSearchChoiceOptionIds } from "../../runner/rig-coverage/coverage-multi-search-choice";
import type { CoverageSearchBinding } from "../../runner/rig-coverage/coverage-types";

function restoredInput(incompleteBinding?: keyof CoverageSearchBinding) {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  restoreStrategicIntentMemorySnapshot(
    input,
    checkpoint.runtime
      .strategicIntent as unknown as StrategicIntentMemorySnapshot,
    input.ownDeckSnapshot!.deckSnapshotId,
  );
  const portfolio = structuredClone(
    checkpoint.runtime.residentPlanPortfolio,
  ) as unknown as ResidentPlanPortfolio;
  if (incompleteBinding) {
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    )!;
    const state = executor.moduleState as Partial<CoverageSearchBinding>;
    delete state[incompleteBinding];
  }
  restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
  return input;
}

it("keeps the exact coverage target and fills the grip search with complementary definitions", () => {
  const input = restoredInput();
  const decision = chooseAiAction(input);
  const choice = input.playerView.pendingChoice!;
  const payload = decision.selectedChoices as {
    choiceId: string;
    selectedOptionIds: string[];
  };
  const definitions = payload.selectedOptionIds.map(
    (id) => choice.options.find((o) => o.id === id)!.card!.definitionId,
  );
  expect(decision.actionId).toBe("rn");
  expect(payload.choiceId).toBe(choice.choiceId);
  expect(payload.selectedOptionIds).toHaveLength(5);
  expect(definitions[0]).toBe(34);
  expect(new Set(definitions).size).toBe(5);
  expect(definitions).toContain(31);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "p5s1qdgqrafrs3n2kss1t9ct7m",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("p5s1qdgqrafrs3n2kss1t9ct7m");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
});

it("preserves the complete offered set while excluding a disabled option", () => {
  const input = restoredInput();
  const choice = input.playerView.pendingChoice!;
  const disabled = choice.options.find(
    (option) => option.card?.definitionId === 31,
  )!;
  disabled.selectable = false;
  const decision = chooseAiAction(input);
  const payload = decision.selectedChoices as {
    choiceId: string;
    selectedOptionIds: string[];
  };

  expect(decision.actionId).toBe("rn");
  expect(payload.choiceId).toBe(choice.choiceId);
  expect(payload.selectedOptionIds).toHaveLength(5);
  expect(payload.selectedOptionIds).not.toContain(disabled.id);
});

it("keeps legal duplicates when the exact engine selection count requires them", () => {
  const input = restoredInput();
  const choice = input.playerView.pendingChoice!;
  choice.options = choice.options.filter(
    (o) => o.card?.definitionId === 34,
  );
  choice.minSelections = choice.maxSelections = 3;
  const requirement = input.legalActions[0]!.choiceRequirements![0]!;
  requirement.optionIds = choice.options.map((o) => o.id);
  requirement.minSelections = requirement.maxSelections = 3;
  const decision = chooseAiAction(input);
  const payload = decision.selectedChoices as { selectedOptionIds: string[] };
  expect(new Set(payload.selectedOptionIds).size).toBe(3);
  expect(
    payload.selectedOptionIds.every((id) => requirement.optionIds.includes(id)),
  ).toBe(true);
  expect(decision.fallbackUsed).toBe(false);
});

it.each(["selectedSearchActionId", "selectedSearchStateVersion"] as const)(
  "rejects a multi-search origin with missing %s",
  (missingField) => {
    expect(() => chooseAiAction(restoredInput(missingField))).toThrow(
      /window_origin_missing/,
    );
  },
);

it("fails closed when the search observation no longer belongs to the selected source", () => {
  const input = restoredInput();
  input.playerView.pendingChoice!.sourceCardInstanceId =
    "different_search_source";
  expect(() => chooseAiAction(input)).toThrow();
});

it("does not replace a vanished exact target with an unrelated search pick", () => {
  const input = restoredInput();
  const choice = input.playerView.pendingChoice!;
  choice.options = choice.options.filter(
    (o) => o.card?.definitionId !== 34,
  );
  input.legalActions[0]!.choiceRequirements![0]!.optionIds = choice.options.map(
    (o) => o.id,
  );
  expect(() => chooseAiAction(input)).toThrow();
});

it("rejects a changed Engine option set instead of re-ranking in the resolver", () => {
  const input = restoredInput();
  chooseAiAction(input);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  input.playerView.pendingChoice!.options.pop();
  expect(() =>
    selectedBoundRunnerCoverageMultiSearchChoiceOptionIds(
      input,
      input.legalActions[0]!,
      portfolio,
    ),
  ).toThrow();
});
