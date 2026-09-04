import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import profilesData from "../../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../../data/decks/deck-format-profiles-1.3.0.json";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  buildEngineDeck,
  createDeckSnapshot,
  type DeckFormatProfile,
  type DeckValidationContext,
  type EditableDeck,
} from "@netgrid/decks";
import { describe, expect, it } from "vitest";

import { simulateAiGame } from "../simulation";

const RUNNER_DECK_ID =
  "standard_runner_krashkurs_clown_kreditmaschine_2026_07_11";
const CORP_DECK_ID =
  "standard_proteus_corp_hidden_node_control_2026_05_25";
const SCORE_ROOT =
  "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";
const SCORE_SUPPORT =
  "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_proteus_005_marked-accounts_1%3Aremote_1";

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
};

describe("SP-082 score campaign multi-step regression", () => {
  it(
    "funds across the opponent turn, hands off to protection, and installs the agenda",
    () => {
      const runner = standardSnapshot(RUNNER_DECK_ID);
      const corp = standardSnapshot(CORP_DECK_ID);
      const summary = simulateAiGame({
        seed: "meta-357-final-036",
        maxActions: 500,
        runnerDeck: buildEngineDeck(runner),
        corpDeck: buildEngineDeck(corp),
        runnerDeckMetadata: runner.publicMetadata,
        corpDeckMetadata: corp.publicMetadata,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
      });

      expect(summary).toMatchObject({
        terminationKind: "game_result",
        winner: "runner",
        gameEndReason: "agenda_points",
        actions: 327,
        turns: 35,
        finalAgendaPoints: { runner: 8, corp: 3 },
        finalStateHash: "fnv1a:af6a823e",
        replayOk: true,
        replayErrors: [],
        errors: [],
        runtimeFailures: [],
      });

      for (const stateVersion of [107, 108, 109, 117]) {
        expect(entry(summary, stateVersion)).toMatchObject({
          selectedActionId: "corp.gain_credit",
          actionType: "gain_credit",
          planKind: "corp.economy",
          fallbackUsed: false,
          debugFacts: expect.arrayContaining([
            `plan_execution:instance:${SCORE_SUPPORT}`,
            `plan_first_root:${SCORE_ROOT}`,
            `plan_priority_delegated_from:${SCORE_ROOT}`,
          ]),
        });
      }

      for (const stateVersion of [118, 119]) {
        expect(entry(summary, stateVersion)).toMatchObject({
          selectedActionId: "corp.gain_credit",
          actionType: "gain_credit",
          planKind: "corp.economy",
          debugFacts: expect.arrayContaining([
            "plan_execution:instance:plan:corp.economy:economy-residual-capacity%3Acorp%3A12",
          ]),
        });
        expect(entry(summary, stateVersion).debugFacts).not.toEqual(
          expect.arrayContaining([
            `plan_execution:instance:${SCORE_SUPPORT}`,
            `plan_priority_delegated_from:${SCORE_ROOT}`,
          ]),
        );
      }

      expect(entry(summary, 148)).toMatchObject({
        actionType: "install_card",
        planKind: "corp.defend_servers",
        fallbackUsed: false,
        debugFacts: expect.arrayContaining([
          "plan_execution:capability:develop_score_protection",
          `plan_first_root:${SCORE_ROOT}`,
          `plan_priority_delegated_from:${SCORE_ROOT}`,
        ]),
      });
      expect(entry(summary, 149)).toMatchObject({
        actionType: "install_card",
        planKind: "corp.score_agenda",
        fallbackUsed: false,
        debugFacts: expect.arrayContaining([
          "plan_execution:capability:install_score_agenda",
          `plan_execution:instance:${SCORE_ROOT}`,
          `plan_first_root:${SCORE_ROOT}`,
        ]),
      });
    },
    180_000,
  );
});

function entry(summary: ReturnType<typeof simulateAiGame>, stateVersion: number) {
  const result = summary.actionSequence.find(
    (candidate) => candidate.stateVersionBefore === stateVersion,
  );
  if (!result) throw new Error(`Missing action at stateVersion ${stateVersion}.`);
  return result;
}

function standardSnapshot(standardDeckId: string) {
  const deck = (standardDeckCatalog as { decks: StandardDeck[] }).decks.find(
    (candidate) => candidate.standardDeckId === standardDeckId,
  );
  if (!deck) throw new Error(`Missing standard deck ${standardDeckId}.`);
  const profile = [
    ...(profilesData.profiles as DeckFormatProfile[]),
    ...(profilesData130.profiles as DeckFormatProfile[]),
  ]
    .reverse()
    .find(
      (candidate) =>
        candidate.profileId === deck.formatProfileId &&
        candidate.version === deck.formatProfileVersion,
    );
  if (!profile) {
    throw new Error(`Missing deck format profile for ${standardDeckId}.`);
  }

  const now = `${standardDeckCatalog.curatedAt}T00:00:00.000Z`;
  const editable: EditableDeck = {
    deckId: deck.standardDeckId,
    deckVersion: "1",
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    cards: deck.cards,
    createdAt: now,
    updatedAt: now,
  };
  const context: DeckValidationContext = {
    cardsById: createRuntimeCardsById(),
    profile,
  };
  return createDeckSnapshot(editable, context, {
    snapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    ...(profile.rulesBaselineIds[0]
      ? { rulesBaselineId: profile.rulesBaselineIds[0] }
      : {}),
  });
}
