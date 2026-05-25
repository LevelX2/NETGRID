import type {
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction as engineApplyAction,
  getLegalActions,
} from "../index";
import {
  applyAction,
  buildApplyAction,
  configureApplyActionCoreHost,
  type ApplyActionCoreHost,
} from "./apply-action";
import { createGame } from "./create-game";
import { hashState } from "./hash";
import { replayGameEvents } from "./replay";

describe("game apply-action core", () => {
  it("matches the public Engine API for a simple Corp action", () => {
    const state = createGame({
      seed: "arch-61-apply-action-corp",
      setupMode: "completed",
    });
    const action = playerActionFor(state, mandatoryDrawLegalAction(state));

    expect(applyAction(state, action)).toEqual(engineApplyAction(state, action));
  });

  it("matches the public Engine API for a simple Runner action", () => {
    const state = createGame({
      seed: "arch-61-apply-action-runner",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;
    const legalAction = getLegalActions(state, "runner").find(
      (action) => action.type === "gain_credit",
    );
    expect(legalAction).toBeDefined();
    if (!legalAction) return;
    const action = playerActionFor(state, legalAction);

    expect(applyAction(state, action)).toEqual(engineApplyAction(state, action));
  });

  it("uses the core host once and preserves EventLog, stateVersion and StateHash timing", () => {
    const state = createGame({
      seed: "arch-61-apply-action-host",
      setupMode: "completed",
    });
    const legalAction = mandatoryDrawLegalAction(state);
    const action = playerActionFor(state, legalAction);
    const calls: PlayerAction[] = [];
    const host: ApplyActionCoreHost = {
      actions: {
        performAction: (_state, _legalAction, playerAction) => {
          calls.push(playerAction);
        },
      },
    };

    const result = buildApplyAction(host, state, action, {
      publicEventsMode: "latest",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(calls).toEqual([action]);
    expect(result.state.stateVersion).toBe(state.stateVersion + 1);
    expect(result.state.eventLog).toHaveLength(state.eventLog.length + 1);
    expect(result.event.stateVersionBefore).toBe(state.stateVersion);
    expect(result.event.stateVersionAfter).toBe(state.stateVersion + 1);
    expect(result.event.stateHashAfter).toBe(result.stateHash);
    expect(result.publicEvents).toHaveLength(1);
    expect(result.publicEvents[0]).toEqual({
      eventId: result.event.eventId,
      type: result.event.type,
      stateVersionBefore: result.event.stateVersionBefore,
      stateVersionAfter: result.event.stateVersionAfter,
      stateHashAfter: result.event.stateHashAfter,
      visibilityClass: result.event.visibilityClass,
      publicPayload: result.event.publicPayload,
    });
  });

  it("keeps invalid and stale action behavior stable", () => {
    const state = createGame({
      seed: "arch-61-apply-action-invalid",
      setupMode: "completed",
    });
    const unknownAction: PlayerAction = {
      matchId: state.matchId,
      side: "corp",
      actionId: "arch_61_unknown_action",
      clientKnownStateVersion: state.stateVersion,
    };
    const staleAction = {
      ...playerActionFor(state, mandatoryDrawLegalAction(state)),
      clientKnownStateVersion: state.stateVersion - 1,
    };

    expect(applyAction(state, unknownAction)).toEqual(
      engineApplyAction(state, unknownAction),
    );
    expect(applyAction(state, staleAction)).toEqual(
      engineApplyAction(state, staleAction),
    );
  });

  it("keeps PendingChoice validation and replay integration stable", () => {
    const state = createGame({
      seed: "arch-61-apply-action-choice",
      setupMode: "completed",
    });
    state.pendingChoice = {
      choiceId: "arch_61_choice",
      side: "runner",
      source: "arch_61.choice",
      kind: "select_option",
      prompt: "ARCH-61 Test Choice",
      options: [{ id: "ok", label: "OK" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const legalAction = getLegalActions(state, "runner").find(
      (action) => action.type === "resolve_choice",
    );
    expect(legalAction).toBeDefined();
    if (!legalAction) return;
    const action: PlayerAction = {
      ...playerActionFor(state, legalAction),
      selectedChoices: {
        choiceId: "arch_61_choice",
        selectedOptionIds: ["ok"],
      },
    };

    const result = applyAction(state, action);
    expect(result).toEqual(engineApplyAction(state, action));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const replay = replayGameEvents(state, [result.event]);
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(result.stateHash);
  });

  it("throws clearly without a configured default host", () => {
    const state = createGame({
      seed: "arch-61-apply-action-unconfigured",
      setupMode: "completed",
    });
    const action = playerActionFor(state, mandatoryDrawLegalAction(state));
    const previousHost = configureApplyActionCoreHost(undefined);
    try {
      expect(() => applyAction(state, action)).toThrow(
        "ApplyActionCore-Host ist nicht initialisiert.",
      );
    } finally {
      configureApplyActionCoreHost(previousHost);
    }
  });
});

function mandatoryDrawLegalAction(state: GameState): LegalAction {
  const legalAction = getLegalActions(state, "corp").find(
    (action) => action.type === "mandatory_draw",
  );
  if (!legalAction) throw new Error("Missing mandatory draw action.");
  return legalAction;
}

function playerActionFor(
  state: GameState,
  legalAction: LegalAction,
): PlayerAction {
  return {
    matchId: state.matchId,
    side: legalAction.side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}
