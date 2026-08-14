import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

const RUNNER_DECK_ID = "standard_runner_last_call_at_rd";
const RUNNER_DECK_HASH = "standard-deck:76a00e66";

describe("Last Call at R&D exact choice-window regressions", () => {
  it("does not invent Coverage ownership for Jack 'n' Joe when the Cheap Bag Seed 2 Stack has no matching answer", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    let coverageGapAtFailureWindow:
      | {
          deckHasAnswer?: boolean;
          drawForAnswerActionIds?: string[];
        }
      | undefined;
    const summary = simulateStandardGame({
      seed: "last-call-panel-cheap-bag-batch-01-game-02",
      corpDeckId: "standard_corp_cheap_bag_tricks",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.stateVersion === 153,
      onCapture: (snapshot) => {
        if (snapshot.input.playerView.stateVersion !== 153) return;
        const coverage = residentPlanPortfolioSnapshot(
          snapshot.input,
        )?.instances.find(
          (instance) => instance.moduleId === "runner.rig_and_coverage",
        );
        coverageGapAtFailureWindow = (
          coverage?.moduleState as
            | { gap?: typeof coverageGapAtFailureWindow }
            | undefined
        )?.gap;
      },
    });

    assertRegularReplay(summary);
    const capture = captures.find(
      (entry) => entry.input.playerView.stateVersion === 153,
    );
    expect(capture).toBeDefined();
    assertSemanticObjectSideSafe(capture?.input, "cheapBagJackInput");
    const jack = capture?.input.legalActions.find((action) =>
      action.actionId.startsWith(
        "runner.play_event.runner_onr_v1_095_jack-n-joe_3.",
      ),
    );
    expect(jack).toMatchObject({
      type: "play_event",
      source: "runner_onr_v1_095_jack-n-joe_3",
      abilityRef: {
        sourceCardInstanceId: "runner_onr_v1_095_jack-n-joe_3",
        sourceAbilityId: "onr_v1_095_jack-n-joe:abilities_on_play_draw_cards",
      },
    });
    expect(coverageGapAtFailureWindow).toMatchObject({
      deckHasAnswer: false,
      drawForAnswerActionIds: [],
    });
    const otherConcretePlan = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 153,
    );
    expect(otherConcretePlan).toMatchObject({
      side: "runner",
      selectedActionId: "runner.gain_credit",
      actionType: "gain_credit",
      planKind: "runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    expect(otherConcretePlan?.evidence).toContain(
      "plan_step_capability:fund_onr_v1_174_rigged-investments",
    );
    expect(otherConcretePlan?.debugFacts).toContain(
      "runtime_why_not:alternative:play_event:explicitly_nonproductive:runner.develop_board_and_hand:runner_card_development_rejected_no_concrete_plan_purpose",
    );
  }, 90_000);

  it("keeps the Fast Advance Seed 9 run-start ordering bound to its exact central-pressure start-run route", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-09",
      corpDeckId: "standard_corp_universal_fast_advance",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.stateVersion === 9 ||
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "runner_run_start.order:",
        ) === true,
    });

    assertRegularReplay(summary);
    const sourceCapture = captures.find(
      (entry) => entry.input.playerView.stateVersion === 9,
    );
    const choiceCapture = captures.find((entry) =>
      entry.input.playerView.pendingChoice?.source.startsWith(
        "runner_run_start.order:",
      ),
    );
    expect(sourceCapture).toBeDefined();
    expect(choiceCapture).toBeDefined();
    assertSemanticObjectSideSafe(sourceCapture?.input, "runStartSourceInput");
    assertSemanticObjectSideSafe(choiceCapture?.input, "runStartChoiceInput");

    const source = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === sourceCapture!.state.stateVersion,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === choiceCapture!.state.stateVersion,
    );
    const sourceExecutor = source?.evidence.find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );
    const sourceRoot = source?.evidence.find((entry) =>
      entry.startsWith("plan_first_root:"),
    );

    expect(source).toMatchObject({
      side: "runner",
      selectedActionId: "runner.start_run.rd",
      actionType: "start_run",
      planKind: "runner.pressure_central",
      fallbackUsed: false,
    });
    expect(source?.evidence).toContain(
      "plan_step_id:plan:runner.pressure_central:central%3Ard:pressure:rd",
    );
    expect(choiceCapture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: `runner_run_start_order_${choiceCapture!.state.stateVersion}`,
      side: "runner",
      source: "runner_run_start.order:run_10",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: choiceCapture!.state.stateVersion,
      visibility: "hidden_info_barrier",
    });
    expect(
      choiceCapture?.input.playerView.pendingChoice?.options.map(
        (option) => option.value,
      ),
    ).toEqual(
      expect.arrayContaining([
        "card_implementation:runner_onr_v1_184_top-runners-conference_1",
        "card_implementation:runner_onr_v1_184_top-runners-conference_3",
      ]),
    );
    expect(choice).toMatchObject({
      side: "runner",
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "runner.pressure_central",
      fallbackUsed: false,
    });
    expect(sourceExecutor).toBeDefined();
    expect(sourceRoot).toBeDefined();
    expect(choice?.evidence).toContain(sourceExecutor);
    expect(choice?.evidence).toContain(sourceRoot);
    expect(choice?.evidence).toContain(
      "plan_scheduler:window:plan_bound_runner_run_start_order_choice:none",
    );
  }, 90_000);

  it("resolves the frozen singleton-variant Seed 1 Runner start window from its full canonical source profiles and replays deterministically", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const first = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
      runnerCards: singletonKeyCardRegressionCards(),
      runnerDeckHash: "standard-deck:a71c0dcc",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "runner_start.order:",
        ) === true,
    });
    const second = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
      runnerCards: singletonKeyCardRegressionCards(),
      runnerDeckHash: "standard-deck:a71c0dcc",
    });

    assertRegularReplay(first);
    assertRegularReplay(second);
    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);

    const capture = captures.find((entry) =>
      entry.input.playerView.pendingChoice?.source.startsWith(
        "runner_start.order:",
      ),
    );
    expect(capture).toBeDefined();
    const stateVersion = capture!.state.stateVersion;
    const resolution = first.actionSequence.find(
      (entry) => entry.stateVersionBefore === stateVersion,
    );
    expect(capture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: `runner_start_order_${stateVersion}`,
      side: "runner",
      source: `runner_start.order:${stateVersion}`,
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion,
      visibility: "hidden_info_barrier",
    });
    expect(
      capture?.input.playerView.pendingChoice?.options.map(
        (option) => option.value,
      ),
    ).toEqual(
      expect.arrayContaining([
        "runner_onr_v1_174_rigged-investments_1",
        "runner_onr_v1_184_top-runners-conference_1",
      ]),
    );
    expect(resolution).toMatchObject({
      side: "runner",
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "engine_window",
      fallbackUsed: false,
    });
  }, 90_000);

  it("keeps the Siren Seed 6 Archives-to-HQ choice under its exact selected Corp hand-plan executor", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-siren-batch-01-game-06",
      corpDeckId: "standard_corp_siren_fortress",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.legalActions.some(
          (action) =>
            action.type === "play_operation" &&
            String(action.source).includes("onr_v1_296_off-site-backups"),
        ) ||
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "v1922.corp_archives_to_hq:",
        ) === true,
    });

    assertRegularReplay(summary);
    const sourceCapture = captures.find((entry) =>
      entry.input.legalActions.some(
        (action) =>
          action.type === "play_operation" &&
          String(action.source).includes("onr_v1_296_off-site-backups"),
      ),
    );
    const choiceCapture = captures.find((entry) =>
      entry.input.playerView.pendingChoice?.source.startsWith(
        "v1922.corp_archives_to_hq:",
      ),
    );
    expect(sourceCapture).toBeDefined();
    expect(choiceCapture).toBeDefined();
    const source = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === sourceCapture!.state.stateVersion,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === choiceCapture!.state.stateVersion,
    );
    const sourceAction = sourceCapture?.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        String(action.source).includes("onr_v1_296_off-site-backups"),
    );
    expect(sourceAction).toBeDefined();
    const executor = source?.evidence.find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );

    expect(source).toMatchObject({
      side: "corp",
      actionType: "play_operation",
      planKind: "corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(sourceAction).toMatchObject({
      source: expect.stringContaining("onr_v1_296_off-site-backups"),
    });
    expect(choiceCapture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: `v1922_corp_archives_to_hq_${choiceCapture!.state.stateVersion}`,
      side: "corp",
      source: `v1922.corp_archives_to_hq:${sourceAction!.source}:${choiceCapture!.state.stateVersion}`,
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: choiceCapture!.state.stateVersion,
      visibility: "hidden_info_barrier",
    });
    expect(choice).toMatchObject({
      side: "corp",
      selectedActionId: "corp.resolve_choice",
      actionType: "resolve_choice",
      planKind: "corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(executor).toBeDefined();
    expect(choice?.evidence).toContain(executor);
    expect(choice?.evidence).toContain(
      "plan_scheduler:window:plan_bound_corp_archives_to_hq_choice:none",
    );
  }, 90_000);
});

