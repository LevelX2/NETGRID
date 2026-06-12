import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../../index";
import {
  apply,
  mustAction,
  putCorpCardOnTopOfRd,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { toPublicEvent } from "./public-event-view";

describe("PublicEvent projection", () => {
  it("classifies access as a hidden-info barrier event", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v093-event-classification",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    putCorpCardOnTopOfRd(state, "v08_project_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const access = mustAction(
      state,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(eventVisibilityForAction(access)).toBe("hidden_info_barrier");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === access.actionId,
    );
    const event = state.eventLog.at(-1);
    expect(event).toBeDefined();
    if (!event) throw new Error("Missing access event");
    expect(event.visibilityClass).toBe("hidden_info_barrier");
    expect(isHiddenInfoBarrierEvent(event)).toBe(true);
  });

  it("rejects hidden card lists at the public event projection boundary", () => {
    expect(() =>
      toPublicEvent({
        eventId: "event_1",
        type: "test",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "hash" as never,
        publicPayload: {
          actor: "corp",
          actionType: "test",
          hqCardIds: ["secret_card"],
        },
      }),
    ).toThrow(/hidden card data/i);
  });
});
