import { createGameAfterSetup } from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import {
  removeEverywhere,
  toRunnerTurn,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { coverageSupportActionIds } from "../../runner/rig-coverage/coverage-support";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

const AFREET = 213;
const WORM = 286;
const FORGOTTEN_BACKUP_CHIP = 299;
const runnerDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.runner,
  cards: [
    { id: AFREET, quantity: 1 },
    { id: WORM, quantity: 1 },
    { id: FORGOTTEN_BACKUP_CHIP, quantity: 1 },
    { id: 251, quantity: 2 },
    { id: 357, quantity: 1 },
    { id: 358, quantity: 1 },
  ],
};

afterEach(resetResidentPlanPortfolioMemory);

function native(wormZone: "stack" | "heap" = "stack") {
  const state = toRunnerTurn(
    createGameAfterSetup({ seed: `heap-search-boundary:${wormZone}`, runnerDeck }),
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCardInGrip(FORGOTTEN_BACKUP_CHIP)
    .withRunnerCredits(5)
    .withRunnerClicks(3);
  for (const [definitionId, zone] of [[AFREET, "heap"], [WORM, wormZone]] as const) {
    const card = Object.values(state.cardInstances).find(
      (candidate) => candidate.definitionId === definitionId,
    )!;
    removeEverywhere(state, card.instanceId);
    state.runner[zone].push(card.instanceId);
    card.zone = { side: "runner", zone };
    card.faceup = zone === "heap";
  }
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: {
      deckSnapshotId: "heap-search-boundary-deck",
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq
        .filter((card) => card.known && card.definitionId !== undefined)
        .map((card) => [card.instanceId, card.definitionId!]),
    ),
    cardSemanticProfilesByDefinitionId: buildActionCardSemanticProfilesByDefinitionId(),
  });
  const recovery = candidates.find(
    (candidate) => candidate.sourceDefinitionId === FORGOTTEN_BACKUP_CHIP,
  );
  if (!recovery) throw new Error("Missing Engine-backed Forgotten Backup Chip action");
  return { input, candidates, recovery };
}

it("does not bind a Stack-only Worm answer to the native heap-only recovery action", () => {
  const { input, candidates, recovery } = native();
  expect(recovery.functionalEffects).toContainEqual(
    expect.objectContaining({ kind: "search", scope: "heap", target: "program" }),
  );
  expect(input.playerView.own.heapOrArchives.map((card) => card.definitionId)).toEqual([AFREET]);
  const result = coverageSupportActionIds(
    input, candidates, input.ownDeckCapabilities!, "breaker_wall",
    { deckHasStackAnswerOverride: true, targetDefinitionIdOverride: WORM },
  );
  expect(result.directSearchActionIds).not.toContain(recovery.actionId);
  expect(result.directSearchChoiceBindings).not.toContainEqual(
    expect.objectContaining({ actionId: recovery.actionId, targetDefinitionId: WORM }),
  );
});

it("keeps actual live ownership and the current state binding after rejecting the impossible source", () => {
  const { input, recovery } = native();
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId)!;
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: input.playerView.stateVersion,
    planInstanceId: plan.leafExecutorInstanceId,
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const impossibleBinding = portfolio.instances.some((instance) => {
    const state = instance.moduleState as {
      gap?: { directSearchChoiceBindings?: Array<{ actionId: string; targetDefinitionId?: number }> };
    } | undefined;
    return state?.gap?.directSearchChoiceBindings?.some(
      (binding) => binding.actionId === recovery.actionId && binding.targetDefinitionId === WORM,
    );
  });
  expect(impossibleBinding).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("binds the exact recoverable Worm instance when the current Engine state has it in Heap", () => {
  const { input, candidates, recovery } = native("heap");
  const target = input.playerView.own.heapOrArchives.find(
    (card) => card.definitionId === WORM,
  )!;
  const result = coverageSupportActionIds(
    input, candidates, input.ownDeckCapabilities!, "breaker_wall",
    { deckHasStackAnswerOverride: false },
  );
  expect(result.directSearchActionIds).toContain(recovery.actionId);
  expect(result.directSearchChoiceBindings).toContainEqual(
    expect.objectContaining({
      actionId: recovery.actionId,
      targetDefinitionId: WORM,
      targetCardInstanceId: target.instanceId,
    }),
  );
});
