import { describe, expect, it } from "vitest";
import {
  applyAction,
  CARD_DEFINITIONS_BY_ID,
  getLegalActions,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  replayEvents,
} from "../../index";
import {
  apply,
  applyChoice,
  mustAction,
  putCorpIceOnServer,
  sourceDefinition,
  toRunnerTurn,
  v096TraceGame,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { GameState } from "@netgrid/shared";

function continueRunAction(state: GameState): GameState {
  return apply(state, "runner", (action) => action.type === "continue_run");
}

function continueRunThroughMovement(state: GameState): GameState {
  const next = continueRunAction(state);
  if (next.timingPoint === "run.jack_out_window")
    return continueRunAction(next);
  return next;
}

function enterEncounterFromMovementWindow(state: GameState): GameState {
  if (state.timingPoint !== "run.jack_out_window" || state.run?.phase !== "movement")
    return state;
  return continueRunAction(state);
}

describe("MVP 0.96 Trace, Link and Bidding", () => {
  it("starts a public trace, resolves Corp and Runner bids, and applies add_tag on success", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-success"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;

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
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 2,
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      traceStarted: true,
      sourceDefinitionId: "v096_trace_probe_ice",
      baseTraceStrength: 2,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.corp.credits).toBe(4);
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 3,
      runnerLink: 0,
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      corpBid: 1,
      traceStrength: 3,
      runnerLink: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.credits).toBe(5);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      runnerBid: 0,
      runnerStrength: 0,
      traceSuccessful: true,
      tagsAdded: 1,
    });
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(false);

    state = continueRunThroughMovement(state);
    expect(state.timingPoint).toBe("access.resolve_card");
  });

  it("fails the trace on tie and leaves the Runner untagged", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-tie"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 6;
    state.runner.credits = 4;

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
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_3");

    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStrength: 2,
      runnerStrength: 3,
      traceSuccessful: false,
      tagsAdded: 0,
    });
  });

  it("rejects wrong-side, stale and illegal bid choices", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-illegal"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 5;

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
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpChoiceAction = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_0"],
        },
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_0"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: "wrong_choice",
          selectedOptionIds: ["bid_0"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_99"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
  });

  it("replays Trace bids with deterministic StateHash and no new randomness", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-replay"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;
    const initial = structuredClone(state);
    const randomBefore = state.randomDrawRecords.length;

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
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Fracter",
    );
  });

  it("does not expose V0.97+ mechanics while enabling Trace", () => {
    const state = toRunnerTurn(v096TraceGame("v096-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(CARD_DEFINITIONS_BY_ID.v096_trace_probe_ice?.mechanics).toContain("trace");
    expect(CARD_DEFINITIONS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "multiaccess",
    );
    expect(CARD_DEFINITIONS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "hosting",
    );
    expect(CARD_DEFINITIONS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "virus",
    );
    expect(CARD_DEFINITIONS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "prevention",
    );
  });
});
