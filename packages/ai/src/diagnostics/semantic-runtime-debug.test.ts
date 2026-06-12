import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import {
  buildSemanticRuntimeDebugPlanContext,
  semanticRuntimeDebugActionDisplayScore,
  semanticRuntimeDebugActionWhyChosen,
  semanticRuntimeDebugActionWhyNot,
  semanticRuntimeDebugCoverageScoreBreakdown,
  semanticRuntimeDebugPlanSelectionScoreBreakdown,
  semanticRuntimeDebugRankedAlternatives,
} from "./semantic-runtime-debug";

describe("SemanticRuntimeDebug", () => {
  it("projects plan-mapped display scores and why-chosen diagnostics", () => {
    const selected = choice(action("draw", "draw_card"), 80);
    const lowerPlanFit = choice(action("gain", "gain_credit"), 120);
    const context = buildSemanticRuntimeDebugPlanContext({
      selectedActionId: "draw",
      selectedChoice: selected,
      mappedActionIds: ["draw", "gain"],
      selectedPlanType: "runner.obtain_breaker_coverage",
    });

    expect(context.selectedByPlanMapping).toBe(true);
    expect(semanticRuntimeDebugActionDisplayScore(selected, true, context)).toBe(
      330,
    );
    expect(
      semanticRuntimeDebugActionDisplayScore(lowerPlanFit, false, context),
    ).toBe(120);
    expect(semanticRuntimeDebugActionWhyChosen(selected, context)).toEqual([
      "selected_by_plan_mapping",
      "rawSemanticScore:80",
      "finalSelectionScore:330",
      "selectedPlan:runner.obtain_breaker_coverage",
    ]);
    expect(
      semanticRuntimeDebugActionWhyNot(lowerPlanFit, 120, context),
    ).toEqual([
      "lower_plan_fit",
      "selected_by_plan_mapping",
      "rawSemanticScore:120",
      "finalSelectionScore:120",
    ]);
    expect(
      semanticRuntimeDebugPlanSelectionScoreBreakdown(selected, true, 330, context),
    ).toEqual([
      expect.objectContaining({
        key: "selected_by_plan_mapping",
        label: "Plan-Auswahl",
        value: 250,
      }),
    ]);
  });

  it("adds coverage-only score rows without choosing actions", () => {
    const selected = choice(action("install", "install_card"), 50);
    const context = buildSemanticRuntimeDebugPlanContext({
      selectedActionId: "install",
      selectedChoice: selected,
      mappedActionIds: ["install"],
      coverageSelection: {
        capabilityKind: "killer",
        capabilityLabel: "Killer",
        answerFit: "covers_gap",
        sourceTitle: "Program",
        evidence: ["coverage_selection:matched"],
      },
    });

    expect(
      semanticRuntimeDebugCoverageScoreBreakdown(selected, true, context),
    ).toEqual([
      {
        key: "runner_coverage_answer_fit",
        label: "Coverage-Suchtreffer: Killer",
        value: 0,
        reason: "coverage_selection:matched",
      },
    ]);
  });

  it("formats ranked alternatives through caller-provided score rows", () => {
    const selected = choice(action("run-hq", "start_run"), 90);
    const blocked = choice(action("gain", "gain_credit"), 40, {
      exclusion: {
        key: "blocked",
        label: "Blocked",
        reason: "blocked_reason",
      },
    });

    const ranked = semanticRuntimeDebugRankedAlternatives({
      rankedChoices: [selected, blocked],
      selectedActionId: "run-hq",
      scoreBreakdownForChoice: () => [
        {
          key: "semantic_type_priority",
          label: "Action-Typ-Priorität",
          value: 100,
        },
      ],
      scrubEvidence: (evidence) => evidence.filter((entry) => entry !== "bad"),
    });

    expect(ranked).toEqual([
      expect.objectContaining({
        rank: 1,
        planId: "semantic_runtime:runner_safe_access:start_run",
        selectedActionType: "start_run",
        visibleReasons: ["safe"],
        whyNot: ["selected_action"],
      }),
    ]);
  });
});

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
