import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { chooseRandomLegalDecision } from "./random-legal-decision";
import { createSimulationRng } from "./simulation-rng";

describe("chooseRandomLegalDecision", () => {
  it("fails closed instead of returning a non-legal sentinel action", () => {
    expect(() =>
      chooseRandomLegalDecision(input([]), createSimulationRng("empty")),
    ).toThrowError(PlanResolutionFailure);

    try {
      chooseRandomLegalDecision(input([]), createSimulationRng("empty"));
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

  it("rejects a stale Engine offer before consuming simulation RNG", () => {
    const stale = action("stale", "draw_card");
    stale.timingPoint = "corp_action.main";
    const simulationRng = createSimulationRng("stale");
    expect(() =>
      chooseRandomLegalDecision(input([stale]), simulationRng),
    ).toThrow(/stale_or_future_action_reference/);
    expect(simulationRng.counter).toBe(0);
  });

  it.each(["runner", "corp"] as const)(
    "selects legal %s discards without planning memory",
    (side) => {
      const choiceId = "discard";
      const offer = {
        ...action("resolve", "resolve_choice"),
        side,
        source: "game_rule",
        choiceRequirements: [
          {
            choiceId,
            minSelections: 2,
            maxSelections: 2,
            optionIds: ["card1", "card2", "card3", "disabled"],
          },
        ],
      } satisfies LegalAction;
      const scenario = input([offer]);
      scenario.side = side;
      scenario.playerView.activeSide = side;
      scenario.playerView.pendingChoice = {
        choiceId,
        side,
        source: "game_rule",
        prompt: "Discard",
        kind: "select_cards",
        stateVersion: scenario.playerView.stateVersion,
        minSelections: 2,
        maxSelections: 2,
        visibility: "private_to_side",
        options: ["card1", "card2", "card3", "disabled"].map((id) => ({
          id,
          label: id,
          selectable: id !== "disabled",
        })),
      };
      const decision = chooseRandomLegalDecision(
        scenario,
        createSimulationRng("discard"),
      );
      expect(decision.actionId).toBe(offer.actionId);
      expect(decision.selectedChoices?.choiceId).toBe(choiceId);
      const ids = (decision.selectedChoices?.selectedOptionIds ?? []) as string[];
      expect(new Set(ids).size).toBe(2);
      expect(ids).not.toContain("disabled");
    },
  );

  it("selects only from the deterministically ordered LegalAction set", () => {
    const actions = [
      action("z-action", "draw_card"),
      action("a-action", "gain_credit"),
    ];
    const decision = chooseRandomLegalDecision(input(actions), {
      seed: "fixed",
      counter: 0,
      nextInt: () => 0,
    });

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
