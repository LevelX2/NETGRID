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
  type PlayerAction,
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

  it("prebinds an acceptable memory sacrifice before a heap coverage install", () => {
    const first = runMemoryPressuredSneakPreviewCoveragePath();
    const second = runMemoryPressuredSneakPreviewCoveragePath();

    expect(first).toEqual(second);
    expect(first.ownerModuleId).toBe("runner.rig_and_coverage");
    expect(first.selectedProgramDefinitionId).toBe(
      "onr_classic_031_rent-i-con",
    );
    expect(first.trashedProgramDefinitionId).toBe("onr_v1_035_invisibility");
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

const currentRentIConShellspiel = standardDeckCatalog.decks.find(
  (deck) =>
    deck.standardDeckId === "standard_runner_rent_i_con_shellspiel_2026_07_17",
);
if (!currentRentIConShellspiel) {
  throw new Error("Missing Rent-I-Con: Das Shellspiel standard deck.");
}

const currentMumie = standardDeckCatalog.decks.find(
  (deck) => deck.standardDeckId === "standard_corp_mph465dv",
);
if (!currentMumie) {
  throw new Error("Missing Mumie standard deck.");
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

const RENT_I_CON_SHELLSPIEL_DECK: DeckDefinition = {
  id: "test_runner_rent_i_con_shellspiel",
  name: "Test Runner Rent-I-Con: Das Shellspiel",
  side: "runner",
  identity: currentRentIConShellspiel.identityCardId,
  cards: currentRentIConShellspiel.cards.map((card) => ({
    id: card.cardId,
    quantity: card.quantity,
  })),
};

const MUMIE_DECK: DeckDefinition = {
  id: "test_corp_mumie",
  name: "Test Corp Mumie",
  side: "corp",
  identity: currentMumie.identityCardId,
  cards: currentMumie.cards.map((card) => ({
    id: card.cardId,
    quantity: card.quantity,
  })),
};

const RENT_I_CON_SHELLSPIEL_SNAPSHOT: AiDeckStrategyDeckSnapshot = {
  deckSnapshotId: "test-runner-rent-i-con-shellspiel-snapshot",
  side: "runner",
  cards: RENT_I_CON_SHELLSPIEL_DECK.cards.map((card) => ({
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
    .withRunnerCardInGrip("onr_v1_079_bodyweight-synthetic-blood")
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

function runMemoryPressuredSneakPreviewCoveragePath() {
  resetResidentPlanPortfolioMemory();
  let state = runnerMainStateForDecks(
    "rent-i-con-mumie-20260824-memory-sacrifice",
    RENT_I_CON_SHELLSPIEL_DECK,
    MUMIE_DECK,
  );
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(4)
    .withRunnerClicks(1)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip("onr_v1_110_sneak-preview")
    .withRunnerCardInGrip("onr_v1_176_the-shell-traders")
    .withRunnerCardInGrip("onr_v1_071_vewy-vewy-quiet")
    .withRunnerProgramInstalled("onr_classic_031_rent-i-con")
    .withRunnerProgramInstalled("onr_v1_035_invisibility")
    .withRezzedCorpIceOnServer("hq", "onr_v1_224_bolter-cluster")
    .withRezzedCorpIceOnServer("rd", "onr_v1_237_data-wall")
    .withRezzedCorpIceOnServer("rd", "onr_v1_238_data-wall-2-0")
    .withRezzedCorpIceOnServer("rd", "onr_v1_245_fire-wall");
  state.runner.memoryUsed = 3;
  const heapRentIConId = moveRunnerCardToHeap(
    state,
    "onr_classic_031_rent-i-con",
  );
  const openingInput = runnerInputForSnapshot(
    state,
    RENT_I_CON_SHELLSPIEL_SNAPSHOT,
    "sneak-preview-memory",
  );
  expect(openingInput.playerView.own).toMatchObject({
    memoryUsed: 3,
    memoryLimit: 4,
  });
  const sneakCardId = openingInput.playerView.own.gripOrHq.find(
    (card) => card.definitionId === "onr_v1_110_sneak-preview",
  )?.instanceId;
  if (!sneakCardId) throw new Error("Missing Sneak Preview in Runner grip.");
  const sneakAction = findAction(
    openingInput.legalActions,
    (action) => action.type === "play_event" && action.source === sneakCardId,
    "memory-pressured Sneak Preview play action",
  );
  const openingDecision = chooseRunnerAction(openingInput);
  expect(openingDecision).toMatchObject({
    actionId: sneakAction.actionId,
    reasonCode: "plan_first.runner.rig_and_coverage",
    fallbackUsed: false,
  });
  const executorId = coverageExecutorId(openingInput);
  const openingExecutor = residentPlanPortfolioSnapshot(
    openingInput,
  )?.instances.find((instance) => instance.instanceId === executorId);
  expect(openingExecutor?.moduleState).toMatchObject({
    kind: "coverage",
    gap: {
      directSearchChoiceBindings: [
        {
          actionId: sneakAction.actionId,
          targetCardInstanceId: heapRentIConId,
          installMemorySacrificeBinding: {
            targetCardInstanceId: heapRentIConId,
            requiredMemoryToFree: 1,
            selectedCards: [
              {
                memoryCost: 1,
              },
            ],
          },
        },
      ],
    },
  });

  state = applyDecision(state, openingDecision);
  const sourceChoiceInput = runnerInputForSnapshot(
    state,
    RENT_I_CON_SHELLSPIEL_SNAPSHOT,
    "sneak-preview-memory",
  );
  const sourceChoiceDecision = chooseRunnerAction(sourceChoiceInput);
  expect(sourceChoiceDecision.selectedChoices?.selectedOptionIds).toEqual([
    "source_heap",
  ]);
  expect(coverageExecutorId(sourceChoiceInput)).toBe(executorId);

  state = applyDecision(state, sourceChoiceDecision);
  const programChoiceInput = runnerInputForSnapshot(
    state,
    RENT_I_CON_SHELLSPIEL_SNAPSHOT,
    "sneak-preview-memory",
  );
  const programChoiceDecision = chooseRunnerAction(programChoiceInput);
  expect(programChoiceDecision.selectedChoices?.selectedOptionIds).toEqual([
    `card_${heapRentIConId}`,
  ]);
  expect(coverageExecutorId(programChoiceInput)).toBe(executorId);

  state = applyDecision(state, programChoiceDecision);
  const memoryChoiceInput = runnerInputForSnapshot(
    state,
    RENT_I_CON_SHELLSPIEL_SNAPSHOT,
    "sneak-preview-memory",
  );
  expect(memoryChoiceInput.playerView.pendingChoice?.source).toMatch(
    /^runner\.program_install_memory:hidden_search:/,
  );
  const installedInvisibilityId = (
    memoryChoiceInput.playerView.own.rig ?? []
  ).find((card) => card.definitionId === "onr_v1_035_invisibility")?.instanceId;
  if (!installedInvisibilityId) {
    throw new Error("Missing installed Invisibility sacrifice candidate.");
  }
  const memoryChoiceDecision = chooseRunnerAction(memoryChoiceInput);
  expect(memoryChoiceDecision).toMatchObject({
    actionId: "runner.resolve_choice",
    selectedChoices: {
      choiceId: memoryChoiceInput.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [`card_${installedInvisibilityId}`],
    },
    reasonCode: "plan_first.engine_window",
    fallbackUsed: false,
  });
  expect(coverageExecutorId(memoryChoiceInput)).toBe(executorId);

  state = applyDecision(state, memoryChoiceDecision);
  expect(state.pendingChoice).toBeUndefined();
  expect(state.runner.rig.programs).toContain(heapRentIConId);
  expect(state.runner.heap).toContain(installedInvisibilityId);

  return {
    ownerModuleId: "runner.rig_and_coverage",
    executorId,
    actionIds: [
      openingDecision.actionId,
      sourceChoiceDecision.actionId,
      programChoiceDecision.actionId,
      memoryChoiceDecision.actionId,
    ],
    selectedChoices: [
      sourceChoiceDecision.selectedChoices,
      programChoiceDecision.selectedChoices,
      memoryChoiceDecision.selectedChoices,
    ],
    selectedProgramDefinitionId:
      state.cardInstances[heapRentIConId]?.definitionId,
    trashedProgramDefinitionId:
      state.cardInstances[installedInvisibilityId]?.definitionId,
    stateHashAfter: state.eventLog.at(-1)?.stateHashAfter,
  };
}

function runnerMainState(seed: string): GameState {
  return runnerMainStateForDecks(
    seed,
    HISTORICAL_SNEAK_PREVIEW_RUNNER_DECK,
    CHEAP_BAG_TRICKS_DECK,
  );
}

function runnerMainStateForDecks(
  seed: string,
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
): GameState {
  let state = createGameAfterSetup({
    matchId: `test-${seed}`,
    seed,
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
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
  return runnerInputForSnapshot(
    state,
    HISTORICAL_SNEAK_PREVIEW_SNAPSHOT,
    "sneak-preview-coverage",
  );
}

function runnerInputForSnapshot(
  state: GameState,
  snapshot: AiDeckStrategyDeckSnapshot,
  decisionPrefix: string,
) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    decisionId: `${decisionPrefix}:${state.stateVersion}`,
    profileId: `${decisionPrefix}-runner`,
    ownDeckSnapshot: snapshot,
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

function moveRunnerCardToHeap(state: GameState, definitionId: string): string {
  const installed = new Set(state.runner.rig.programs);
  const entry = Object.entries(state.cardInstances).find(
    ([cardId, card]) =>
      card.definitionId === definitionId && !installed.has(cardId),
  );
  if (!entry) throw new Error(`Missing spare ${definitionId} in test deck.`);
  const [cardId, card] = entry;
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...card,
    zone: { side: "runner", zone: "heap" },
    faceup: true,
    rezzed: true,
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
  if (decision.selectionKind && decision.selectionKind !== "direct") {
    throw new Error(
      `Sneak Preview fixture expected a direct choice, got ${decision.selectionKind}.`,
    );
  }
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
  selectedChoices?: PlayerAction["selectedChoices"],
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
