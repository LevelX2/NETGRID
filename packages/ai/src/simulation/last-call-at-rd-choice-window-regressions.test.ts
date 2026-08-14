import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

const RUNNER_DECK_ID = "standard_runner_last_call_at_rd";
const RUNNER_DECK_HASH = "standard-deck:a71c0dcc";

describe("Last Call at R&D exact choice-window regressions", () => {
  it("resolves the Seed 1 Runner start window from its full canonical source profiles and replays deterministically", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const first = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
      captures,
      actionIndices: [70],
    });
    const second = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
    });

    assertRegularReplay(first);
    assertRegularReplay(second);
    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);

    const capture = captures.find((entry) => entry.state.stateVersion === 70);
    const resolution = first.actionSequence.find(
      (entry) => entry.stateVersionBefore === 70,
    );
    expect(capture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: "runner_start_order_70",
      side: "runner",
      source: "runner_start.order:70",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 70,
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
      actionIndices: [129, 130],
    });

    assertRegularReplay(summary);
    const source = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 129,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 130,
    );
    const sourceCapture = captures.find(
      (entry) => entry.state.stateVersion === 129,
    );
    const choiceCapture = captures.find(
      (entry) => entry.state.stateVersion === 130,
    );
    const sourceAction = sourceCapture?.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        action.source === "corp_onr_v1_296_off-site-backups_2",
    );
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
      source: "corp_onr_v1_296_off-site-backups_2",
    });
    expect(choiceCapture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: "v1922_corp_archives_to_hq_130",
      side: "corp",
      source:
        "v1922.corp_archives_to_hq:corp_onr_v1_296_off-site-backups_2:130",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 130,
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
  actionIndices?: number[];
}) {
  const runner = standardDeck(RUNNER_DECK_ID);
  const corp = standardDeck(params.corpDeckId);
  return simulateAiGame({
    seed: params.seed,
    maxActions: 480,
    runnerDeck: deckDefinition(runner),
    corpDeck: deckDefinition(corp),
    runnerDeckMetadata: deckMetadata(runner, RUNNER_DECK_HASH),
    corpDeckMetadata: deckMetadata(
      corp,
      corp.deckHash ?? `standard-deck:${corp.standardDeckId}`,
    ),
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    ...(params.captures && params.actionIndices
      ? {
          testOnlyDecisionCheckpointCapture: {
            actionIndices: params.actionIndices,
            capture: (snapshot: AiSimulationDecisionCheckpointCapture) =>
              params.captures!.push(snapshot),
          },
        }
      : {}),
  });
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
