import { applyAction, createGameAfterSetup } from "@netgrid/engine";
import { DEMO_DECKS, type DeckDefinition } from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { exportAiRuntimeCheckpoint } from "./runtime-checkpoint";

const runnerCards = [
  "onr_v1_066_snowball",
  "onr_v1_021_dwarf",
  "onr_v1_016_cyfermaster",
  "onr_v1_154_broker",
  "onr_v1_099_mantis-fixer-at-large",
  "onr_v1_074_worm",
  "onr_v1_097_livewires-contacts",
  "onr_v1_095_jack-n-joe",
  "onr_v1_079_bodyweight-synthetic-blood",
];
const corpCards = [
  "onr_proteus_011_brain-wash",
  "onr_proteus_017_credit-blocks",
  "onr_v1_278_wall-of-ice",
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
    { id: "onr_proteus_004_fetal-ai", quantity: 4 },
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
  for (const actionId of ["corp.mandatory_draw", "corp.end_turn"]) {
    if (actionId === "corp.end_turn")
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
    .withRunnerProgramInstalled("onr_v1_066_snowball")
    .withRunnerProgramInstalled("onr_v1_021_dwarf")
    .withRunnerProgramInstalled("onr_v1_016_cyfermaster")
    .withRezzedCorpIceOnServer("remote_1", "onr_proteus_011_brain-wash")
    .withCorpIceOnServer("remote_1", "onr_proteus_017_credit-blocks")
    .withCorpIceOnServer("remote_1", "onr_v1_278_wall-of-ice")
    .withCorpRemoteAgenda("remote_1", 1);
  for (const card of runnerCards.slice(4)) fixture.withRunnerCardInGrip(card);
  if (bank)
    fixture.withRunnerResourceInstalled("onr_v1_154_broker", { bit: 3 });
  state.runner.memoryUsed = 3;
  // PlayerView derives the score from scored cards, not a numeric state field.
  for (const side of ["runner", "corp"] as const) {
    for (let count = 0; count < 2; count++) {
      const card = Object.values(state.cardInstances).find(
        (candidate) =>
          candidate.definitionId === "onr_proteus_004_fetal-ai" &&
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
