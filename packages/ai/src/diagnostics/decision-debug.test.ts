import { describe, expect, it } from "vitest";
import {
  buildPilotScopeDecisionMatrixDebugItems,
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
      selectedPlan: {
        planId: "runner-plan-1",
        type: "runner.build_credit_bank",
      },
      selectedStepKind: "gain_credits",
      strategicRuntimeItems: ["strategic_intent_state:runner.rnd_pressure"],
      selectionScoreItems: ["runtime_raw_score:120", "display_score_only:true"],
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
        id: "strategic_runtime",
        title: "Strategic Runtime",
        items: ["strategic_intent_state:runner.rnd_pressure"],
      },
      {
        id: "selection_score",
        title: "Selection Score",
        items: ["runtime_raw_score:120", "display_score_only:true"],
      },
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
      tacticalPlanItems: [
        "tokenHash:bad",
        "selected_step_kind:draw_for_answer",
      ],
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

  it("adds semantic precision detail sections side-safely", () => {
    const diagnostics = buildSemanticDecisionDebugDiagnostics({
      scopeId: "runner_safe_access",
      selectedActionType: "trigger_ability",
      strategyPortfolioItems: ["strategy_portfolio_active:runner.rnd_pressure"],
      actionSemanticProjectionItems: [
        "action_projection:card-action:trigger_ability:hardware_trash:card:projected:high",
      ],
      abilitySemanticBindingItems: [
        "ability_binding:card-action:explicit_ability_id:paid_ability:visible-program",
      ],
      targetContextItems: [
        "target_context:card-action:present:hardware:runner:engine_provided",
      ],
      compatibilitySignalItems: [
        "compatibility_signal:card-action:role:resource_denial",
        "sessionToken:bad",
      ],
      coverageGapItems: ["coverage_gap:unresolved-action:ability_unresolved"],
    });

    expect(diagnostics.detailSections).toEqual(
      expect.arrayContaining([
        {
          id: "strategy_portfolio",
          title: "Strategy Portfolio",
          items: ["strategy_portfolio_active:runner.rnd_pressure"],
        },
        {
          id: "action_semantic_projection",
          title: "Action Semantic Projection",
          items: [
            "action_projection:card-action:trigger_ability:hardware_trash:card:projected:high",
          ],
        },
        {
          id: "ability_semantic_binding",
          title: "Ability Semantic Binding",
          items: [
            "ability_binding:card-action:explicit_ability_id:paid_ability:visible-program",
          ],
        },
        {
          id: "target_context",
          title: "Target Context",
          items: [
            "target_context:card-action:present:hardware:runner:engine_provided",
          ],
        },
        {
          id: "compatibility_signals",
          title: "Compatibility Signals",
          items: ["compatibility_signal:card-action:role:resource_denial"],
        },
        {
          id: "coverage_gaps",
          title: "Coverage Gaps",
          items: ["coverage_gap:unresolved-action:ability_unresolved"],
        },
      ]),
    );
    expect(JSON.stringify(diagnostics)).not.toMatch(/sessionToken/i);
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
      doctrineGoalItems: [
        "doctrine_goal_trace:decision_debug",
        "privatePayload:bad",
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
          id: "doctrine_goal",
          title: "Doctrine Goal",
          items: ["doctrine_goal_trace:decision_debug"],
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

  it("formats pilot scope decision matrix items side-safely", () => {
    expect(
      buildPilotScopeDecisionMatrixDebugItems({
        topActionId: "run-hq",
        scoreGap: 42,
        scopes: [
          {
            scope: "runner_safe_access",
            allowed: true,
            reason: "runner_safe_access_central_reachable_allowed",
            evidence: ["target_kind:hq", "privatePayload:bad"],
          },
          {
            scope: "corp_score_window",
            allowed: false,
            reason: "corp_score_window_wrong_side",
            evidence: ["pilot_scope_allowed:false"],
          },
        ],
      }),
    ).toEqual([
      "pilot_scope_matrix_top_action:run-hq",
      "pilot_scope_matrix_score_gap:42",
      "pilot_scope_matrix_scope_count:2",
      "pilot_scope_matrix_scope:runner_safe_access",
      "pilot_scope_matrix_allowed:runner_safe_access:true",
      "pilot_scope_matrix_reason:runner_safe_access:runner_safe_access_central_reachable_allowed",
      "pilot_scope_matrix_evidence:runner_safe_access:target_kind:hq",
      "pilot_scope_matrix_scope:corp_score_window",
      "pilot_scope_matrix_allowed:corp_score_window:false",
      "pilot_scope_matrix_reason:corp_score_window:corp_score_window_wrong_side",
      "pilot_scope_matrix_evidence:corp_score_window:pilot_scope_allowed:false",
    ]);
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