type StandardDeck = {
  standardDeckId: string;
  version: string;
  name: string;
  side: "runner" | "corp";
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  cardPoolSnapshotId: string;
  cardPoolVersion: string;
  formatProfileId: string;
  formatProfileVersion: string;
  deckHash?: string;
};

function simulateStandardGame(params: {
  seed: string;
  corpDeckId: string;
  captures?: AiSimulationDecisionCheckpointCapture[];
  runnerCards?: StandardDeck["cards"];
  runnerDeckHash?: string;
  capturePredicate?: (
    snapshot: AiSimulationDecisionCheckpointCapture,
  ) => boolean;
  onCapture?: (snapshot: AiSimulationDecisionCheckpointCapture) => void;
}) {
  const runner = standardDeck(RUNNER_DECK_ID);
  const runnerForSimulation =
    params.runnerCards === undefined
      ? runner
      : { ...runner, cards: params.runnerCards };
  const corp = standardDeck(params.corpDeckId);
  return simulateAiGame({
    seed: params.seed,
    maxActions: 480,
    runnerDeck: deckDefinition(runnerForSimulation),
    corpDeck: deckDefinition(corp),
    runnerDeckMetadata: deckMetadata(
      runnerForSimulation,
      params.runnerDeckHash ?? RUNNER_DECK_HASH,
    ),
    corpDeckMetadata: deckMetadata(
      corp,
      corp.deckHash ?? `standard-deck:${corp.standardDeckId}`,
    ),
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    ...(params.captures && params.capturePredicate
      ? {
          testOnlyDecisionCheckpointCapture: {
            actionIndices: Array.from({ length: 480 }, (_, index) => index),
            capture: (snapshot: AiSimulationDecisionCheckpointCapture) => {
              params.onCapture?.(snapshot);
              if (params.capturePredicate!(snapshot))
                params.captures!.push(snapshot);
            },
          },
        }
      : {}),
  });
}

