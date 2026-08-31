import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

describe("R&D Interface Dig run-start choice regression", () => {
  it("keeps an activated R&D Protocol run on its central-pressure origin", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const runner = standardDeck("standard_runner_rnd_interface_dig");
    const corp = standardDeck("standard_corp_cheap_bag_tricks");
    const summary = simulateAiGame({
      seed: "meta-347-final-r4-c81f62a4e937-034",
      maxActions: 480,
      runnerDeck: deckDefinition(runner),
      corpDeck: deckDefinition(corp),
      runnerDeckMetadata: deckMetadata(runner),
      corpDeckMetadata: deckMetadata(corp),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      runnerDifficulty: "hard",
      corpDifficulty: "hard",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: 480 }, (_, index) => index),
        capture: (snapshot) => captures.push(snapshot),
      },
    });

    expect(summary.terminationKind).toBe("game_result");
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.replayOk).toBe(true);
    expect(summary.replayErrors).toEqual([]);

    const sourceCapture = captures.find(
      (entry) => entry.input.playerView.stateVersion === 20,
    );
    const choiceCapture = captures.find(
      (entry) =>
        entry.input.playerView.pendingChoice?.source ===
        "runner_run_start.order:run_21",
    );
    expect(sourceCapture).toBeDefined();
    expect(choiceCapture).toBeDefined();

    const source = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 20,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 21,
    );
    expect(source).toMatchObject({
      side: "runner",
      selectedActionId: "runner.activated_card_ability.rd",
      actionType: "activated_card_ability",
      planKind: "runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      sourceCapture?.input.legalActions.find(
        (action) => action.type === "activated_card_ability",
      )?.payload,
    ).toMatchObject({ runServerId: "rd" });
    expect(sourceCapture?.input.playerView.own.rig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definitionId: "onr_v1_050_r-and-d-protocol-files",
        }),
      ]),
    );
    expect(choice).toMatchObject({
      side: "runner",
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "runner.pressure_central",
      fallbackUsed: false,
    });
    expect(choice?.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "plan_first_root:plan:runner.pressure_central:",
        ),
        expect.stringContaining(
          "plan_first_executor:plan:runner.pressure_central:",
        ),
        "plan_scheduler:window:plan_bound_runner_run_start_order_choice:none",
      ]),
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

function deckMetadata(deck: StandardDeck) {
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    deckHash: deck.deckHash ?? `standard-deck:${deck.standardDeckId}`,
  };
}
