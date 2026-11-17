import type {
  EventModificationCandidate,
  EventModificationWindow,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  configureDamageCoreHost,
  resetDamageCoreHostForTests,
  type DamageCoreHost,
} from "./damage-runtime-context";
import {
  eventModificationChoice,
  resolveEventModificationChoice,
} from "./prevention-window";

function tagCandidate(
  candidateId: string,
  priority: number,
): EventModificationCandidate {
  return {
    candidateId,
    eventId: "tag_event",
    kind: "avoid",
    controller: "runner",
    sourceRef: {
      kind: "test_harness",
      label: candidateId,
    },
    priority,
    visibility: "public",
    optional: true,
    preventedTags: 1,
  };
}

function setupWindow(candidates: EventModificationCandidate[]) {
  const state = createGame({
    seed: "tag-prevention-pass-priorities",
    setupMode: "completed",
  });
  const windowId = ++state.stateVersion;
  const event: ImminentEvent = {
    eventId: "tag_event",
    eventType: "add_tag",
    source: { kind: "test_harness" },
    controller: "corp",
    affectedSide: "runner",
    payload: { amount: 1 },
    visibility: "public",
    createdAtStateVersion: windowId,
    modificationWindowId: windowId,
  };
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: "add_tag",
    kind: "avoid",
    side: "runner",
    candidates,
    createdAtStateVersion: windowId,
    optional: true,
  };
  state.imminentEvent = event;
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(
    state,
    window,
    event,
    windowId,
  );
  return state;
}

function passAction(): PlayerAction {
  return {
    side: "runner",
    selectedChoices: { selectedOptionIds: ["pass"] },
  } as unknown as PlayerAction;
}

describe("event modification tag-prevention pass", () => {
  beforeEach(() => {
    configureDamageCoreHost({
      runner: {
        ensureRunnerTurnFlags: (state: GameState) => {
          state.runnerTurnFlags ??= {
            stoleAgendaThisTurn: false,
            stoleAgendaLastTurn: false,
          } as NonNullable<typeof state.runnerTurnFlags>;
          return state.runnerTurnFlags;
        },
      },
    } as unknown as DamageCoreHost);
  });

  afterEach(() => {
    resetDamageCoreHostForTests();
  });

  it("opens the next lower-priority tag-prevention stage", () => {
    const state = setupWindow([
      tagCandidate("first", 10),
      tagCandidate("second", 20),
    ]);
    const firstAction = { payload: {} } as LegalAction;
    const openingVersion = state.stateVersion;

    resolveEventModificationChoice(state, firstAction, passAction());

    expect(state.runner.tags).toBe(0);
    expect(state.eventModificationWindow).toMatchObject({
      windowId: openingVersion + 1,
      createdAtStateVersion: openingVersion + 1,
      candidates: [expect.objectContaining({ candidateId: "second" })],
    });
    expect(state.imminentEvent?.modificationWindowId).toBe(openingVersion + 1);
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pass",
      "second",
    ]);
    expect(firstAction.payload).toMatchObject({
      eventModificationDecision: "pass",
      eventModificationOutcome: "next_window_opened",
    });

    const secondAction = { payload: {} } as LegalAction;
    resolveEventModificationChoice(state, secondAction, passAction());
    expect(state.runner.tags).toBe(1);
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
  });

  it("treats same-priority sources as one stage when passing", () => {
    const state = setupWindow([
      tagCandidate("first", 10),
      tagCandidate("second", 10),
    ]);
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pass",
      "first",
      "second",
    ]);

    const action = { payload: {} } as LegalAction;
    resolveEventModificationChoice(state, action, passAction());

    expect(state.runner.tags).toBe(1);
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
  });
});
