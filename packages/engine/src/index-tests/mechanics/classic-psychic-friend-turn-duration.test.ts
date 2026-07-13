import { describe, expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import { collectActiveModifiers } from "../../ability-engine/active-modifiers";
import {
  MECHANIC_SMOKE_DECKS,
  apply,
  encounterIce,
  installRunnerProgramForTest,
  mustAction,
  putCorpIceOnServer,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const PSYCHIC_FRIEND = "onr_classic_030_psychic-friend";

function psychicFriendGame(): GameState {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed: "classic-psychic-friend-current-turn",
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: "classic_psychic_friend_turn_runner",
        name: "Classic Psychic Friend Turn Runner",
        cards: [
          { id: PSYCHIC_FRIEND, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "classic_psychic_friend_turn_corp",
        name: "Classic Psychic Friend Turn Corp",
        cards: [
          { id: "simple_code_gate_ice", quantity: 1 },
          { id: "onr_v1_244_filter", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 99,
    }),
  );
  state.runner.credits = 40;
  state.runner.clicks = 10;
  state.runner.memoryLimit = 8;
  state.runner.maxHandSize = 100;
  state.corp.credits = 40;
  state.corp.clicks = 10;
  state.corp.maxHandSize = 100;
  installRunnerProgramForTest(state, PSYCHIC_FRIEND);
  putCorpIceOnServer(state, "archives", "simple_code_gate_ice");
  putCorpIceOnServer(state, "rd", "onr_v1_244_filter");
  return state;
}

function visiblePsychicFriendStrength(
  state: GameState,
  psychicFriendId: string,
): number | undefined {
  return getPlayerView(state, "runner").own.rig?.find(
    (card) => card.instanceId === psychicFriendId,
  )?.strength;
}

function startArchivesEncounterAgainstRezzedIce(state: GameState): GameState {
  const next = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "archives",
  );
  expect(next.timingPoint).toBe("run.encounter_ice");
  return next;
}

function advanceRunUntilEnded(state: GameState): GameState {
  let next = state;
  for (let step = 0; step < 12 && next.run; step += 1) {
    const corpPass = getLegalActions(next, "corp").find(
      (action) => action.type === "decline_rez",
    );
    if (corpPass) {
      next = apply(
        next,
        "corp",
        (action) => action.actionId === corpPass.actionId,
      );
      continue;
    }
    const runnerAction = getLegalActions(next, "runner").find((action) =>
      [
        "continue_run",
        "access_card",
        "decline_trash",
        "finish_access",
      ].includes(action.type),
    );
    if (runnerAction) {
      next = apply(
        next,
        "runner",
        (action) => action.actionId === runnerAction.actionId,
      );
      continue;
    }
    throw new Error(
      `Run cannot advance at ${next.timingPoint}: ${getLegalActions(
        next,
        "runner",
      )
        .map((action) => action.type)
        .join(",")}`,
    );
  }
  if (next.run) throw new Error("Run did not end within the safety limit");
  return next;
}

describe("Classic Psychic Friend current-turn pump", () => {
  it("stacks through forced, voluntary and successful run ends and expires at Runner turn end", () => {
    let state = psychicFriendGame();
    const psychicFriendId = state.runner.rig.programs.find(
      (cardId) => state.cardInstances[cardId]?.definitionId === PSYCHIC_FRIEND,
    );
    if (!psychicFriendId) throw new Error("Missing installed Psychic Friend");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = encounterIce(state, "archives", "simple_code_gate_ice");
    const pump = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === psychicFriendId,
    );
    expect(pump.costs).toEqual([{ credits: 2 }]);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: pump.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "psychic-friend-wrong-side",
    });
    expect(wrongSide).toMatchObject({
      ok: false,
      error: { code: "ERR_WRONG_SIDE" },
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: pump.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "psychic-friend-stale",
    });
    expect(stale).toMatchObject({
      ok: false,
      error: { code: "ERR_STALE_STATE" },
    });

    const creditsBeforePump = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === pump.actionId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === psychicFriendId,
    );
    expect(state.runner.credits).toBe(creditsBeforePump - 4);
    expect(state.temporaryBreakerStrengthModifiersUntilEndOfTurn).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: psychicFriendId,
        sourceDefinitionId: PSYCHIC_FRIEND,
        targetBreakerId: psychicFriendId,
        amount: 2,
        turnSerial: state.turnSerial,
        expires: "turn_end",
      }),
    ]);
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(3);
    expect(collectActiveModifiers(state)).toContainEqual(
      expect.objectContaining({
        sourceCardInstanceId: psychicFriendId,
        sourceDefinitionId: PSYCHIC_FRIEND,
        kind: "breaker_strength",
        amount: 2,
        duration: "turn",
        target: { kind: "card", id: psychicFriendId },
        visibility: "public",
      }),
    );

    state = advanceRunUntilEnded(state);
    expect(state.runnerTurnFlags?.successfulRunThisTurn).not.toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(state.temporaryBreakerStrengthModifiersUntilEndOfTurn).toHaveLength(
      1,
    );
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(3);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(3);
    state = apply(state, "runner", (action) => action.type === "jack_out");
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.successfulRunThisTurn).not.toBe(true);
    expect(state.temporaryBreakerStrengthModifiersUntilEndOfTurn).toHaveLength(
      1,
    );

    state = startArchivesEncounterAgainstRezzedIce(state);
    for (const subroutineIndex of [0, 1]) {
      const breakAction = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === psychicFriendId &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
      expect(breakAction.costs).toEqual([{ credits: 1 }]);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === breakAction.actionId,
      );
    }
    state = advanceRunUntilEnded(state);
    expect(state.runnerTurnFlags?.successfulRunThisTurn).toBe(true);
    expect(state.temporaryBreakerStrengthModifiersUntilEndOfTurn).toHaveLength(
      1,
    );
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(3);
    expect(validateGameState(state).ok).toBe(true);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(
      state.temporaryBreakerStrengthModifiersUntilEndOfTurn,
    ).toBeUndefined();
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(1);
    expect(
      collectActiveModifiers(state).some(
        (modifier) =>
          modifier.kind === "breaker_strength" &&
          modifier.duration === "turn" &&
          modifier.target?.kind === "card" &&
          modifier.target.id === psychicFriendId,
      ),
    ).toBe(false);

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.activeSide).toBe("runner");
    expect(visiblePsychicFriendStrength(state, psychicFriendId)).toBe(1);
    expect(validateGameState(state).ok).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