function singletonKeyCardRegressionCards(): StandardDeck["cards"] {
  const quantities = new Map([
    ["onr_v1_076_all-nighter", 2],
    ["onr_v1_086_forged-activation-orders", 2],
    ["onr_v1_123_bodyweight-data-creche", 1],
    ["onr_v1_179_silicon-saloon-franchise", 1],
  ]);
  return standardDeck(RUNNER_DECK_ID).cards.map((card) => ({
    ...card,
    quantity: quantities.get(card.cardId) ?? card.quantity,
  }));
}

function standardDeck(standardDeckId: string): StandardDeck {
  const deck = (standardDeckCatalog as { decks: StandardDeck[] }).decks.find(
    (candidate) => candidate.standardDeckId === standardDeckId,
  );
  if (!deck) throw new Error(`Missing standard deck ${standardDeckId}.`);
  return deck;
}

function deckDefinition(deck: StandardDeck): DeckDefinition {
  return {
    id: `${deck.standardDeckId}_${deck.version}`,
    name: deck.name,
    side: deck.side,
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(deck: StandardDeck, deckHash: string) {
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    deckHash,
  };
}

function assertRegularReplay(summary: ReturnType<typeof simulateAiGame>): void {
  expect(summary.terminationKind).toBe("game_result");
  expect(summary.errors).toEqual([]);
  expect(summary.runtimeFailures).toEqual([]);
  expect(summary.metrics.illegalActions).toBe(0);
  expect(summary.replayOk).toBe(true);
  expect(summary.replayErrors).toEqual([]);
}
