import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { getLegalActions } from "../../index";
import { buildRunnerDrawCardActions } from "./runner-draw-actions";

describe("runner draw main actions", () => {
  it("builds the normal Runner draw action without payload", () => {
    const state = createGame({
      seed: "arch-5-runner-draw-normal",
      setupMode: "completed",
    });

    const actions = buildRunnerDrawCardActions(state, {
      drawTaxSourceCount: 0,
      projectedDrawCount: 1,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionId: "runner.draw_card",
      side: "runner",
      type: "draw_card",
      label: "Karte ziehen",
      source: "basic_action",
      timingPoint: state.timingPoint,
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: state.stateVersion,
    });
    expect(actions[0]).not.toHaveProperty("payload");
  });

  it("defers City Surveillance decisions until each card is drawn", () => {
    const state = createGame({
      seed: "arch-5-runner-draw-city-surveillance",
      setupMode: "completed",
    });
    state.runner.credits = 3;

    const actions = buildRunnerDrawCardActions(state, {
      drawTaxSourceCount: 1,
      projectedDrawCount: 2,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionId: "runner.draw_card",
      type: "draw_card",
      label: "Karte ziehen",
      costs: [{ clicks: 1 }],
    });
    expect(actions[0]).not.toHaveProperty("payload");
  });

  it("still offers the draw action when City Surveillance cannot be paid", () => {
    const state = createGame({
      seed: "arch-5-runner-draw-city-surveillance-no-credit",
      setupMode: "completed",
    });
    state.runner.credits = 1;

    const actions = buildRunnerDrawCardActions(state, {
      drawTaxSourceCount: 2,
      projectedDrawCount: 1,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionId: "runner.draw_card",
      label: "Karte ziehen",
      costs: [{ clicks: 1 }],
    });
    expect(actions[0]).not.toHaveProperty("payload");
  });

  it("keeps stack-empty draw eligibility in runnerMainActions", () => {
    const state = createGame({
      seed: "arch-5-runner-draw-empty-stack",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.runner.clicks = 4;
    state.runner.stack = [];

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "draw_card",
      ),
    ).toBe(false);
  });
});
