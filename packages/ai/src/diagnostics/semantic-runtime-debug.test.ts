import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import type {
  TacticalPlan,
  TacticalPlanRuntimeResult,
} from "../tactical-plans";
import {
  buildSemanticRuntimeDebugPlanContext,
  semanticRuntimeDebugActionDisplayScore,
  semanticRuntimeDebugActionPrecisionItems,
  semanticRuntimeDebugActionWhyChosen,
  semanticRuntimeDebugActionWhyNot,
  semanticRuntimeDebugCalibrationProfileItems,
  semanticRuntimeDebugCoverageScoreBreakdown,
  semanticRuntimeDebugExcludedActionWhyNot,
  semanticRuntimeDebugMistakeSummaryItems,
  semanticRuntimeDebugPilotScopeItems,
  semanticRuntimeDebugPlanSelectionScoreBreakdown,
  semanticRuntimeDebugRankedAlternatives,
  semanticRuntimeDebugSelectionScoreItems,
  semanticRuntimeDebugShadowTopItems,
  semanticRuntimeDebugStrategicRuntimeItems,
  semanticRuntimeDebugTacticalPlanItems,
  semanticRuntimeDebugTargetChoiceShadowItems,
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
    expect(
      semanticRuntimeDebugActionDisplayScore(selected, true, context),
    ).toBe(330);
    expect(
      semanticRuntimeDebugActionDisplayScore(lowerPlanFit, false, context),
    ).toBe(120);
    expect(semanticRuntimeDebugActionWhyChosen(selected, context)).toEqual([
      "selected_by_plan_mapping",
      "rawSemanticScore:80",
      "finalSelectionScore:330",
      "displayOnlyScore:true",
      "selected_by_plan_mapping:true",
      "scope:runner_safe_access",
      "reasonCode:semantic.runtime",
      "selectedPlan:runner.obtain_breaker_coverage",
    ]);
    expect(
      semanticRuntimeDebugActionWhyNot(lowerPlanFit, 120, context),
    ).toEqual([
      "lower_plan_fit",
      "selected_by_plan_mapping",
      "rawSemanticScore:120",
      "finalSelectionScore:120",
      "displayOnlyScore:true",
      "scope:runner_safe_access",
      "reasonCode:semantic.runtime",
      "selectedPlan:runner.obtain_breaker_coverage",
    ]);
    const excludedChoice = choice(action("run-hq", "start_run"), 60, {
      exclusion: {
        key: "known_central_no_current_payoff",
        label: "Known central no current payoff",
        reason: "hq_payoff_low",
      },
      reasonCode: "semantic.runtime.central.payoff",
      scopeId: "central_run",
    });
    expect(
      semanticRuntimeDebugExcludedActionWhyNot(excludedChoice, 60, context),
    ).toEqual([
      "semantic_excluded:known_central_no_current_payoff",
      "hq_payoff_low",
      "semantic_exclusion_reason:hq_payoff_low",
      "rawSemanticScore:60",
      "finalSelectionScore:60",
      "excluded:true",
      "scope:central_run",
      "reasonCode:semantic.runtime.central.payoff",
      "plan_selection_context:true",
      "selectedPlan:runner.obtain_breaker_coverage",
    ]);
    expect(
      semanticRuntimeDebugPlanSelectionScoreBreakdown(
        selected,
        true,
        330,
        context,
      ),
    ).toEqual([
      expect.objectContaining({
        key: "selected_by_plan_mapping",
        label: "Plan-Auswahl",
        value: 250,
      }),
    ]);
  });

  it("explains non-plan semantic runtime selections with structured why-chosen facts", () => {
    const selected = choice(action("gain", "gain_credit"), 75, {
      reasonCode: "runner.semantic.economy",
      scopeId: "basic_economy_draw",
    });
    const context = buildSemanticRuntimeDebugPlanContext({
      selectedActionId: "gain",
      selectedChoice: selected,
      mappedActionIds: [],
    });

    expect(context.selectedByPlanMapping).toBe(false);
    expect(semanticRuntimeDebugActionWhyChosen(selected, context)).toEqual([
      "semantic_runtime_actual",
      "rawSemanticScore:75",
      "finalSelectionScore:75",
      "selected_by_plan_mapping:false",
      "scope:basic_economy_draw",
      "reasonCode:runner.semantic.economy",
    ]);
  });

  it("explains non-plan semantic runtime rejections with structured why-not facts", () => {
    const rejected = choice(action("draw", "draw_card"), 45, {
      reasonCode: "runner.semantic.hand_development",
      scopeId: "basic_economy_draw",
    });
    const context = buildSemanticRuntimeDebugPlanContext({
      selectedActionId: "gain",
      selectedChoice: choice(action("gain", "gain_credit"), 90),
      mappedActionIds: [],
    });

    expect(context.selectedByPlanMapping).toBe(false);
    expect(semanticRuntimeDebugActionWhyNot(rejected, 45, context)).toEqual([
      "semantic_score_below_selected",
      "rawSemanticScore:45",
      "finalSelectionScore:45",
      "scope:basic_economy_draw",
      "reasonCode:runner.semantic.hand_development",
    ]);
  });

  it("formats strategic runtime and selection-score contracts", () => {
    const selected = choice(action("run-rd", "start_run"), 140, {
      evidence: [
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_value:260",
        "strategic_action_fit_target_match:exact",
      ],
    });
    const context = buildSemanticRuntimeDebugPlanContext({
      selectedActionId: "run-rd",
      selectedChoice: selected,
      mappedActionIds: ["run-rd"],
      selectedPlanType: "runner.pressure_central",
    });
    const input = {
      side: "runner",
      ownDeckStrategyProfile: {
        side: "runner",
        cardCount: 45,
        primaryStrategies: ["runner.rnd_pressure"],
        secondaryStrategies: ["runner.remote_contest"],
        strategyScores: {
          "runner.rnd_pressure": {
            finalScore: 72,
            confidence: "high",
            runtimeStatus: "productive",
          },
          "runner.remote_contest": {
            finalScore: 51,
            confidence: "medium",
            runtimeStatus: "productive",
          },
        },
        warnings: ["missing_compiled_hint:runner_x"],
      },
      ownStrategicIntentState: {
        primaryStrategy: {
          strategyId: "runner.rnd_pressure",
          family: "runner_central_pressure",
          completeness: "complete",
        },
        phase: "pressure",
        transition: { status: "continued" },
        targetVector: { kind: "central", targetId: "rd" },
        reserve: {
          kind: "credits",
          required: 4,
          available: 6,
          satisfied: true,
        },
        blockers: [],
        strategyPortfolio: {
          activeStrategyId: "runner.rnd_pressure",
          activeSelectionReason: "same_primary_strategy",
          productiveCandidates: [
            {
              strategyId: "runner.rnd_pressure",
              candidateRole: "primary",
              runtimeStatus: "productive",
              selectionScore: 96,
              targetVector: { kind: "central" },
              reserve: { satisfied: true },
            },
            {
              strategyId: "runner.remote_contest",
              candidateRole: "secondary",
              runtimeStatus: "productive",
              selectionScore: 67,
              targetVector: { kind: "remote" },
              reserve: { satisfied: true },
            },
          ],
          blockedCandidates: [
            {
              strategyId: "runner.remote_trash",
              runtimeStatus: "blocked",
              runtimeBlockers: ["missing_payoff"],
            },
          ],
        },
      },
    } as any;

    expect(
      semanticRuntimeDebugStrategicRuntimeItems(input, selected.evidence),
    ).toEqual(
      expect.arrayContaining([
        "deck_strategy_profile:ai_internal_strategy_profile",
        "deck_strategy_card_count:45",
        "deck_strategy_primary:runner.rnd_pressure:72:high:productive",
        "deck_strategy_secondary:runner.remote_contest:51:medium:productive",
        "strategic_intent_state:runner.rnd_pressure",
        "strategic_intent_phase:pressure",
        "strategic_intent_target_id:rd",
        "strategy_portfolio_active:runner.rnd_pressure",
        "strategy_portfolio_reason:same_primary_strategy",
        "strategy_portfolio_candidate:runner.rnd_pressure:primary:productive:96:central:true",
        "strategy_portfolio_blocked:runner.remote_trash:blocked:missing_payoff",
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_target_match:exact",
      ]),
    );
    expect(
      semanticRuntimeDebugSelectionScoreItems(selected, 390, context),
    ).toEqual(
      expect.arrayContaining([
        "runtime_raw_score:140",
        "debug_display_score:390",
        "debug_display_score_delta:250",
        "display_score_only:true",
        "selected_by_plan_mapping:true",
      ]),
    );
  });

  it("formats semantic precision sections from side-safe action candidates", () => {
    const selectedCandidate = actionSemanticCandidate({
      actionId: "card-action",
      actionType: "trigger_ability",
      sourceKind: "card",
      sourceDefinitionId: "visible-program",
      abilityId: "paid_ability",
      abilityBindingMethod: "explicit_ability_id",
      semanticActionType: "hardware_trash",
      actionTacticSignals: ["trash.hardware"],
      cardContextSignals: ["card_context:payoff"],
      compatibilitySignals: ["role:resource_denial"],
      confidence: "high",
      targetContext: {
        selectedTargets: [
          {
            targetId: "runner-hardware",
            targetKind: "hardware",
            targetSide: "runner",
            targetZone: "rig",
            targetDefinitionId: "visible-hardware",
            targetConstraints: ["not_cybernetics"],
            visibilityScope: "public",
            evidence: ["visible_target"],
          },
        ],
        availableTargetsStatus: "engine_provided",
        targetKind: "hardware",
        targetSide: "runner",
        targetZones: ["rig"],
        hiddenInfoPolicy: "side_safe_visible_only",
        targetProfileMatches: [
          {
            targetProfileId: "hardware_trash",
            status: "matched",
            issues: [],
            evidence: ["target_profile"],
          },
        ],
        targetConstraintResults: [
          {
            constraintId: "not_cybernetics",
            status: "pass",
            evidence: ["visible_subtypes"],
          },
        ],
      },
    });
    const unresolvedCandidate = actionSemanticCandidate({
      actionId: "unresolved-action",
      actionType: "trigger_ability",
      sourceKind: "card",
      abilityBindingMethod: "unresolved",
      semanticActionType: "unknown",
      primaryProjectionStatus: "partial_projected",
      projectionIssues: ["ability_unresolved", "target_context_unavailable"],
      compatibilitySignals: ["strategic_role:tag_punish"],
      hardGates: [
        {
          gateId: "ability_resolution",
          status: "unknown",
          severity: "warning",
          reason: "engine_payload_missing",
        },
      ],
    });

    const items = semanticRuntimeDebugActionPrecisionItems(
      [unresolvedCandidate, selectedCandidate],
      "card-action",
    );

    expect(items.actionSemanticProjectionItems).toEqual(
      expect.arrayContaining([
        "action_projection_candidate_count:2",
        "action_projection:card-action:trigger_ability:hardware_trash:card:projected:high",
        "semantic_origin:card-action:ability_level",
      ]),
    );
    expect(items.abilitySemanticBindingItems).toEqual(
      expect.arrayContaining([
        "ability_binding:card-action:explicit_ability_id:paid_ability:visible-program",
        "ability_binding_status:card-action:bound",
        "ability_tactic_signal:card-action:trash.hardware",
        "ability_binding_status:unresolved-action:unresolved",
      ]),
    );
    expect(items.targetContextItems).toEqual(
      expect.arrayContaining([
        "target_context:card-action:present:hardware:runner:engine_provided",
        "selected_target:card-action:hardware:runner:rig:visible-hardware:not_cybernetics",
        "target_profile_match:card-action:hardware_trash:matched:none",
        "target_constraint:card-action:not_cybernetics:pass",
        "target_context:unresolved-action:missing:unknown:unknown:target_context_unavailable",
      ]),
    );
    expect(items.compatibilitySignalItems).toEqual(
      expect.arrayContaining([
        "compatibility_signal_used:card-action",
        "compatibility_signal:card-action:role:resource_denial",
        "compatibility_signal_ignored:unresolved-action",
        "compatibility_signal:unresolved-action:strategic_role:tag_punish",
      ]),
    );
    expect(items.coverageGapItems).toEqual(
      expect.arrayContaining([
        "projection_status:unresolved-action:partial_projected",
        "coverage_gap:unresolved-action:ability_unresolved",
        "coverage_gap:unresolved-action:target_context_unavailable",
        "coverage_gate:unresolved-action:ability_resolution:unknown:engine_payload_missing",
      ]),
    );
    expect(JSON.stringify(items)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|secretGripIds/i,
    );
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

  it("formats semantic runtime evidence debug item groups", () => {
    const selected = choice(action("run-hq", "start_run"), 90, {
      evidence: [
        "ai_play_strength_pilot:basic_setup",
        "ai_play_strength_pilot_score:42",
        "ai_play_strength_pilot_goal:runner_central_pressure",
        "pilot_scope:eligible",
        "mistake_summary:avoided_loop",
        "observed_mistake_count:1",
      ],
    });

    expect(semanticRuntimeDebugShadowTopItems(selected)).toEqual([
      "semantic_shadow_top_action:run-hq",
      "semantic_shadow_top_action_type:start_run",
      "ai_play_strength_pilot_score:42",
      "ai_play_strength_pilot_goal:runner_central_pressure",
    ]);
    expect(semanticRuntimeDebugPilotScopeItems(selected.evidence)).toEqual([
      "ai_play_strength_pilot:basic_setup",
      "pilot_scope:eligible",
    ]);
    expect(
      semanticRuntimeDebugCalibrationProfileItems(selected.evidence),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^calibration_profile:/),
        expect.stringMatching(/^calibration_mode:/),
      ]),
    );
    expect(semanticRuntimeDebugMistakeSummaryItems(selected.evidence)).toEqual([
      "mistake_summary:avoided_loop",
      "observed_mistake_count:1",
    ]);
    expect(
      semanticRuntimeDebugTargetChoiceShadowItems(selected.action),
    ).toEqual([]);
  });

  it("formats tactical plan runtime diagnostics without runtime selection logic", () => {
    const selectedAction = action("install-breaker", "install_card");
    const selectedPlan = tacticalPlan({
      planId: "plan-coverage",
      type: "runner.develop_hand_card",
      priority: 320,
      evidence: [
        "hand_development_role:breaker|bad",
        "card_type:program",
        "hand_limit_pressure:high",
        "projected_overflow:2",
        "draw_overflow_penalty:-30",
        "discard_fodder_count:1",
        "useful_playable_cards_in_hand:2",
        "urgency_override:find_breaker_for_score_threat",
        "why_draw_over_install_or_credit:coverage_gap",
        "unblocks_plan:run_remote_1",
      ],
      requiredCapabilityKind: "breaker_wall",
      scoreReason: "coverage",
    });
    const blockedPlan = tacticalPlan({
      planId: "plan-bank",
      type: "runner.build_credit_bank",
      blockerKind: "bank_tool_not_installed",
    });
    const runtime: TacticalPlanRuntimeResult = {
      previousPlan: {
        schemaVersion: "tactical-plan-v1",
        memoryId: "memory-1",
        side: "runner",
        planId: "previous-plan",
        type: "runner.obtain_breaker_coverage",
        status: "active",
        blockedBy: [],
        ttlDecisionsRemaining: 2,
        planProgressionReason: "continued",
        updatedAtStateVersion: 7,
      },
      planAlternatives: [selectedPlan],
      blockedPlans: [blockedPlan],
      selectedPlan,
      selectedStep: selectedPlan.currentStep,
      selectedMapping: {
        plan: selectedPlan,
        step: selectedPlan.currentStep,
        status: "matched",
        actionCandidateIds: ["candidate-1"],
        legalActions: [selectedAction],
        rationale: [
          "older",
          "coverageAnswerRole:direct_breaker_install",
          "selected_for_coverage",
        ],
      },
      planProgressionReason: "mapping_selected",
      deckCapabilitiesUsed: ["coverage:wall"],
      strategicIntentStateUsed: ["strategic_intent_state:runner.rnd_pressure"],
      corpStrategicIntentUsed: ["corp_strategic_intent:corp.score_agendas"],
      tacticalGoalsUsed: ["tactical_goal:runner.build_economy_base"],
      runnerTacticalGoalsUsed: ["goal:contest_remote"],
    };

    const items = semanticRuntimeDebugTacticalPlanItems(runtime);

    expect(items).toContain("previous_plan:previous-plan");
    expect(items).toContain("previous_plan_ttl:2");
    expect(items).toContain("plan_progression_reason:mapping_selected");
    expect(items).toContain("selected_step_mapping:matched");
    expect(items).toContain("mapped_legal_actions:install-breaker");
    expect(items).toContain(
      "why_not_other_plan:plan-bank:bank_tool_not_installed",
    );
    expect(items).toContain("deck_capability_used:coverage:wall");
    expect(items).toContain(
      "strategic_intent_state_used:strategic_intent_state:runner.rnd_pressure",
    );
    expect(items).toContain(
      "corp_strategic_intent_used:corp_strategic_intent:corp.score_agendas",
    );
    expect(items).toContain(
      "tactical_goal_used:tactical_goal:runner.build_economy_base",
    );
    expect(items).toContain("runner_tactical_goal_used:goal:contest_remote");
    expect(items).toEqual(
      expect.arrayContaining([
        expect.stringContaining("plan_rank|rank=1|id=plan-coverage"),
      ]),
    );
    const rankItem = items.find((entry) => entry.startsWith("plan_rank|"));
    expect(rankItem).toContain("target=card:card-1");
    expect(rankItem).toContain("target_label=Breaker Card");
    expect(rankItem).toContain("target_role=breaker bad");
    expect(rankItem).toContain("capabilities=breaker_wall");
    expect(rankItem).toContain("scores=Coverage:12.35");
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

function actionSemanticCandidate(
  overrides: Partial<ActionSemanticCandidate> &
    Pick<ActionSemanticCandidate, "actionId" | "actionType">,
): ActionSemanticCandidate {
  return {
    actorSide: "runner",
    observerSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: overrides.actionId,
      actionType: overrides.actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 1,
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: overrides.actionType,
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "not_applicable",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 1,
      notes: ["test"],
    },
    confidence: "medium",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  };
}

function tacticalPlan({
  planId,
  type,
  priority = 100,
  evidence = [],
  requiredCapabilityKind = "credits",
  blockerKind = "missing_credits",
  scoreReason = "base",
}: {
  planId: string;
  type: TacticalPlan["type"];
  priority?: number;
  evidence?: string[];
  requiredCapabilityKind?: TacticalPlan["requiredCapabilities"][number]["kind"];
  blockerKind?: TacticalPlan["blockers"][number]["kind"];
  scoreReason?: string;
}): TacticalPlan {
  return {
    schemaVersion: "tactical-plan-v1",
    planId,
    side: "runner",
    type,
    status: "active",
    priority,
    horizonTurns: 2,
    target: { kind: "card", id: "card-1", label: "Breaker Card" },
    requiredCapabilities: [
      {
        capabilityId: `${planId}-capability`,
        kind: requiredCapabilityKind,
        side: "runner",
        evidence: ["required"],
      },
    ],
    blockers: [
      {
        blockerId: `${planId}-blocker`,
        kind: blockerKind,
        severity: "soft",
        evidence: ["blocked"],
      },
    ],
    currentStep: {
      stepId: `${planId}-step`,
      kind: "install_development_card",
      desiredActionSemantics: ["install"],
      requiredCapabilities: [],
      actionCandidateIds: [],
      rationale: ["step"],
    },
    nextSteps: [],
    evidence,
    scoreBreakdown: [
      {
        key: `${planId}-score`,
        label: "Coverage",
        value: 12.345,
        reason: scoreReason,
      },
    ],
    createdAtStateVersion: 1,
    updatedAtStateVersion: 1,
  };
}
