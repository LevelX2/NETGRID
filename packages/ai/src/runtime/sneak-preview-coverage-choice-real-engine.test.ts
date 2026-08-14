import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { chooseRunnerAction } from "../index";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";

describe("Sneak Preview coverage-search choice on real Engine inputs", () => {
  it("keeps the code-gate coverage plan bound through both Sneak Preview choices deterministically", () => {
    const first = runHistoricalSneakPreviewCoveragePath();
    const second = runHistoricalSneakPreviewCoveragePath();

    expect(first).toEqual(second);
    expect(first.ownerModuleId).toBe("runner.rig_and_coverage");
    expect(first.selectedProgramDefinitionId).toBe("onr_v1_014_codecracker");
  });
});

const currentLastCallAtRd = standardDeckCatalog.decks.find(
  (deck) => deck.standardDeckId === "standard_runner_last_call_at_rd",
);
if (!currentLastCallAtRd) {
  throw new Error("Missing Last Call at R&D baseline deck.");
}

const currentCheapBagTricks = standardDeckCatalog.decks.find(
  (deck) => deck.standardDeckId === "standard_corp_cheap_bag_tricks",
);
if (!currentCheapBagTricks) {
  throw new Error("Missing Cheap Bag of Tricks baseline deck.");
}

const HISTORICAL_SNEAK_PREVIEW_RUNNER_DECK: DeckDefinition = {
  id: "test_runner_historical_sneak_preview_2x",
  name: "Test Runner Historical Sneak Preview 2x",
  side: "runner",
  identity: currentLastCallAtRd.identityCardId,
  cards: [
    ...currentLastCallAtRd.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
    { id: "onr_v1_110_sneak-preview", quantity: 2 },
  ],
};

const CHEAP_BAG_TRICKS_DECK: DeckDefinition = {
  id: "test_corp_cheap_bag_tricks",
  name: "Test Corp Cheap Bag of Tricks",
  side: "corp",
  identity: currentCheapBagTricks.identityCardId,
  cards: currentCheapBagTricks.cards.map((card) => ({
    id: card.cardId,
    quantity: card.quantity,
  })),
};

const HISTORICAL_SNEAK_PREVIEW_SNAPSHOT: AiDeckStrategyDeckSnapshot = {
  deckSnapshotId: "test-runner-historical-sneak-preview-2x-snapshot",
  side: "runner",
  cards: HISTORICAL_SNEAK_PREVIEW_RUNNER_DECK.cards.map((card) => ({
    cardId: card.id,
    quantity: card.quantity,
  })),
};

function runHistoricalSneakPreviewCoveragePath() {
  resetResidentPlanPortfolioMemory();
  let state = runnerMainState("last-call-cheap-bag-20260814-sneak-preview");
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(4)
    .withRunnerClicks(1)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip("onr_v1_110_sneak-preview")
    .withRunnerCardInGrip("onr_v1_045_newsgroup-filter")
    .withRunnerCardInGrip("onr_v1_174_rigged-investments")
    .withRunnerProgramInstalled("onr_v1_074_worm")
    .withRunnerProgramInstalled("onr_v1_017_deep-thought")
    .withRezzedCorpIceOnServer("hq", "onr_v1_244_filter")
    .withRezzedCorpIceOnServer("rd", "onr_v1_261_quandary");
  moveRunnerCardToStack(state, "onr_v1_014_codecracker");

  const openingInput = runnerInput(state);
  const sneakCardId = openingInput.playerView.own.gripOrHq.find(
    (card) => card.definitionId === "onr_v1_110_sneak-preview",
  )?.instanceId;
  if (!sneakCardId) throw new Error("Missing Sneak Preview in Runner grip.");
  const sneakAction = findAction(
    openingInput.legalActions,
    (action) => action.type === "play_event" && action.source === sneakCardId,
    "Sneak Preview play action",
  );
  const openingDecision = chooseRunnerAction(openingInput);
  expect(openingDecision).toMatchObject({
    actionId: sneakAction.actionId,
    reasonCode: "plan_first.runner.rig_and_coverage",
    fallbackUsed: false,
  });
  const executorId = coverageExecutorId(openingInput);

  state = applyDecision(state, openingDecision);
  const sourceChoiceInput = runnerInput(state);
  expect(sourceChoiceInput.playerView.pendingChoice).toMatchObject({
    sourceCardInstanceId: sneakAction.source,
    sourceCardDefinitionId: "onr_v1_110_sneak-preview",
    source: expect.stringMatching(
      /^p3_38\.stack_or_trash_program_install_source:/,
    ),
  });
  expect(coverageSearchActionId(sourceChoiceInput)).toBe(
    openingDecision.actionId,
  );
  const sourceChoiceAction = findAction(
    sourceChoiceInput.legalActions,
    (action) => action.type === "resolve_choice",
    "Sneak Preview source choice action",
  );
  const sourceChoiceDecision = chooseRunnerAction(sourceChoiceInput);
  expect(sourceChoiceDecision.actionId).toBe(sourceChoiceAction.actionId);
  expect(sourceChoiceDecision.selectedChoices).toMatchObject({
    choiceId: sourceChoiceInput.playerView.pendingChoice?.choiceId,
    selectedOptionIds: ["source_stack"],
  });
  expect(coverageExecutorId(sourceChoiceInput)).toBe(executorId);

  state = applyDecision(state, sourceChoiceDecision);
  const programChoiceInput = runnerInput(state);
  expect(programChoiceInput.playerView.pendingChoice).toMatchObject({
    sourceCardInstanceId: sneakAction.source,
    sourceCardDefinitionId: "onr_v1_110_sneak-preview",
    source: expect.stringMatching(/^p3_38\.stack_or_trash_program_install:/),
  });
  expect(coverageSearchActionId(programChoiceInput)).toBe(
    openingDecision.actionId,
  );
  const programChoiceAction = findAction(
    programChoiceInput.legalActions,
    (action) => action.type === "resolve_choice",
    "Sneak Preview program choice action",
  );
  const programChoiceDecision = chooseRunnerAction(programChoiceInput);
  expect(programChoiceDecision.actionId).toBe(programChoiceAction.actionId);
  expect(programChoiceDecision.selectedChoices?.selectedOptionIds).toHaveLength(
    1,
  );
  expect(coverageExecutorId(programChoiceInput)).toBe(executorId);

  state = applyDecision(state, programChoiceDecision);
  const selectedProgramId = state.runner.rig.programs.find(
    (cardId) =>
      state.cardInstances[cardId]?.definitionId === "onr_v1_014_codecracker",
  );
  expect(selectedProgramId).toBeDefined();

  return {
    ownerModuleId: "runner.rig_and_coverage",
    executorId,
    actionIds: [
      openingDecision.actionId,
      sourceChoiceDecision.actionId,
      programChoiceDecision.actionId,
    ],
    selectedChoices: [
      sourceChoiceDecision.selectedChoices,
      programChoiceDecision.selectedChoices,
    ],
    selectedProgramDefinitionId:
      state.cardInstances[selectedProgramId!]?.definitionId,
    stateHashAfter: state.eventLog.at(-1)?.stateHashAfter,
  };
}

