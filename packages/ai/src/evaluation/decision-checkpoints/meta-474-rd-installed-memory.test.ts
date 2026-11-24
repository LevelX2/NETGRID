import { createGameAfterSetup } from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecisionInput,
  type PublicGameEvent,
} from "@netgrid/shared";
import { expect, it } from "vitest";
import {
  apply,
  toRunnerTurn,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { reconstructBeliefState } from "../../belief-state";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

const BANPEI = 435;
const OLIVIA_SALAZAR = 575;
const SIMPLE_BARRIER_ICE = 589;

function fixture() {
  const scenarioCardIds = [BANPEI, OLIVIA_SALAZAR, SIMPLE_BARRIER_ICE];
  const corpDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.corp,
    cards: [
      ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
        (card) => !scenarioCardIds.includes(card.id),
      ),
      ...scenarioCardIds.map((id) => ({ id, quantity: 1 })),
    ],
  };
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "olivia-rd-ice-memory",
      corpDeck,
    }),
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpCredits(2)
    .withCorpRemoteRoot("rd", OLIVIA_SALAZAR, 0, {
      faceup: true,
      rezzed: true,
    })
    .withCorpIceOnServer("rd", SIMPLE_BARRIER_ICE)
    .withCorpIceOnServer("rd", BANPEI);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      action.payload?.discountedRezSourceDefinitionId === OLIVIA_SALAZAR,
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");

  expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
    temporaryDiscountedRunEndDerez: true,
    derezzedCount: 1,
  });

  const runnerDeck = ORIGINALSET_DEFAULT_DECKS.runner;
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const rez = input.eventTail.find(
    (event) =>
      event.publicPayload.actionType === "rez_ice" &&
      event.publicPayload.cardDefinitionId === BANPEI,
  );
  const positionKey = rez?.publicPayload.installedPositionKey;
  if (!rez || typeof positionKey !== "string") {
    throw new Error("Missing public Banpei rez observation");
  }
  return { input, rez, positionKey };
}

it("retains the publicly rezzed R&D ICE identity after Olivia derezzes it", () => {
  const { input, rez, positionKey } = fixture();
  const viewBefore = structuredClone(input.playerView);
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).toContainEqual(
    expect.objectContaining({
      zone: "rd",
      positionKey,
      definitionId: BANPEI,
      sourceEventId: rez.eventId,
    }),
  );
  expect(input.playerView).toEqual(viewBefore);
  expect(
    input.playerView.servers.find((server) => server.id === "rd")?.ice[1],
  ).toMatchObject({ known: false, rezzed: false });
});

it("does not invent an identity for unrevealed R&D ICE", () => {
  const { input } = fixture();
  input.eventTail = [];
  input.playerView.publicEvents = [];
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).toEqual([]);
});

it("keeps installed R&D ICE knowledge when only the hidden deck is shuffled", () => {
  const { input, positionKey } = fixture();
  appendMutation(input, {
    hiddenZoneMutationKind: "shuffle",
    hiddenZoneAffectedCardCount: 10,
    hiddenZoneChangesRd: true,
  });
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).toContainEqual(
    expect.objectContaining({ zone: "rd", definitionId: BANPEI, positionKey }),
  );
});

it("invalidates R&D installed identity after an actual public board reorder", () => {
  const { input, positionKey } = fixture();
  appendMutation(input, {
    hiddenZoneAction: "conceal_and_reorder_installed_ice",
    hiddenZoneMutationKind: "reorder",
    hiddenZoneAffectedCardCount: 2,
    hiddenZoneChangesRd: false,
  });
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).not.toContainEqual(
    expect.objectContaining({ zone: "rd", definitionId: BANPEI, positionKey }),
  );
});

function appendMutation(
  input: AiDecisionInput,
  mutation: PublicGameEvent["publicPayload"],
): void {
  const stateVersionBefore = input.playerView.stateVersion;
  const stateVersionAfter = stateVersionBefore + 1;
  const event: PublicGameEvent = {
    eventId: stateVersionAfter + 1,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter,
    stateHashAfter: "fnv1a:authored-rd-mutation",
    publicPayload: {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "rd",
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      ...mutation,
    },
  };
  input.playerView.stateVersion = stateVersionAfter;
  input.eventTail.push(event);
  input.playerView.publicEvents.push(event);
}
