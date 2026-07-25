import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  applyRunnerHazardCounterSemantics,
  removesPersistentRunnerHazardCounter,
} from "./runner-hazard-counter-semantics";

describe("Runner hazard counter semantics", () => {
  it.each([
    ["baskerville", "counter.remove_runner_hazard"],
    ["cerberus", "counter.remove_runner_hazard"],
    ["mastiff", "counter.remove_runner_hazard"],
    ["link_reduction_counter", "counter.remove_runner_hazard"],
    ["trace_tag_counter", "counter.remove_trace_tag"],
  ] as const)(
    "projects %s through the shared Runner-defense counter family",
    (counterType, semanticActionType) => {
      const candidate = applyRunnerHazardCounterSemantics(
        semanticCandidate(),
        removalAction(counterType),
      );

      expect(candidate.semanticActionType).toBe(semanticActionType);
      expect(candidate.actionTacticSignals).toContain(
        "counter.remove_runner_hazard",
      );
      expect(removesPersistentRunnerHazardCounter(
        removalAction(counterType),
      )).toBe(true);
    },
  );

  it("does not classify an undefined future counter family implicitly", () => {
    const action = removalAction("future_counter");

    expect(
      applyRunnerHazardCounterSemantics(semanticCandidate(), action),
    ).toEqual(semanticCandidate());
    expect(removesPersistentRunnerHazardCounter(action)).toBe(false);
  });
});

function semanticCandidate(): ActionSemanticCandidate {
  return {
    semanticActionType: "card_ability.trigger",
    confidence: "low",
    primaryProjectionStatus: "partial_projected",
    actionTacticSignals: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}

function removalAction(counterType: string): LegalAction {
  return {
    actionId: `remove.${counterType}`,
    side: "runner",
    type: "trigger_ability",
    label: `Remove ${counterType}`,
    source: "runner-identity",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: {
      runnerAbility: "remove_runner_trace_counter",
      counterType,
      removeCounterAmount: 1,
    },
  };
}
