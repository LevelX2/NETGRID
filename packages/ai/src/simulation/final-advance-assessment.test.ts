import {
  applyAction,
  CARD_DEFINITIONS_BY_ID,
  createGameAfterSetup,
  DEMO_DECKS,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import { prepareCorpScoreHandRetention } from "../corp/score/score-hand-retention";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import {
  finalAdvanceAssessmentForSimulationAction,
  isProtectBeforeAdvanceSimulationAction,
} from "./final-advance-assessment";

const GRID = 586;
const TYCHO = 432;
const OVERTIME = 509;
const ICE = 589;
const SERVER = "r1";
const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards.filter(
      (card) => ![GRID, TYCHO, OVERTIME].includes(card.id),
    ),
    ...[GRID, TYCHO, OVERTIME].map((id) => ({ id, quantity: 1 })),
  ],
};

function createState(): GameState {
  const state = createGameAfterSetup({
    matchId: "simulation-final-advance",
    seed: "simulation-final-advance",
    corpDeck,
    runnerDeck: DEMO_DECKS.demo_runner_001,
  });
  const draw = buildInput(state).legalActions.find(
    (action) => action.type === "mandatory_draw",
  )!;
  return apply(state, draw);
}

function buildInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

function apply(state: GameState, action: LegalAction): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

it("uses the Engine's discounted advancement requirement in the final-advance metric", () => {
  const state = createState();
  const printedDifficulty =
    CARD_DEFINITIONS_BY_ID[588]!.advancementRequirement!;
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteAgenda(SERVER, printedDifficulty - 3)
    .withCorpRemoteRoot(SERVER, GRID, 0, { rezzed: true });
  const input = buildInput(state);
  const action = input.legalActions.find(
    (candidate) => candidate.type === "advance_card",
  )!;
  const after = apply(state, action);
  const cardId = action.payload!.cardId as string;
  expect(
    finalAdvanceAssessmentForSimulationAction(
      state,
      after,
      input,
      action,
      SERVER,
      [cardId],
      1,
    ),
  ).toMatchObject({
    finalAdvance: true,
    targetCardId: cardId,
    advancesRemainingAfterAction: 1,
  });
});

it("attributes untargeted basic income when it makes near-score ICE affordable", () => {
  const state = createState();
  const rezCost = CARD_DEFINITIONS_BY_ID[ICE]!.rezCost!;
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteAgenda(SERVER, 2)
    .withCorpIceOnServer(SERVER, ICE)
    .withCorpCredits(rezCost - 1);
  const input = buildInput(state);
  const economy = input.legalActions.find(
    (candidate) => candidate.type === "gain_credit",
  )!;
  expect(
    isProtectBeforeAdvanceSimulationAction(
      state,
      apply(state, economy),
      input,
      economy,
      undefined,
    ),
  ).toBe(true);
});

it("does not reserve an action burst for an installed agenda already within the ordinary three-click horizon", () => {
  const state = createState();
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(OVERTIME)
    .withCorpRemoteRoot(SERVER, TYCHO, 0)
    .withCorpRemoteRoot(SERVER, GRID, 0, { rezzed: true })
    .withCorpCredits(10);
  const input = buildInput(state);
  expect(
    input.playerView.servers.find((server) => server.id === SERVER)?.root,
  ).toContainEqual(
    expect.objectContaining({ definitionId: TYCHO, advancementRequirement: 3 }),
  );
  expect(
    prepareCorpScoreHandRetention(input)(input.playerView.own.gripOrHq),
  ).toBe(0);
});
