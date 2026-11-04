import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  hashGameState,
  getPlayerView,
  validateGameState,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { runnerCoverageSearchSourceChoiceBinding } from "./coverage-bindings";
function read(name: string) {
  return JSON.parse(
    readFileSync(
      new URL("../../runtime/test-fixtures/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
}
function original() {
  const cp = read("meta592-r3-g29-d070"),
    input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("keeps the Stack-bound Rent-I-Con target through the real source and target Engine choices", () => {
  const { cp, input } = original();
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  let state = read("meta592-r3-g29-engine").state,
    current = input;
  const root = cp.runtime.residentPlanPortfolio.rootForegroundInstanceId;
  for (const n of [0, 1]) {
    const before = JSON.stringify(current),
      decision = chooseAiAction(current),
      pf = residentPlanPortfolioSnapshot(current)!;
    if (!decision.actionId) throw Error("Missing selected LegalAction");
    const selectedOptionIds = decision.selectedChoices?.selectedOptionIds as string[] | undefined;
    expect(JSON.stringify(current)).toBe(before);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(pf.rootForegroundInstanceId).toBe(root);
    expect(pf.executorInstanceId).toBe(root);
    if (n === 0)
      expect(decision.selectedChoices?.selectedOptionIds).toEqual([
        "source_stack",
      ]);
    else
      expect(
        current.playerView.pendingChoice!.options.find(
          (o: any) => o.id === selectedOptionIds?.[0],
        )?.card?.definitionId,
      ).toBe("onr_classic_031_rent-i-con");
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: decision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw Error(JSON.stringify(result.error));
    state = result.state;
    current = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: input.ownDeckSnapshot,
    });
    current.planningStateIdentity = buildPlanningStateIdentity(current);
  }
  expect(
    getPlayerView(state, "runner").own.rig?.some(
      (c) => c.definitionId === "onr_classic_031_rent-i-con",
    ),
  ).toBe(true);
  expect(
    getPlayerView(state, "runner").own.rig?.some(
      (c) => c.definitionId === "onr_v1_011_cloak",
    ),
  ).toBe(false);
  expect(validateGameState(state).ok).toBe(true);
  expect(hashGameState(state)).toBe("fnv1a:a78ed387");
});
it.each([
  "wrong_source",
  "stale_choice",
  "wrong_action",
  "wrong_option_value",
  "unselectable_stack",
  "missing_target",
  "duplicate_binding",
  "missing_state",
  "wrong_root",
  "unavailable_heap_target",
])("rejects an unbound source choice: %s", (variant) => {
  const { cp, input } = original(),
    portfolio = cp.runtime.residentPlanPortfolio,
    executor = portfolio.instances.find(
      (p: any) => p.instanceId === portfolio.executorInstanceId,
    ),
    state = executor.moduleState,
    choice = input.playerView.pendingChoice!,
    binding = state.gap.directSearchChoiceBindings[0];
  if (variant === "wrong_source") choice.sourceCardInstanceId = "other";
  if (variant === "stale_choice") choice.stateVersion--;
  if (variant === "wrong_action")
    input.legalActions[0].choiceRequirements[0].choiceId = "other";
  if (variant === "wrong_option_value")
    choice.options.find((o: any) => o.id === "source_stack").value = "heap";
  if (variant === "unselectable_stack")
    choice.options.find((o: any) => o.id === "source_stack").selectable = false;
  if (variant === "missing_target") delete binding.targetDefinitionId;
  if (variant === "duplicate_binding")
    state.gap.directSearchChoiceBindings.push(structuredClone(binding));
  if (variant === "missing_state") delete executor.moduleState;
  if (variant === "wrong_root") portfolio.rootForegroundInstanceId = "other";
  if (variant === "unavailable_heap_target")
    binding.targetCardInstanceId = "absent-program";
  expect(() =>
    runnerCoverageSearchSourceChoiceBinding(input, portfolio),
  ).toThrow(/invalid_support_graph/);
});
