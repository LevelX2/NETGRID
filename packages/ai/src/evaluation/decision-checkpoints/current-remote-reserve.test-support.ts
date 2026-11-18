import { applyAction, createGameAfterSetup } from "@netgrid/engine";
import { DEMO_DECKS, type DeckDefinition } from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { exportAiRuntimeCheckpoint } from "./runtime-checkpoint";

const runnerCards = [
  278,
  233,
  228,
  366,
  311,
  286,
  309,
  307,
  291,
];
const corpCards = [
  69,
  75,
  490,
];
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "current-terminal-reserve-runner",
  cards: [
    ...DEMO_DECKS.demo_runner_001.cards,
    ...runnerCards.map((id) => ({ id, quantity: 1 })),
  ],
};
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "current-terminal-reserve-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    ...corpCards.map((id) => ({ id, quantity: 1 })),
    { id: 62, quantity: 4 },
  ],
};

/** Fresh native geometry: one known 3-credit ICE path and two unknown ICE. */
export function currentRemoteReserveFixture(credits = 21, bank = true) {
  let state = createGameAfterSetup({
    seed: "current-terminal-remote-reserve",
    runnerDeck,
    corpDeck,
    agendaPointsToWin: 7,
  });
  for (const actionId of ["ce", "c9"]) {
    if (actionId === "c9")
      RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(credits)
    .withRunnerClicks(4)
    .withCorpCredits(23)
    .withRunnerProgramInstalled(278)
    .withRunnerProgramInstalled(233)
    .withRunnerProgramInstalled(228)
    .withRezzedCorpIceOnServer("r1", 69)
    .withCorpIceOnServer("r1", 75)
    .withCorpIceOnServer("r1", 490)
    .withCorpRemoteAgenda("r1", 1);
  for (const card of runnerCards.slice(4)) fixture.withRunnerCardInGrip(card);
  if (bank)
    fixture.withRunnerResourceInstalled(366, { bit: 3 });
  state.runner.memoryUsed = 3;
  // PlayerView derives the score from scored cards, not a numeric state field.
  for (const side of ["runner", "corp"] as const) {
    for (let count = 0; count < 2; count++) {
      const card = Object.values(state.cardInstances).find(
        (candidate) =>
          candidate.definitionId === 62 &&
          candidate.zone.zone !== "scoreArea",
      );
      if (!card) throw new Error("Missing native scored-agenda fixture card");
      state.corp.hq = state.corp.hq.filter((id) => id !== card.instanceId);
      state.corp.rd = state.corp.rd.filter((id) => id !== card.instanceId);
      state[side].scoreArea.push(card.instanceId);
      card.zone = { side, zone: "scoreArea" };
      card.controller = side;
      card.faceup = true;
      card.rezzed = true;
    }
  }
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
  return {
    input,
    runtime: exportAiRuntimeCheckpoint(input, runnerDeck.id),
    validation: {
      currentEngineLegalActions: true,
      currentEnginePlayerView: true,
      currentEngineServiceQuotes: true,
    },
  };
}
