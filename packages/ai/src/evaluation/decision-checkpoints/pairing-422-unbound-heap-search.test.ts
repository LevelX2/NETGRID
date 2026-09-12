import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-unbound-heap-search-d296.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { runnerCandidateIsOneShotSearch } from "../../runtime/runner-development-action-facts";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture() {
  return structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function candidates() {
  const { input } = capture();
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
}
it("classifies an unbound canonical heap search without inventing a recovery target", () => {
  const { input, runtime } = capture();
  expect(input.playerView.stateVersion).toBe(295);
  expect(
    input.playerView.own.rig!.filter(
      (card) => card.definitionId === "onr_classic_031_rent-i-con",
    ),
  ).toHaveLength(2);
  const recovery = input.legalActions.find(
    (action) =>
      action.payload?.cardImplementationEffectKind === "search_trash_to_grip",
  )!;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).toBe("runner.end_turn");
  expect(
    input.legalActions.some((action) => action.actionId === decision.actionId),
  ).toBe(true);
  const debug = decision.decisionDebug!.planFirstDecision!;
  expect(
    decision.decisionDebug!.actionAlternatives!.find(
      (entry) => entry.actionId === recovery.actionId,
    )?.whyNot,
  ).toEqual([
    "explicitly_nonproductive:runner.develop_board_and_hand:runner_one_shot_search_has_no_bound_target_plan",
  ]);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(portfolio.executorInstanceId).toBe(portfolio.rootForegroundInstanceId);
  expect(
    portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    )?.moduleId,
  ).toBe("runner.defense_and_recovery");
  expect(debug.selectedStep?.stepId).toBe(
    `${portfolio.executorInstanceId}:forgo_terminal_deck_pressure`,
  );
});
it("recognizes the current canonical search effect without auxiliary search hints", () => {
  const candidate = candidates().find(
    (entry) => entry.effectKind === "search_trash_to_grip",
  )!;
  expect(candidate.effectTargets ?? []).toEqual([]);
  expect(runnerCandidateIsOneShotSearch(candidate)).toBe(true);
  expect(
    runnerCandidateIsOneShotSearch({
      ...candidate,
      effectKind: "search_stack_to_grip",
    }),
  ).toBe(true);
  expect(
    runnerCandidateIsOneShotSearch({
      ...candidate,
      effectKind: "gain_credits",
    }),
  ).toBe(false);
  expect(
    runnerCandidateIsOneShotSearch({
      ...candidate,
      actionType: "activated_card_ability",
    }),
  ).toBe(false);
  expect(
    runnerCandidateIsOneShotSearch({
      ...candidate,
      sourceKind: "basic_action",
    }),
  ).toBe(false);
});
