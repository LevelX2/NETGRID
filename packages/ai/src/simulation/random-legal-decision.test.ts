import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { chooseRandomLegalDecision } from "./random-legal-decision";
import { createSimulationRng } from "./simulation-rng";

describe("chooseRandomLegalDecision", () => {
  it("fails closed instead of returning a non-legal sentinel action", () => {
    expect(() =>
      chooseRandomLegalDecision(input([]), createSimulationRng("empty"), {
        selectedChoicesForDecision: () => undefined,
      }),
    ).toThrowError(PlanResolutionFailure);

    try {
      chooseRandomLegalDecision(input([]), createSimulationRng("empty"), {
        selectedChoicesForDecision: () => undefined,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: "no_current_route_head",
        context: {
          owner: "rules_contract",
          side: "runner",
          stateVersion: 7,
          legalActionTypes: [],
        },
      });
    }
  });

  it("selects only from the deterministically ordered LegalAction set", () => {
    const actions = [
      action("z-action", "draw_card"),
      action("a-action", "gain_credit"),
    ];
    const decision = chooseRandomLegalDecision(
      input(actions),
      {
        seed: "fixed",
        counter: 0,
        nextInt: () => 0,
      },
      { selectedChoicesForDecision: () => undefined },
    );

    expect(decision.actionId).toBe("a-action");
    expect(decision.consideredActionIds).toEqual(["a-action", "z-action"]);
    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "z-action",
      "a-action",
    ]);
  });
});

function input(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 7,
      timingPoint: "runner_action.main",
    },
    legalActions,
  } as unknown as AiDecisionInput;
}

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 7,
  };
}
