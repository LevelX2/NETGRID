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

});
