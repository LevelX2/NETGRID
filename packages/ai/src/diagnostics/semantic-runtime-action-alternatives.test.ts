import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import { buildSemanticRuntimeActionAlternatives } from "./semantic-runtime-action-alternatives";

describe("SemanticRuntimeActionAlternatives", () => {
  it("keeps selected, lower and excluded alternatives machine-readable", () => {
    const selected = choice(action("gain", "gain_credit"), 90, {
      reasonCode: "runner.semantic.economy",
      scopeId: "basic_economy_draw",
    });
    const lower = choice(action("draw", "draw_card"), 45, {
      reasonCode: "runner.semantic.hand_development",
      scopeId: "basic_economy_draw",
    });
    const excluded = choice(action("run-hq", "start_run"), 50, {
      reasonCode: "runner.semantic.central_pressure",
      scopeId: "central_run",
      exclusion: {
        key: "known_central_no_current_payoff",
        label: "Known central no current payoff",
        reason: "hq_payoff_low",
      },
    });

    const alternatives = buildSemanticRuntimeActionAlternatives({
      rankedChoices: [lower, excluded, selected],
      selectedActionId: "gain",
      planRuntime: emptyPlanRuntime(),
      sourceTitleForChoice: () => undefined,
      scoreBreakdownForChoice: () => [],
    });

    expect(alternatives).toEqual([
      expect.objectContaining({
        actionId: "gain",
        selected: true,
        whyChosen: expect.arrayContaining([
          "semantic_runtime_actual",
          "rawSemanticScore:90",
          "finalSelectionScore:90",
          "selected_by_plan_mapping:false",
          "scope:basic_economy_draw",
          "reasonCode:runner.semantic.economy",
        ]),
      }),
      expect.objectContaining({
        actionId: "draw",
        selected: false,
        whyNot: expect.arrayContaining([
          "semantic_score_below_selected",
          "rawSemanticScore:45",
          "finalSelectionScore:45",
          "scope:basic_economy_draw",
          "reasonCode:runner.semantic.hand_development",
        ]),
      }),
      expect.objectContaining({
        actionId: "run-hq",
        selected: false,
        excluded: true,
        whyNot: expect.arrayContaining([
          "semantic_excluded:known_central_no_current_payoff",
          "hq_payoff_low",
          "semantic_exclusion_reason:hq_payoff_low",
          "rawSemanticScore:50",
          "finalSelectionScore:50",
          "excluded:true",
          "scope:central_run",
          "reasonCode:runner.semantic.central_pressure",
        ]),
      }),
    ]);
  });
});

function emptyPlanRuntime(): TacticalPlanRuntimeResult {
  return {
    planAlternatives: [],
    blockedPlans: [],
  };
}

function choice(
  actionValue: LegalAction,
  score: number,
  overrides: Partial<SemanticRuntimeChoice> = {},
): SemanticRuntimeChoice {
  return {
    action: actionValue,
    scopeId: "runner_safe_access",
    score,
    reasonCode: "semantic.runtime",
    explanation: "Synthetic semantic runtime choice.",
    evidence: ["safe"],
    ...overrides,
  };
}

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}
