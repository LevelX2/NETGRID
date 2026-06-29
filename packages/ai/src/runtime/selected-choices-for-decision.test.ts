import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedChoicesForDecision } from "./selected-choices-for-decision";

describe("selectedChoicesForDecision", () => {
  it("selects enough generic options for mandatory multi-select choices", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 2,
        maxSelections: 2,
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["option_a", "option_b"],
    });
  });

  it("keeps optional generic single-choice fallback behavior", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 0,
        maxSelections: 1,
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["option_a"],
    });
  });

  it("spreads mandatory generic choices across structured option groups", () => {
    const decision = selectedChoicesForDecision(
      inputWithChoice({
        kind: "select_option",
        minSelections: 2,
        maxSelections: 2,
        options: [
          { id: "ice_a_hq", label: "ICE A HQ", value: "ice_a|hq" },
          { id: "ice_a_rd", label: "ICE A R&D", value: "ice_a|rd" },
          { id: "ice_b_hq", label: "ICE B HQ", value: "ice_b|hq" },
          { id: "ice_b_rd", label: "ICE B R&D", value: "ice_b|rd" },
        ],
      }),
      resolveChoiceAction(),
      unusedDependencies(),
    );

    expect(decision).toEqual({
      choiceId: "choice_multi",
      selectedOptionIds: ["ice_a_hq", "ice_b_hq"],
    });
  });
});

function inputWithChoice(choice: {
  kind: "select_option";
  minSelections: number;
  maxSelections: number;
  options?: Array<{ id: string; label: string; value?: string }>;
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      pendingChoice: {
        choiceId: "choice_multi",
        side: "corp",
        source: "card_implementation.agenda_purge_install_targets:test",
        prompt: "Choose targets",
        kind: choice.kind,
        options: choice.options ?? [
          { id: "option_a", label: "A" },
          { id: "option_b", label: "B" },
          { id: "option_c", label: "C" },
        ],
        minSelections: choice.minSelections,
        maxSelections: choice.maxSelections,
        stateVersion: 7,
        visibility: "hidden_info_barrier",
      },
    },
  } as unknown as AiDecisionInput;
}

function resolveChoiceAction(): LegalAction {
  return {
    actionId: "corp.resolve_choice",
    side: "corp",
    type: "resolve_choice",
    label: "Resolve choice",
    costs: [],
  } as unknown as LegalAction;
}

function unusedDependencies(): Parameters<
  typeof selectedChoicesForDecision
>[2] {
  return {
    evaluateCorpOpeningHand: () => ({ decision: "keep" }),
    evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
    discardKeepScore: () => ({ total: 0 }),
    selectedRunnerProgramInstallTrashOptionIds: () => [],
    selectedRunnerForcedProgramTrashOptionIds: () => [],
    extractAiFeatures: () => ({}) as never,
    rolesForCardId: () => [],
  };
}
