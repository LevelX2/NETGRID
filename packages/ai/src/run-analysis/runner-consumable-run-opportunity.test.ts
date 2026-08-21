import { describe, expect, it } from "vitest";

import {
  aiInput,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { RunActionProjection } from "./runner-run-target-types";
import { quoteRunnerConsumableRunOpportunity } from "./runner-consumable-run-opportunity";

const SOURCE_DEFINITION_ID = "test-consumable-bypass-route";

describe("quoteRunnerConsumableRunOpportunity", () => {
  it("moderately preserves a lone bypass card on a blind single-access run", () => {
    const input = inputWithGripCopies(1);

    expect(
      quoteRunnerConsumableRunOpportunity({
        input,
        projection: bypassProjection(),
        bypassedFirstIce: true,
        accessPayoff: "unknown",
        scoreThreat: false,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: 200,
      }),
    ).toMatchObject({
      kind: "bypass_first_ice",
      gripCopyCount: 1,
      handAtCapacity: false,
      baseOpportunityCost: 45,
      opportunityCost: 45,
      rawRouteScore: 200,
      effectiveRouteScore: 155,
    });
  });

  it("reduces rather than removes the cost for a second copy or hand pressure", () => {
    const duplicate = quote(inputWithGripCopies(2));
    const fullHandInput = inputWithGripCopies(1);
    fullHandInput.playerView.own.maxHandSize = 1;
    const fullHand = quote(fullHandInput);

    expect(duplicate).toMatchObject({
      duplicateRelief: 15,
      opportunityCost: 30,
    });
    expect(fullHand).toMatchObject({
      handCapacityRelief: 15,
      opportunityCost: 30,
    });
  });

  it("does not conserve the card against an exact scoring emergency", () => {
    const input = inputWithGripCopies(1);

    expect(
      quoteRunnerConsumableRunOpportunity({
        input,
        projection: bypassProjection(),
        bypassedFirstIce: true,
        accessPayoff: "score_threat",
        scoreThreat: true,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: 200,
      }),
    ).toMatchObject({
      immediatePayoffRelief: 45,
      opportunityCost: 0,
      effectiveRouteScore: 200,
    });
  });

  it("applies a smaller preservation value to other card-backed event runs", () => {
    const input = inputWithGripCopies(1);

    expect(
      quoteRunnerConsumableRunOpportunity({
        input,
        projection: { ...bypassProjection(), sourceKind: "basic_action" },
        bypassedFirstIce: true,
        accessPayoff: "unknown",
        scoreThreat: false,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: 200,
      }),
    ).toBeUndefined();
    expect(
      quoteRunnerConsumableRunOpportunity({
        input,
        projection: { ...bypassProjection(), bypassFirstIce: false },
        bypassedFirstIce: false,
        accessPayoff: "unknown",
        scoreThreat: false,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: 200,
      }),
    ).toMatchObject({
      kind: "card_backed_run",
      baseOpportunityCost: 20,
      opportunityCost: 20,
      effectiveRouteScore: 180,
    });
  });

  it("rejects foreign-side and non-finite route inputs", () => {
    const corpInput = aiInput("corp", []);
    expect(
      quoteRunnerConsumableRunOpportunity({
        input: corpInput,
        projection: bypassProjection(),
        bypassedFirstIce: true,
        accessPayoff: "unknown",
        scoreThreat: false,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: 200,
      }),
    ).toBeUndefined();
    expect(() =>
      quoteRunnerConsumableRunOpportunity({
        input: inputWithGripCopies(1),
        projection: bypassProjection(),
        bypassedFirstIce: true,
        accessPayoff: "unknown",
        scoreThreat: false,
        multiaccessAvailable: false,
        runnerMatchpointCentralAccess: false,
        rawRouteScore: Number.NaN,
      }),
    ).toThrow(RangeError);
  });
});

function quote(input: ReturnType<typeof inputWithGripCopies>) {
  return quoteRunnerConsumableRunOpportunity({
    input,
    projection: bypassProjection(),
    bypassedFirstIce: true,
    accessPayoff: "unknown",
    scoreThreat: false,
    multiaccessAvailable: false,
    runnerMatchpointCentralAccess: false,
    rawRouteScore: 200,
  });
}

function inputWithGripCopies(count: number) {
  const input = aiInput("runner", []);
  input.playerView.own.maxHandSize = 5;
  input.playerView.own.gripOrHq = Array.from({ length: count }, (_, index) =>
    visibleCard(`bypass-${index + 1}`, "runner", "event", {
      definitionId: SOURCE_DEFINITION_ID,
      title: `Bypass route ${index + 1}`,
    }),
  );
  return input;
}

function bypassProjection(): RunActionProjection {
  return {
    actionId: "play-bypass-route",
    actionType: "play_event",
    sourceKind: "event",
    sourceCardId: SOURCE_DEFINITION_ID,
    targetServerId: "rd",
    targetKind: "rd",
    accessServerId: "rd",
    structure: "event_run",
    accessPayoffSignals: [],
    constraintSignals: ["bypass_first_ice"],
    riskSignals: [],
    noNoisyBreakers: false,
    bypassFirstIce: true,
    projectionStatus: "concrete_target",
    evidence: [],
  };
}
