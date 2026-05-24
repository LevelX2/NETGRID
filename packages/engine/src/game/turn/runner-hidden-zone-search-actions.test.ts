import type { CardDefinition, CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildRunnerStackSearchProgramToGripAction } from "./runner-hidden-zone-search-actions";

function state(): GameState {
  return {
    timingPoint: "runner.action",
    stateVersion: 12,
  } as unknown as GameState;
}

function definition(title: string): CardDefinition {
  return {
    id: title.toLowerCase().replaceAll(" ", "_"),
    title,
    type: "resource",
  } as CardDefinition;
}

describe("runner hidden-zone search legal actions", () => {
  it("builds the same stack-search action id and payload contract", () => {
    const cardId = "runner_resource_1" as CardInstanceId;
    const action = buildRunnerStackSearchProgramToGripAction(state(), {
      cardId,
      definition: definition("The Short Circuit"),
      mode: "stack_program",
      creditCost: 1,
    });

    expect(action.actionId).toBe(
      "runner.gain_credit.runner_resource_1.runner_resource_1.search_stack_program_to_grip",
    );
    expect(action.label).toBe(
      "The Short Circuit: Stack nach Programm durchsuchen",
    );
    expect(action.costs).toEqual([{ clicks: 1, credits: 1 }]);
    expect(action.payload).toMatchObject({
      cardId,
      v1911HiddenZoneAbility: "search_stack_program_to_grip",
    });
  });

  it("keeps Aujourd'Oui top-five action payload stable", () => {
    const cardId = "aujourd_oui_1" as CardInstanceId;
    const action = buildRunnerStackSearchProgramToGripAction(state(), {
      cardId,
      definition: definition("Aujourd'Oui"),
      mode: "top5_programs",
      creditCost: 0,
    });

    expect(action.label).toBe("Aujourd'Oui: Top 5 nach Programmen prüfen");
    expect(action.costs).toEqual([{ clicks: 1 }]);
    expect(action.payload).toMatchObject({
      cardId,
      v1911HiddenZoneAbility: "search_stack_program_to_grip",
    });
  });
});
