import type {
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { applyAction, getLegalActions } from "../../index";
import type { PublicContextForActionDependencies } from "../../public-context";
import { createGame } from "../create-game";
import { hashState } from "../hash";
import { replayGameEvents } from "../replay";
import { toPublicEvent } from "../view/public-event-view";
import {
  buildEvent,
  buildEventWithHost,
  configureBuildEventHost,
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
  type BuildEventHost,
} from "./build-event";

describe("game event builder", () => {
  it("builds the same basic event shape without exposing private payloads", () => {
    const state = createGame({
      seed: "arch-60-basic-event",
      setupMode: "completed",
    });
    const legalAction = mandatoryDrawLegalAction(state);
    const playerAction = playerActionFor(state, legalAction);
    const next = nextState(state);
    const stateHash = hashState(next);
    const before = JSON.stringify(state);

    const event = buildEventWithHost(
      testBuildEventHost({ testContext: "kept" }),
      state.stateVersion,
      next.stateVersion,
      stateHash,
      state,
      next,
      legalAction,
      playerAction,
    );

    expect(JSON.stringify(state)).toBe(before);
    expect(event).toMatchObject({
      eventId: `evt_${next.stateVersion}`,
      type: legalAction.type,
      stateVersionBefore: state.stateVersion,
      stateVersionAfter: next.stateVersion,
      stateHashAfter: stateHash,
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: legalAction.label,
        testContext: "kept",
      },
    });
    expect(event.privatePayload?.corp).toEqual({
      action: playerAction,
      legalAction,
    });
    expect(toPublicEvent(event)).not.toHaveProperty("privatePayload");
  });

  it("preserves bad-publicity compatibility fields and redacted source cleanup", () => {
    const previous = createGame({
      seed: "arch-60-bad-publicity-event",
      setupMode: "completed",
    });
    previous.corp.badPublicity = 6;
    const next = nextState(previous);
    next.gameEndReason = "bad_publicity_7";
    next.winner = "runner";
    next.corp.badPublicity = 7;
    const legalAction = {
      ...mandatoryDrawLegalAction(previous),
      type: "activated_card_ability",
      payload: {
        sourceVisibility: "redacted",
      },
    } satisfies LegalAction;

    const event = buildEventWithHost(
      testBuildEventHost({
        sourceVisibility: "redacted",
        sourceCardDefinitionId: "hidden_source",
        sourceDefinitionId: "hidden_source",
        sourceTitle: "Hidden Source",
      }),
      previous.stateVersion,
      next.stateVersion,
      hashState(next),
      previous,
      next,
      legalAction,
      playerActionFor(previous, legalAction),
    );

    expect(event.publicPayload.badPublicityThreshold).toBe(7);
    expect(event.publicPayload.corpBadPublicityBefore).toBe(6);
    expect(event.publicPayload.corpBadPublicityAfter).toBe(7);
    expect(event.publicPayload.sourceVisibility).toBe("redacted");
    expect(event.publicPayload.redactedKind).toBe("hidden_resource_source");
    expect(event.publicPayload).not.toHaveProperty("sourceCardDefinitionId");
    expect(event.publicPayload).not.toHaveProperty("sourceDefinitionId");
    expect(event.publicPayload).not.toHaveProperty("sourceTitle");
  });

  it("keeps hidden-info visibility classification with PublicEvent projection", () => {
    const state = createGame({
      seed: "arch-60-hidden-info-event",
      setupMode: "completed",
    });
    const legalAction = {
      ...mandatoryDrawLegalAction(state),
      type: "play_operation",
      label: "Operation spielen",
    } satisfies LegalAction;
    const next = nextState(state);

    const event = buildEventWithHost(
      testBuildEventHost(),
      state.stateVersion,
      next.stateVersion,
      hashState(next),
      state,
      next,
      legalAction,
      playerActionFor(state, legalAction),
    );

    expect(eventVisibilityForAction(legalAction)).toBe("hidden_info_barrier");
    expect(isHiddenInfoBarrierEvent(event)).toBe(true);
    expect(toPublicEvent(event).publicPayload).not.toHaveProperty(
      "privatePayload",
    );
  });

  it("builds replayable events with stable StateHash through the public apply path", () => {
    const state = createGame({
      seed: "arch-60-replay-event",
      setupMode: "completed",
    });
    const legalAction = mandatoryDrawLegalAction(state);
    const result = applyAction(state, playerActionFor(state, legalAction));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const replay = replayGameEvents(state, [result.event]);

    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(result.stateHash);
    expect(hashState(replay.state)).toBe(result.stateHash);
  });

  it("uses a configured EventHost and can restore the previous test host", () => {
    const state = createGame({
      seed: "arch-63-configured-event-host",
      setupMode: "completed",
    });
    const legalAction = mandatoryDrawLegalAction(state);
    const next = nextState(state);
    const host = testBuildEventHost({ configuredContext: true });
    const previousHost = configureBuildEventHost(host);
    try {
      const event = buildEvent(
        state.stateVersion,
        next.stateVersion,
        hashState(next),
        state,
        next,
        legalAction,
        playerActionFor(state, legalAction),
      );

      expect(event.publicPayload.configuredContext).toBe(true);
    } finally {
      configureBuildEventHost(previousHost);
    }
  });

  it("throws clearly without a configured EventHost", () => {
    const state = createGame({
      seed: "arch-63-unconfigured-event-host",
      setupMode: "completed",
    });
    const legalAction = mandatoryDrawLegalAction(state);
    const next = nextState(state);
    const previousHost = configureBuildEventHost(undefined);
    try {
      expect(() =>
        buildEvent(
          state.stateVersion,
          next.stateVersion,
          hashState(next),
          state,
          next,
          legalAction,
          playerActionFor(state, legalAction),
        ),
      ).toThrow("BuildEvent-Host ist nicht initialisiert.");
    } finally {
      configureBuildEventHost(previousHost);
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

function nextState(state: GameState): GameState {
  return {
    ...structuredClone(state),
    stateVersion: state.stateVersion + 1,
  };
}

function testBuildEventHost(
  context: Record<string, unknown> = {},
): BuildEventHost {
  return {
    publicContext: {
      publicContextForAction: () => context,
      deps: {} as PublicContextForActionDependencies,
    },
    constants: {
      badPublicityLossThreshold: 7,
    },
  };
}
