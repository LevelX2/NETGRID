import type { ChoiceRequest, LegalAction, PlayerAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { validateChoiceAction } from "./choice-validation";

describe("choice validation", () => {
  it("accepts valid selectedChoices without mutating the choice", () => {
    const choice = testChoice();
    const before = JSON.stringify(choice);

    expect(
      validateChoiceAction(choice, resolveChoiceAction(), playerChoiceAction()),
    ).toBeUndefined();
    expect(JSON.stringify(choice)).toBe(before);
  });

  it("rejects missing, wrong-side and stale choices with existing messages", () => {
    expect(
      validateChoiceAction(undefined, resolveChoiceAction(), playerChoiceAction()),
    ).toBe("Es ist keine Choice offen.");
    expect(
      validateChoiceAction(
        testChoice({ side: "corp" }),
        resolveChoiceAction(),
        playerChoiceAction(),
      ),
    ).toBe("Diese Choice gehoert der anderen Seite.");
    expect(
      validateChoiceAction(
        testChoice({ stateVersion: 2 }),
        resolveChoiceAction(),
        playerChoiceAction(),
      ),
    ).toBe("Diese Choice gehoert zu einem anderen Spielzustand.");
  });

  it("rejects non-choice actions while a choice is open", () => {
    expect(
      validateChoiceAction(
        testChoice(),
        { ...resolveChoiceAction(), type: "gain_credit" },
        playerChoiceAction(),
      ),
    ).toBe("Solange eine Choice offen ist, sind keine anderen Aktionen legal.");
  });

  it("rejects wrong choiceId, invalid option, unselectable option and duplicates", () => {
    expect(
      validateChoiceAction(
        testChoice(),
        resolveChoiceAction(),
        playerChoiceAction({ choiceId: "other", selectedOptionIds: ["ok"] }),
      ),
    ).toBe("Die ChoiceId ist ungueltig.");
    expect(
      validateChoiceAction(
        testChoice(),
        resolveChoiceAction(),
        playerChoiceAction({ choiceId: "choice_1", selectedOptionIds: ["bad"] }),
      ),
    ).toBe("Eine gewaehlte Option ist nicht legal.");
    expect(
      validateChoiceAction(
        testChoice(),
        resolveChoiceAction(),
        playerChoiceAction({
          choiceId: "choice_1",
          selectedOptionIds: ["blocked"],
        }),
      ),
    ).toBe("Eine gewaehlte Option ist fuer diesen Effekt nicht auswaehlbar.");
    expect(
      validateChoiceAction(
        testChoice({ maxSelections: 2 }),
        resolveChoiceAction(),
        playerChoiceAction({ choiceId: "choice_1", selectedOptionIds: ["ok", "ok"] }),
      ),
    ).toBe("Eine Option wurde doppelt gewaehlt.");
  });

  it("preserves legacy selectedChoices array aliases", () => {
    for (const key of [
      "selectedOptionIds",
      "optionIds",
      "options",
      "selectedOptions",
    ] as const) {
      expect(
        validateChoiceAction(
          testChoice(),
          resolveChoiceAction(),
          playerChoiceAction({ choiceId: "choice_1", [key]: ["ok"] }),
        ),
      ).toBeUndefined();
    }
  });
});

function testChoice(overrides: Partial<ChoiceRequest> = {}): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source: "test.choice",
    kind: "select_option",
    prompt: "Test Choice",
    options: [
      { id: "ok", label: "OK" },
      { id: "blocked", label: "Blocked", selectable: false },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "public",
    ...overrides,
  };
}

function resolveChoiceAction(): LegalAction {
  return {
    actionId: "resolve_choice_choice_1",
    side: "runner",
    type: "resolve_choice",
    label: "Choice beantworten",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function playerChoiceAction(
  selectedChoices: Record<string, unknown> = {
    choiceId: "choice_1",
    selectedOptionIds: ["ok"],
  },
): PlayerAction {
  return {
    matchId: "match",
    side: "runner",
    actionId: "resolve_choice_choice_1",
    clientKnownStateVersion: 1,
    selectedChoices,
  };
}
