import { describe, expect, it } from "vitest";

import {
  aiInput,
  legalAction,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { assessTraceBaseLinkChoice } from "./trace-base-link-choice-option";

describe("assessTraceBaseLinkChoice", () => {
  it("binds the exact current trace choice and selects a safe strict net gain", () => {
    const { input, action } = traceBaseLinkFixture();

    expect(assessTraceBaseLinkChoice(input, action)).toEqual({
      selectedOptionId: "trace_base_link_runner_baedekers_1",
      choiceId: "trace_1.base_link.1",
      traceId: "trace_1",
    });
  });

  it("preserves access by passing on an end-run option and fails closed on stale binding", () => {
    const { input, action } = traceBaseLinkFixture({
      safeForAccess: false,
      sideEffect: "ends_run_after_encounter",
    });

    expect(assessTraceBaseLinkChoice(input, action)?.selectedOptionId).toBe(
      "pass",
    );

    action.expiresAtStateVersion = 2;
    expect(assessTraceBaseLinkChoice(input, action)).toBeUndefined();
  });
});

function traceBaseLinkFixture(
  option: {
    safeForAccess: boolean;
    sideEffect?: "ends_run_after_encounter";
  } = { safeForAccess: true },
) {
  const action = legalAction(
    "runner.resolve_choice",
    "runner",
    "resolve_choice",
    "Resolve choice",
    { credits: 0, clicks: 0 },
    { source: "game_rule" },
  );
  const input = aiInput("runner", [action]);
  input.playerView.timingPoint = "run.encounter_ice";
  action.timingPoint = input.playerView.timingPoint;
  action.expiresAtStateVersion = input.playerView.stateVersion;
  action.choiceRequirements = [
    {
      choiceId: "trace_1.base_link.1",
      minSelections: 1,
      maxSelections: 1,
      optionIds: ["pass", "trace_base_link_runner_baedekers_1"],
    },
  ];
  input.playerView.own.rig = [
    visibleCard("runner_baedekers_1", "runner", "hardware", {
      definitionId: "onr_v1_003_baedekers-net-map",
      title: "Baedeker's Net Map",
    }),
  ];
  input.playerView.own.runnerTraceSupportQuote = {
    traceCreditPool: 0,
    traceCreditSources: [],
    baseLinkOptions: [
      { baseLink: 0, activationCost: 0, safeForAccess: true },
      {
        baseLink: 1,
        activationCost: 0,
        safeForAccess: option.safeForAccess,
        sourceDefinitionId: "onr_v1_003_baedekers-net-map",
        sourceTitle: "Baedeker's Net Map",
        ...(option.sideEffect ? { sideEffect: option.sideEffect } : {}),
      },
    ],
    postBidLinkOptions: [],
    traceSuccessCancelOptions: [],
  };
  input.playerView.trace = {
    traceId: "trace_1",
    sourceDefinitionId: "onr_v1_264_rex",
    profile: "modern_open",
    phase: "base_link",
    printedTrace: 3,
    effectiveTraceLimit: 3,
    bidsRevealed: false,
    corpBidCommitted: true,
    runnerBidCommitted: false,
    visibleOpponentBidCapacity: 0,
    corpBid: 0,
    corpStrength: 3,
    runnerLink: 0,
  };
  input.playerView.pendingChoice = {
    choiceId: "trace_1.base_link.1",
    side: "runner",
    source: "trace_base_link:trace_1",
    prompt: "Base-Link-Karte für Trace nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Base-Link-Karte nutzen" },
      {
        id: "trace_base_link_runner_baedekers_1",
        label: "Baedeker's Net Map: Base Link 1",
        publicLabel: "Base Link",
        value: "runner_baedekers_1",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: input.playerView.stateVersion,
    visibility: "public",
  };
  return { input, action };
}