function runnerMainState(seed: string): GameState {
  let state = createGameAfterSetup({
    matchId: `test-${seed}`,
    seed,
    agendaPointsToWin: 7,
    runnerDeck: HISTORICAL_SNEAK_PREVIEW_RUNNER_DECK,
    corpDeck: CHEAP_BAG_TRICKS_DECK,
  });
  state = applyByPredicate(
    state,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state = applyByPredicate(
    state,
    "corp",
    (action) => action.type === "end_turn",
  );
  while (state.pendingChoice?.side === "corp") {
    state = applyByPredicate(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
  }
  return state;
}

function runnerInput(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    decisionId: `sneak-preview-coverage:${state.stateVersion}`,
    profileId: "sneak-preview-coverage-runner",
    ownDeckSnapshot: HISTORICAL_SNEAK_PREVIEW_SNAPSHOT,
  });
}

function coverageExecutorId(input: ReturnType<typeof runnerInput>): string {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  expect(executor).toMatchObject({ moduleId: "runner.rig_and_coverage" });
  if (!executor) throw new Error("Missing Runner coverage executor.");
  return executor.instanceId;
}

function coverageSearchActionId(input: ReturnType<typeof runnerInput>): string {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; selectedSearchActionId?: unknown }
    | undefined;
  expect(moduleState).toMatchObject({ kind: "coverage" });
  if (typeof moduleState?.selectedSearchActionId !== "string") {
    throw new Error("Missing coverage-search action binding.");
  }
  return moduleState.selectedSearchActionId;
}

function moveRunnerCardToStack(state: GameState, definitionId: string): string {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing ${definitionId} in test deck.`);
  const [cardId, card] = entry;
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  state.runner.stack.unshift(cardId);
  state.cardInstances[cardId] = {
    ...card,
    zone: { side: "runner", zone: "stack" },
    faceup: false,
    rezzed: false,
  };
  return cardId;
}

function findAction(
  actions: readonly LegalAction[],
  predicate: (action: LegalAction) => boolean,
  label: string,
): LegalAction {
  const action = actions.find(predicate);
  if (!action) throw new Error(`Missing ${label}.`);
  return action;
}

function applyByPredicate(
  state: GameState,
  side: "corp" | "runner",
  predicate: (action: LegalAction) => boolean,
): GameState {
  return applyActionById(
    state,
    side,
    findAction(
      getLegalActions(state, side),
      predicate,
      `${side} fixture action`,
    ).actionId,
    state.pendingChoice
      ? {
          choiceId: state.pendingChoice.choiceId,
          selectedOptionIds: [String(state.pendingChoice.options[0]?.id)],
        }
      : undefined,
  );
}

function applyDecision(
  state: GameState,
  decision: ReturnType<typeof chooseRunnerAction>,
): GameState {
  if (!decision.actionId) throw new Error("Runner AI returned no action ID.");
  return applyActionById(
    state,
    "runner",
    decision.actionId,
    decision.selectedChoices,
  );
}

function applyActionById(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
  selectedChoices?: { choiceId: string; selectedOptionIds: readonly string[] },
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
    idempotencyKey: `sneak-preview:${side}:${state.stateVersion}:${actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
