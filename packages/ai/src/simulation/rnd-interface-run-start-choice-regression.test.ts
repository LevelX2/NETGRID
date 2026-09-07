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
      // The current exact-cost line completes after 714 actions.
      maxActions: 900,
      runnerDeck: deckDefinition(runner),
      corpDeck: deckDefinition(corp),
      runnerDeckMetadata: deckMetadata(runner),
      corpDeckMetadata: deckMetadata(corp),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      runnerDifficulty: "hard",
      corpDifficulty: "hard",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: 900 }, (_, index) => index),
        capture: (snapshot) => captures.push(snapshot),
      },
    });

    expect(summary.terminationKind).toBe("game_result");
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.replayOk).toBe(true);
    expect(summary.replayErrors).toEqual([]);

    // Earlier Corp actions may change absolute versions without changing this
    // Runner continuation. Bind the test to the actual source invocation and
    // its immediate Engine choice, not a historical run_21 identifier.
    const sourceIndex = summary.actionSequence.findIndex(
      (entry) =>
        entry.side === "runner" &&
        entry.selectedActionId === "runner.activated_card_ability.rd",
    );
    expect(sourceIndex).toBeGreaterThanOrEqual(0);
    const source = summary.actionSequence[sourceIndex];
    const choice = summary.actionSequence[sourceIndex + 1];
    const sourceCapture = captures.find(
      (entry) =>
        entry.input.playerView.stateVersion === source?.stateVersionBefore,
    );
    const choiceCapture = captures.find(
      (entry) =>
        entry.input.playerView.stateVersion === choice?.stateVersionBefore,
    );
    expect(sourceCapture).toBeDefined();
    expect(choiceCapture?.input.playerView.pendingChoice?.source).toMatch(
      /^runner_run_start\.order:run_/,
    );
    expect(source).toMatchObject({
      side: "runner",
      selectedActionId: "runner.activated_card_ability.rd",
      actionType: "activated_card_ability",
      planKind: "runner.pressure_central",
      fallbackUsed: false,
    });
    const protocol = sourceCapture?.input.playerView.own.rig?.find(
      (card) => card.definitionId === "onr_v1_050_r-and-d-protocol-files",
    );
    // The public simulation sequence redacts action IDs. Resolve its unique
    // semantic route against the actor-private captured LegalAction offer.
    const sourceActions = sourceCapture?.input.legalActions.filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === protocol?.instanceId &&
        action.payload?.runServerId === "rd",
    );
    expect(sourceActions).toHaveLength(1);
    expect(sourceActions?.[0]?.expiresAtStateVersion).toBe(
      source?.stateVersionBefore,
    );
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
    const sourceRoot = source?.evidence.find((fact) =>
      fact.startsWith("plan_first_root:"),
    );
    const sourceExecutor = source?.evidence.find((fact) =>
      fact.startsWith("plan_first_executor:"),
    );
    expect(sourceRoot).toBeDefined();
    expect(sourceExecutor).toBeDefined();
    expect(choice?.evidence).toEqual(
      expect.arrayContaining([sourceRoot, sourceExecutor]),
    );
  }, 180_000);
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
