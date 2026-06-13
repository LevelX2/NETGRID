import type { GameEvent, GameState, PlayerAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  replayEvents as engineReplayEvents,
} from "../index";
import { createGame } from "./create-game";
import { hashState } from "./hash";
import { buildReplayEvents, replayGameEvents, type ReplayHost } from "./replay";

describe("game replay facade", () => {
  it("replays Engine events with the same end state and StateHash as the public API", () => {
    const initial = createGame({
      seed: "arch-58-replay-real-action",
      setupMode: "completed",
    });
    const mandatoryDraw = getLegalActions(initial, "corp").find(
      (action) => action.type === "mandatory_draw",
    );
    expect(mandatoryDraw).toBeDefined();
    if (!mandatoryDraw) return;

    const result = applyAction(initial, {
      matchId: initial.matchId,
      side: "corp",
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: initial.stateVersion,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const replayedEvents = result.state.eventLog.slice(initial.eventLog.length);
    const replay = replayGameEvents(initial, replayedEvents);

    expect(replay).toEqual(engineReplayEvents(initial, replayedEvents));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(result.stateHash);
    expect(hashState(replay.state)).toBe(result.stateHash);
  });

  it("uses the configured ReplayHost action application in event order", () => {
    const initial = createGame({
      seed: "arch-58-replay-host-order",
      setupMode: "completed",
    });
    const action1 = replayAction(initial, "corp", "arch_58_action_1");
    const state1 = nextReplayState(initial, 1);
    const action2 = replayAction(state1, "corp", "arch_58_action_2");
    const state2 = nextReplayState(state1, 2);
    const calls: PlayerAction[] = [];
    const host: ReplayHost = {
      actions: {
        applyAction: (_state, action) => {
          calls.push(action);
          const state = calls.length === 1 ? state1 : state2;
          return {
            ok: true,
            state,
            event: replayEvent(`arch_58_host_result_${calls.length}`, action, state),
            publicEvents: [],
            stateHash: hashState(state),
          };
        },
      },
    };

    const replay = buildReplayEvents(host, initial, [
      replayEvent("arch_58_event_1", action1, state1),
      replayEvent("arch_58_event_2", action2, state2),
    ]);

    expect(replay.ok).toBe(true);
    expect(calls).toEqual([action1, action2]);
    expect(replay.actualFinalStateHash).toBe(hashState(state2));
  });

  it("keeps replay compatibility payload rejection stable", () => {
    const initial = createGame({
      seed: "arch-58-replay-invalid-payload",
      setupMode: "completed",
    });
    const event: GameEvent = {
      eventId: "arch_58_invalid_event",
      type: "test_invalid_replay_payload",
      stateVersionBefore: 0,
      stateVersionAfter: 1,
      stateHashAfter: hashState(initial),
      publicPayload: { actor: "corp" },
      privatePayload: { corp: { action: { actionId: "missing_fields" } } },
    };

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual([
      "Event arch_58_invalid_event has no replayable action.",
    ]);
  });

  it("keeps invalid replay action failure behavior stable", () => {
    const initial = createGame({
      seed: "arch-58-replay-stale-action",
      setupMode: "completed",
    });
    const action = replayAction(initial, "corp", "arch_58_unknown_action");
    const event = replayEvent("arch_58_failed_action", action, initial);

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors).toEqual([
      "Replay failed at arch_58_failed_action: ERR_UNKNOWN_ACTION",
    ]);
  });

  it("rejects replay public payloads with hidden card lists before applying actions", () => {
    const initial = createGame({
      seed: "arch-58-replay-hidden-payload",
      setupMode: "completed",
    });
    const action = replayAction(initial, "corp", "arch_58_action_1");
    const event = {
      ...replayEvent("arch_58_hidden_payload", action, initial),
      publicPayload: { actor: "corp", hqCardIds: "secret_card" },
    } as GameEvent;

    const replay = replayGameEvents(initial, [event]);

    expect(replay.ok).toBe(false);
    expect(replay.errors[0]).toContain("unsafe replay public payload");
  });
});

function replayAction(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
): PlayerAction {
  return {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}

function nextReplayState(state: GameState, version: number): GameState {
  return {
    ...structuredClone(state),
    stateVersion: version,
  };
}

function replayEvent(
  eventId: string,
  action: PlayerAction,
  stateAfter: GameState,
): GameEvent {
  return {
    eventId,
    type: "test_replay_action",
    stateVersionBefore: Math.max(0, stateAfter.stateVersion - 1),
    stateVersionAfter: stateAfter.stateVersion,
    stateHashAfter: hashState(stateAfter),
    publicPayload: { actor: action.side },
    privatePayload: { [action.side]: { action } },
  };
}
