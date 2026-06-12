import { describe, expect, it } from "vitest";
import {
  buildSemanticDecisionDebugDiagnostics,
  buildSemanticDecisionDebugScoreComponent,
} from "./decision-debug";

describe("DecisionDebug diagnostics", () => {
  it("builds semantic runtime detail sections and long-term plan references", () => {
    const diagnostics = buildSemanticDecisionDebugDiagnostics({
      scopeId: "setup",
      selectedActionType: "gain_credit",
      coverageEvidence: ["coverage_selection:matched"],
      legacyActionType: "start_run",
      legacyPlanKind: "legacy_probe",
      legacyDebugSelectedActionType: "draw_card",
      selectedEvidence: [
        "irrelevant:evidence",
        "run_only_action_adjusted:true",
        "run_action_spending_cap_blocked:false",
      ],
      selectedPlan: { planId: "runner-plan-1", type: "runner.build_credit_bank" },
      selectedStepKind: "gain_credits",
      tacticalPlanItems: ["selected_step_kind:gain_credits"],
      memoryItems: ["memory_fact:visible"],
      memorySectionTitle: "Memory",
    });

    expect(diagnostics.warnings).toEqual([
      "semantic_runtime_actual_differs_from_legacy_debug",
    ]);
    expect(diagnostics.detailItems).toEqual(
      expect.arrayContaining([
        "semantic_runtime_scope:setup",
        "semantic_actual_action_type:gain_credit",
        "coverage_selection:matched",
        "legacy_reference_action_type:start_run",
        "legacy_reference_plan:legacy_probe",
        "legacy_debug_selected_action_type:draw_card",
        "run_only_action_adjusted:true",
        "run_action_spending_cap_blocked:false",
      ]),
    );
    expect(diagnostics.detailSections).toEqual([
      expect.objectContaining({ id: "semantic_runtime" }),
      {
        id: "tactical_plan",
        title: "Tactical Plan",
        items: ["selected_step_kind:gain_credits"],
      },
      {
        id: "semantic_memory",
        title: "Memory",
        items: ["memory_fact:visible"],
      },
    ]);
    expect(diagnostics.longTermPlan).toEqual([
      "tactical_plan:runner-plan-1",
      "tactical_plan_type:runner.build_credit_bank",
      "tactical_step:gain_credits",
      "legacy_reference_plan:legacy_probe",
    ]);
  });

  it("keeps hidden transport markers out of diagnostics", () => {
    const diagnostics = buildSemanticDecisionDebugDiagnostics({
      scopeId: "setup",
      selectedActionType: "draw_card",
      coverageEvidence: ["sessionToken:bad", "coverage_selection:matched"],
      selectedEvidence: [
        "run_only_action_privatePayload:bad",
        "run_only_action_secretGripIds:bad",
        "run_only_action_adjusted:true",
      ],
      tacticalPlanItems: ["tokenHash:bad", "selected_step_kind:draw_for_answer"],
      memoryItems: ["fullGameState:bad", "memory_fact:visible"],
    });

    const serialized = JSON.stringify(diagnostics);

    expect(serialized).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
    expect(serialized).not.toMatch(/secretGripIds/i);
    expect(diagnostics.detailItems).toContain("coverage_selection:matched");
    expect(diagnostics.detailItems).toContain("run_only_action_adjusted:true");
    expect(diagnostics.detailSections[1]?.items).toEqual([
      "selected_step_kind:draw_for_answer",
    ]);
    expect(diagnostics.detailSections[2]?.items).toEqual([
      "memory_fact:visible",
    ]);
  });

  it("adds side-safe decision trace diagnostic sections", () => {
    const diagnostics = buildSemanticDecisionDebugDiagnostics({
      scopeId: "setup",
      selectedActionType: "gain_credit",
      semanticShadowTopItems: [
        "semantic_shadow_top_action:gain-1",
        "privatePayload:bad",
      ],
      pilotScopeItems: [
        "ai_play_strength_pilot:basic_setup",
        "sessionToken:bad",
      ],
      calibrationProfileItems: [
        "calibration_profile:shadow_calibrated_v1",
        "fullGameState:bad",
      ],
      targetChoiceShadowItems: [
        "target_choice_shadow:report_only",
        "secretGripIds:bad",
      ],
      mistakeSummaryItems: [
        "mistake_summary:illegal_action=1",
        "cardInstances:bad",
      ],
    });

    expect(diagnostics.detailSections).toEqual(
      expect.arrayContaining([
        {
          id: "semantic_shadow_top",
          title: "Semantic Shadow Top",
          items: ["semantic_shadow_top_action:gain-1"],
        },
        {
          id: "pilot_scope",
          title: "Pilot Scope",
          items: ["ai_play_strength_pilot:basic_setup"],
        },
        {
          id: "calibration_profile",
          title: "Calibration Profile",
          items: ["calibration_profile:shadow_calibrated_v1"],
        },
        {
          id: "target_choice_shadow",
          title: "Target Choice Shadow",
          items: ["target_choice_shadow:report_only"],
        },
        {
          id: "mistake_summary",
          title: "Mistake Summary",
          items: ["mistake_summary:illegal_action=1"],
        },
      ]),
    );
    expect(JSON.stringify(diagnostics)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|secretGripIds|fullGameState/i,
    );
  });

  it("builds side-safe score components for debug reports", () => {
    expect(
      buildSemanticDecisionDebugScoreComponent({
        key: "semantic_credit_cost_penalty",
        label: "Credit-Kosten",
        value: -35,
        weight: 1,
        reason: "credits:1",
      }),
    ).toEqual({
      key: "semantic_credit_cost_penalty",
      label: "Credit-Kosten",
      value: -35,
      weight: 1,
      reason: "credits:1",
    });

    expect(
      buildSemanticDecisionDebugScoreComponent({
        key: "privatePayload_score",
        label: "sessionToken",
        value: 0,
        reason: "hiddenRemoteIdentity:bad",
      }),
    ).toEqual({
      key: "[redacted]",
      label: "[redacted]",
      value: 0,
      reason: "[redacted]",
    });
  });
});
