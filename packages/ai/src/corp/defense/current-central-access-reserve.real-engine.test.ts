import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type {
  DeckDefinition,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { corpCurrentRunAgendaExposure } from "./corp-server-protection-reserve";

function standardDeck(id: string, side: Side): DeckDefinition {
  const definition = catalog.decks.find((deck) => deck.standardDeckId === id);
  if (!definition || definition.side !== side)
    throw new Error("Missing standard deck " + id);
  return {
    id,
    name: definition.name,
    side,
    identity: definition.identityCardId,
    cards: definition.cards.map(({ cardId, quantity }) => ({
      id: cardId,
      quantity,
    })),
  };
}

const runnerDeck = standardDeck("standard_runner_adb10896", "runner");
const corpDeck = standardDeck(
  "standard_classic_corp_superserum_control_grid_2026_07_01",
  "corp",
);

function play(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
) {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error("Missing native action at " + state.timingPoint);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function firstRunnerTurn() {
  let state = createGameAfterSetup({
    seed: "meta-920-r01-dfb371d4dea26385-009",
    runnerDeck,
    corpDeck,
    traceRulesProfile: "modern_open",
  });
  state = play(state, "corp", (a) => a.type === "mandatory_draw");
  for (const [sourceId, serverId] of [
    [12, "hq"],
    [25, "new_remote"],
    [12, "rd"],
  ] as const) {
    state = play(
      state,
      "corp",
      (a) =>
        a.type === "install_card" &&
        state.cardInstances[a.source]?.definitionId === sourceId &&
        a.payload?.serverId === serverId,
    );
  }
  return play(state, "corp", (a) => a.type === "end_turn");
}

function corpInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
}

beforeEach(resetResidentPlanPortfolioMemory);

it("stops committed terminal R&D multiaccess while future HQ retains its own forecast", () => {
  const state = firstRunnerTurn();
  const ordinary = play(
    state,
    "runner",
    (a) => a.type === "start_run" && a.payload?.serverId === "rd",
  );
  expect(
    corpCurrentRunAgendaExposure(corpInput(ordinary), "rd")?.maximumPoints,
  ).toBe(3);

  const multiaccess = play(
    state,
    "runner",
    (a) =>
      a.type === "play_event" &&
      state.cardInstances[a.source]?.definitionId === 293 &&
      a.payload?.serverId === "rd",
  );
  const input = corpInput(multiaccess);
  const view = input.playerView;
  const quote = view.corpCurrentCentralAccessQuote;
  expect(quote).toEqual({
    runId: multiaccess.run?.runId,
    stateVersion: multiaccess.stateVersion,
    serverId: "rd",
    accessCount: 3,
  });
  expect(
    view.corpCentralAccessQuotes?.map((entry) => entry.effectiveAccessCount),
  ).toEqual([1, 1]);
  expect(getPlayerView(multiaccess, "runner")).not.toHaveProperty(
    "corpCurrentCentralAccessQuote",
  );
  expect(corpCurrentRunAgendaExposure(input, "rd")?.maximumPoints).toBe(7);
  expect(
    corpCurrentRunAgendaExposure(
      {
        ...input,
        playerView: {
          ...view,
          corpCurrentCentralAccessQuote: {
            ...quote!,
            stateVersion: multiaccess.stateVersion - 1,
          },
        },
      },
      "rd",
    ),
  ).toBeUndefined();

  const action = input.legalActions.find((entry) => entry.type === "rez_ice");
  expect(action).toBeDefined();
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: action?.actionId,
    fallbackUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
  ).toBeDefined();
  const rezzed = play(
    multiaccess,
    "corp",
    (a) => a.actionId === decision.actionId,
  );
  const stopped = play(rezzed, "runner", (a) => a.type === "continue_run");
  expect(stopped.run).toBeUndefined();
  expect(getPlayerView(stopped, "runner").own.agendaPoints).toBe(0);
});

it("binds the live access to R&D when an event enters through HQ", () => {
  const state = firstRunnerTurn();
  const redirected = play(
    state,
    "runner",
    (a) =>
      a.type === "play_event" &&
      state.cardInstances[a.source]?.definitionId === 318,
  );
  const input = corpInput(redirected);
  expect(input.playerView.run?.attackedServerId).toBe("hq");
  expect(input.playerView.corpCurrentCentralAccessQuote).toMatchObject({
    serverId: "rd",
    accessCount: 1,
  });
  expect(corpCurrentRunAgendaExposure(input, "hq")?.expectedPoints).toBe(
    15 / 39,
  );
  expect(corpCurrentRunAgendaExposure(input, "rd")).toBeUndefined();
});
