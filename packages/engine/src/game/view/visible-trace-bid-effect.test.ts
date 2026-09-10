import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { getPlayerView } from "../../index";
import { visibleTraceBidEffect } from "./visible-trace-bid-effect";

describe("public fixed automatic trace effect", () => {
  it("projects only a visible fixed effect and keeps variable amounts uncertified", () => {
    const state = createGame({
      seed: "fixed-trace-view",
      setupMode: "completed",
    });
    state.trace = {
      traceId: "fixed-trace",
      sourceCardInstanceId: state.corp.identity,
      sourceDefinitionId: "onr_v1_284_chance-observation",
      traceRulesProfile: "modern_open",
      traceLimit: 5,
      status: "corp_bid",
      successEffect: { type: "add_tag", amount: 1 },
    };
    const id = "visible-automatic-trace";
    state.runner.rig.resources.push(id);
    state.cardInstances[id] = {
      instanceId: id,
      definitionId: "onr_classic_044_crash-space",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const before = structuredClone(state);
    for (const side of ["runner", "corp"] as const) {
      expect(getPlayerView(state, side).trace?.bidEffect).toBe(
        "automatic_success_fixed_effect",
      );
    }
    expect(state).toEqual(before);
    state.trace.successEffect = {
      type: "add_tags_by_trace_margin_over_runner_link",
    };
    expect(visibleTraceBidEffect(state)).toBeUndefined();
    state.trace.successEffect = { type: "none" };
    expect(visibleTraceBidEffect(state)).toBeUndefined();
    state.trace.successEffect = { type: "add_tag", amount: 1 };
    state.cardInstances[id]!.faceup = false;
    expect(visibleTraceBidEffect(state)).toBeUndefined();
    state.cardInstances[id]!.definitionId = "onr_classic_050_sandbox-dig";
    expect(visibleTraceBidEffect(state)).toBeUndefined();
    state.cardInstances[id]!.faceup = true;
    expect(visibleTraceBidEffect(state)).toBeUndefined();
    delete state.trace;
    expect(visibleTraceBidEffect(state)).toBeUndefined();
  });
});
