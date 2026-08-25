import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

const RUNNER_DECK_ID = "standard_runner_last_call_at_rd";
const RUNNER_DECK_HASH = "standard-deck:76a00e66";

describe("Last Call at R&D exact choice-window regressions", () => {
  it("does not materialize the historical Jack 'n' Joe window in the current Cheap Bag Seed 2 sequence", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-cheap-bag-batch-01-game-02",
      corpDeckId: "standard_corp_cheap_bag_tricks",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.stateVersion === 153 &&
        snapshot.input.legalActions.some(
          (action) =>
            action.type === "play_event" &&
            snapshot.input.playerView.own.gripOrHq.some(
              (card) =>
                card.instanceId === action.source &&
                card.definitionId === "onr_v1_095_jack-n-joe",
            ),
        ),
    });

    assertRegularReplay(summary);
    expect(captures).toEqual([]);
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

  it("replays the frozen singleton-variant Seed 1 deterministically without a run-start order window", () => {
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
    expect(capture).toBeUndefined();
  }, 90_000);

  it("does not materialize the historical Siren Seed 6 Archives-to-HQ window", () => {
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
    expect(captures.length).toBeGreaterThan(0);
    expect(
      captures.some((capture) =>
        capture.input.legalActions.some(
          (action) =>
            action.type === "play_operation" &&
            String(action.source).includes("onr_v1_296_off-site-backups"),
        ),
      ),
    ).toBe(true);
    expect(
      captures.find((capture) =>
        summary.actionSequence
          .find(
            (entry) => entry.stateVersionBefore === capture.state.stateVersion,
          )
          ?.selectedActionId.includes("onr_v1_296_off-site-backups"),
      ),
    ).toBeUndefined();
    expect(
      captures.find((capture) =>
        capture.input.playerView.pendingChoice?.source.startsWith(
          "v1922.corp_archives_to_hq:",
        ),
      ),
    ).toBeUndefined();
    captures.forEach((capture, index) =>
      assertSemanticObjectSideSafe(capture.input, `sirenInput${index}`),
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
