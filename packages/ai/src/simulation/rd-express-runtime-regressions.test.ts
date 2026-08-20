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
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { chooseAiAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

import { simulateAiGame } from "../simulation";

const RUNNER_DECK_ID = "standard_runner_rd_express";

describe("R&D Express selfplay runtime regressions", () => {
  it.each([
    {
      label: "keeps the opening Cheap Bag match plan-covered",
      corpDeckId: "standard_corp_cheap_bag_tricks",
      seed: "rd-express-corp-panel-01",
      maxActions: 18,
    },
    {
      label: "keeps late Jack 'n' Joe states plan-covered",
      corpDeckId: "standard_corp_chrome_rush_bureau",
      seed: "rd-express-corp-panel-04",
      maxActions: 100,
    },
    {
      label:
        "does not publish an executable-now priority claim with a resource gap",
      corpDeckId: "standard_corp_cheap_bag_tricks",
      seed: "rd-express-corp-panel-10",
      maxActions: 42,
    },
    {
      label: "preserves the Corp optional mandatory-draw choice origin",
      corpDeckId: "standard_classic_corp_superserum_control_grid_2026_07_01",
      seed: "rd-express-corp-panel-01",
      maxActions: 114,
    },
    {
      label: "preserves the Runner access choice origin",
      corpDeckId: "standard_classic_corp_superserum_control_grid_2026_07_01",
      seed: "rd-express-corp-panel-03",
      maxActions: 120,
    },
    {
      label: "keeps the consumed HQ-hold continuation identity exact",
      corpDeckId: "standard_classic_corp_remote_lab_deflection_2026_07_01",
      seed: "rd-express-corp-panel-06",
      maxActions: 145,
    },
    {
      label: "keeps Vacuum Link bound to the selected run continuation",
      corpDeckId: "standard_corp_manhunt_pressure_bureau",
      seed: "rd-express-corp-panel-07",
      maxActions: 65,
    },
    {
      label:
        "keeps Vacuum Link bound across approach, rez, and subroutine events",
      corpDeckId: "standard_corp_manhunt_pressure_bureau",
      seed: "rd-express-corp-panel-03",
      maxActions: 100,
    },
    {
      label:
        "keeps Vacuum Link bound when the run plan starts the run directly",
      corpDeckId: "standard_corp_manhunt_pressure_bureau",
      seed: "rd-express-corp-panel-08",
      maxActions: 205,
    },
    {
      label: "resolves Dr. Dreff through the active HQ defense plan",
      corpDeckId: "standard_corp_code_rot_bitte_eintreten_2026_07_16",
      seed: "rd-express-corp-panel-04",
      maxActions: 95,
    },
    {
      label: "plays exact tag cleanup while tags are active",
      corpDeckId: "standard_classic_corp_superserum_control_grid_2026_07_01",
      seed: "rd-express-corp-panel-08",
      maxActions: 45,
    },
    {
      label: "rotates a full hand with a functionally dead card",
      corpDeckId: "standard_corp_chrome_rush_bureau",
      seed: "rd-express-corp-panel-09",
      maxActions: 90,
    },
    {
      label:
        "ends an empty-Stack turn only after all voluntary routes are rejected",
      corpDeckId: "standard_corp_code_rot_bitte_eintreten_2026_07_16",
      seed: "rd-express-corp-panel-09",
      maxActions: 235,
    },
    {
      label: "keeps the late Superserum Runner turn plan-covered",
      corpDeckId:
        "standard_classic_corp_superserum_control_grid_2026_07_01",
      seed: "rd-express-corp-panel-10",
      maxActions: 367,
    },
    {
      label: "keeps the late CODE ROT Runner turn plan-covered",
      corpDeckId: "standard_corp_code_rot_bitte_eintreten_2026_07_16",
      seed: "rd-express-corp-panel-03",
      maxActions: 169,
    },
  ])(
    "$label",
    ({ label, corpDeckId, seed, maxActions }) => {
      const captures: AiSimulationDecisionCheckpointCapture[] = [];
      const summary = simulateStandardGame({
        corpDeckId,
        seed,
        maxActions,
        captures,
      });

      expect(
        summary.errors,
        JSON.stringify(
          captures
            .filter((capture) => {
              const failureVersions = new Set(
                (summary.runtimeFailures ?? []).map(
                  (failure) => failure.stateVersion,
                ),
              );
              return (
                capture.state.stateVersion >= maxActions - 2 ||
                failureVersions.has(capture.state.stateVersion)
              );
            })
            .map(captureDiagnostic),
          undefined,
          2,
        ),
      ).toEqual([]);
      expect(summary.runtimeFailures).toEqual([]);
      expect(summary.metrics.illegalActions).toBe(0);
      expect(summary.replayOk).toBe(true);

    },
    60_000,
  );

  it("keeps the next R&D multiaccess target current after declining trash", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      corpDeckId: "standard_corp_original_speed_v10",
      seed: "rd-express-corp-panel-08",
      maxActions: 266,
      captures,
    });
    const failingCapture = captures.find(
      (capture) => capture.state.stateVersion === 265,
    );
    resetResidentPlanPortfolioMemory();
    const failingDecision = failingCapture
      ? chooseAiAction(failingCapture.input, {
          persistTacticalPlanMemory: false,
        })
      : undefined;

    expect(
      summary.errors,
      JSON.stringify(
        {
          captures: captures
            .filter((capture) => capture.state.stateVersion >= 263)
            .map(captureDiagnostic),
          failingDecision,
        },
        undefined,
        2,
      ),
    ).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.replayOk).toBe(true);
  }, 30_000);

  it("finishes the former Manhunt action-limit seed", () => {
    const summary = simulateStandardGame({
      corpDeckId: "standard_corp_manhunt_pressure_bureau",
      seed: "rd-express-corp-panel-05",
      maxActions: 1_000,
    });

    expect(summary.terminationKind).toBe("game_result");
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.replayOk).toBe(true);
  }, 120_000);

  it("keeps a Vacuum Link continuation bound across every contiguous Corp rez pass", () => {
    const summary = simulateStandardGame({
      runnerDeckId: "standard_proteus_runner_breaker_lab_2026_05_25",
      corpDeckId: "standard_corp_manhunt_pressure_bureau",
      seed: "selfplay-014-54ad6e1cf68b6922230d1f4bc7d4bab0",
      maxActions: 286,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.replayOk).toBe(true);
  }, 120_000);
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
  runnerDeckId?: string;
  corpDeckId: string;
  seed: string;
  maxActions: number;
  captures?: AiSimulationDecisionCheckpointCapture[];
}) {
  const runner = standardSnapshot(params.runnerDeckId ?? RUNNER_DECK_ID);
  const corp = standardSnapshot(params.corpDeckId);
  return simulateAiGame({
    seed: params.seed,
    maxActions: params.maxActions,
    runnerDeck: buildEngineDeck(runner),
    corpDeck: buildEngineDeck(corp),
    runnerDeckMetadata: runner.publicMetadata,
    corpDeckMetadata: corp.publicMetadata,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...(params.captures
      ? {
          testOnlyDecisionCheckpointCapture: {
            actionIndices: Array.from(
              { length: params.maxActions },
              (_, index) => index,
            ),
            capture: (snapshot: AiSimulationDecisionCheckpointCapture) => {
              params.captures!.push(snapshot);
            },
          },
        }
      : {}),
  });
}

