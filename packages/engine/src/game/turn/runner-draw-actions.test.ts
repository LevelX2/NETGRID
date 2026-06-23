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

  it("builds City Surveillance pay and tag draw actions with stable payloads", () => {
    const state = createGame({
      seed: "arch-5-runner-draw-city-surveillance",
      setupMode: "completed",
    });
    state.runner.credits = 3;

    const actions = buildRunnerDrawCardActions(state, {
      drawTaxSourceCount: 1,
      projectedDrawCount: 2,
    });

    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({
      actionId: "runner.draw_card.pay",
      type: "draw_card",
      label: "Karte ziehen (City Surveillance: 2 Credits zahlen)",
      costs: [{ clicks: 1, credits: 2 }],
      payload: {
        citySurveillanceSourceCount: 1,
        citySurveillanceProjectedDrawCount: 2,
        citySurveillanceDrawDecision: "pay",
        citySurveillanceProjectedCreditsPaid: 2,
        citySurveillanceProjectedTagsAdded: 0,
      },
    });
    expect(actions[1]).toMatchObject({
      actionId: "runner.draw_card.tag",
      type: "draw_card",
      label: "Karte ziehen (City Surveillance: 1 Tag nehmen)",
      costs: [{ clicks: 1 }],
      payload: {
        citySurveillanceSourceCount: 1,
        citySurveillanceProjectedDrawCount: 2,
        citySurveillanceDrawDecision: "tag",
        citySurveillanceProjectedCreditsPaid: 0,
        citySurveillanceProjectedTagsAdded: 2,
      },
    });
  });

  it("omits the City Surveillance pay action when credits are insufficient", () => {
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
      actionId: "runner.draw_card.tag",
      label: "Karte ziehen (City Surveillance: 2 Tags nehmen)",
      costs: [{ clicks: 1 }],
      payload: {
        citySurveillanceSourceCount: 2,
        citySurveillanceProjectedDrawCount: 1,
        citySurveillanceDrawDecision: "tag",
        citySurveillanceProjectedCreditsPaid: 0,
        citySurveillanceProjectedTagsAdded: 2,
      },
    });
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