function captureDiagnostic(capture: AiSimulationDecisionCheckpointCapture) {
  return {
    actionIndex: capture.actionIndex,
    side: capture.side,
    stateVersion: capture.state.stateVersion,
    timingPoint: capture.state.timingPoint,
    clicks: capture.input.playerView.own.clicks,
    credits: capture.input.playerView.own.credits,
    stackOrRdCount: capture.input.playerView.own.stackOrRdCount,
    agendaPoints: capture.input.playerView.own.agendaPoints,
    maxHandSize: capture.input.playerView.own.maxHandSize,
    tags: capture.input.playerView.own.tags,
    pendingChoice: capture.input.playerView.pendingChoice,
    eventTail: capture.input.eventTail?.slice(-4),
    grip: capture.input.playerView.own.gripOrHq.map((card) => ({
      instanceId: card.instanceId,
      definitionId: card.definitionId,
      type: card.type,
      subtypes: card.subtypes,
      rulesText: card.rulesText,
    })),
    rig: capture.input.playerView.own.rig?.map((card) => ({
      instanceId: card.instanceId,
      definitionId: card.definitionId,
      type: card.type,
      subtypes: card.subtypes,
    })),
    legalActions: capture.input.legalActions.map((action) => ({
      actionId: action.actionId,
      type: action.type,
      source: action.source,
      payload: action.payload,
    })),
  };
}

function standardDeck(standardDeckId: string): StandardDeck {
  const deck = (standardDeckCatalog as { decks: StandardDeck[] }).decks.find(
    (candidate) => candidate.standardDeckId === standardDeckId,
  );
  if (!deck) throw new Error(`Missing standard deck ${standardDeckId}.`);
  return deck;
}

function standardSnapshot(standardDeckId: string) {
  const deck = standardDeck(standardDeckId);
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
  if (!profile)
    throw new Error(`Missing deck format profile for ${standardDeckId}.`);

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
