import type {
  AiDecisionDebug,
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { semanticShadowCalibrationProfileFromEnv } from "../decision/semantic-shadow-calibration";
import { buildTargetChoiceShadowReport } from "../decision/target-choice-shadow";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
} from "../runtime/semantic-runtime-types";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { scrubEvidence } from "../runtime/semantic-runtime-score-components";
import type {
  TacticalPlan,
  TacticalPlanRuntimeResult,
} from "../tactical-plans";
import { formatDebugFieldValue } from "./debug-format";
import { buildSemanticDecisionDebugScoreComponent } from "./decision-debug";

export type SemanticRuntimeDebugPlanContext = {
  selectedChoice?: SemanticRuntimeChoice;
  selectedActionId: string;
  selectedRawScore: number;
  selectedByPlanMapping: boolean;
  planMatchDisplayBoost: number;
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  selectedPlanId?: string;
  selectedPlanType?: string;
  mappedActionOrder: Map<string, number>;
};

export type BuildSemanticRuntimeDebugPlanContextInput = {
  selectedActionId: string;
  selectedChoice?: SemanticRuntimeChoice;
  mappedActionIds?: readonly string[];
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  selectedPlanId?: string;
  selectedPlanType?: string;
  planMatchDisplayBoost?: number;
};

export type SemanticRuntimeActionPrecisionDebugItems = {
  actionSemanticProjectionItems: string[];
  abilitySemanticBindingItems: string[];
  targetContextItems: string[];
  compatibilitySignalItems: string[];
  coverageGapItems: string[];
};

export function buildSemanticRuntimeDebugPlanContext({
  selectedActionId,
  selectedChoice,
  mappedActionIds = [],
  coverageSelection,
  selectedPlanId,
  selectedPlanType,
  planMatchDisplayBoost = 250,
}: BuildSemanticRuntimeDebugPlanContextInput): SemanticRuntimeDebugPlanContext {
  const mappedActionOrder = new Map(
    mappedActionIds.map((actionId, index) => [actionId, index]),
  );
  const selectedByPlanMapping =
    mappedActionOrder.has(selectedActionId) &&
    selectedChoice?.evidence.some((entry) =>
      entry.startsWith(
        "tactical_plan_mapping_outcome:semantic_choice_selected",
      ),
    ) !== true;
  return {
    ...(selectedChoice ? { selectedChoice } : {}),
    selectedActionId,
    selectedRawScore: selectedChoice?.score ?? 0,
    selectedByPlanMapping,
    planMatchDisplayBoost: selectedByPlanMapping ? planMatchDisplayBoost : 0,
    ...(coverageSelection ? { coverageSelection } : {}),
    ...(selectedPlanId ? { selectedPlanId } : {}),
    ...(selectedPlanType ? { selectedPlanType } : {}),
    mappedActionOrder,
  };
}

export function semanticRuntimeDebugActionPrecisionItems(
  candidates: readonly ActionSemanticCandidate[],
  selectedActionId?: string,
): SemanticRuntimeActionPrecisionDebugItems {
  const orderedCandidates = orderSemanticDebugCandidates(
    candidates,
    selectedActionId,
  );
  return {
    actionSemanticProjectionItems:
      semanticRuntimeDebugActionSemanticProjectionItems(orderedCandidates),
    abilitySemanticBindingItems:
      semanticRuntimeDebugAbilitySemanticBindingItems(orderedCandidates),
    targetContextItems:
      semanticRuntimeDebugTargetContextItems(orderedCandidates),
    compatibilitySignalItems: semanticRuntimeDebugCompatibilitySignalItems(
      orderedCandidates,
      selectedActionId,
    ),
    coverageGapItems: semanticRuntimeDebugCoverageGapItems(orderedCandidates),
  };
}

export function semanticRuntimeDebugStrategyPortfolioSectionItems(
  input: AiDecisionInput,
): string[] {
  const state = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (!state?.strategyPortfolio) return [];
  return scrubEvidence(semanticRuntimeDebugStrategyPortfolioItems(state));
}

function orderSemanticDebugCandidates(
  candidates: readonly ActionSemanticCandidate[],
  selectedActionId: string | undefined,
): ActionSemanticCandidate[] {
  if (!selectedActionId) return [...candidates];
  return [
    ...candidates.filter(
      (candidate) => candidate.actionId === selectedActionId,
    ),
    ...candidates.filter(
      (candidate) => candidate.actionId !== selectedActionId,
    ),
  ];
}

function semanticRuntimeDebugActionSemanticProjectionItems(
  candidates: readonly ActionSemanticCandidate[],
): string[] {
  if (candidates.length === 0) return [];
  return scrubEvidence([
    `action_projection_candidate_count:${candidates.length}`,
    ...candidates
      .slice(0, 12)
      .flatMap((candidate) => [
        [
          "action_projection",
          candidate.actionId,
          candidate.actionType,
          candidate.semanticActionType,
          candidate.sourceKind,
          candidate.primaryProjectionStatus,
          candidate.confidence,
        ].join(":"),
        [
          "semantic_origin",
          candidate.actionId,
          semanticRuntimeDebugOrigin(candidate),
        ].join(":"),
        `projection_signal_count:${candidate.actionId}:${candidate.actionTacticSignals.length}`,
        `card_context_signal_count:${candidate.actionId}:${candidate.cardContextSignals.length}`,
      ]),
  ]);
}

function semanticRuntimeDebugAbilitySemanticBindingItems(
  candidates: readonly ActionSemanticCandidate[],
): string[] {
  const abilityCandidates = candidates.filter(
    (candidate) =>
      candidate.sourceKind === "card" ||
      candidate.abilityBindingMethod !== "unresolved" ||
      candidate.abilityId !== undefined ||
      candidate.sourceDefinitionId !== undefined ||
      candidate.projectionIssues.includes("ability_unresolved"),
  );
  if (abilityCandidates.length === 0) return [];
  return scrubEvidence(
    abilityCandidates
      .slice(0, 12)
      .flatMap((candidate) => [
        [
          "ability_binding",
          candidate.actionId,
          candidate.abilityBindingMethod,
          candidate.abilityId ?? "none",
          candidate.sourceDefinitionId ?? "none",
        ].join(":"),
        `ability_binding_status:${candidate.actionId}:${semanticRuntimeDebugAbilityBindingStatus(candidate)}`,
        ...candidate.actionTacticSignals
          .slice(0, 5)
          .map(
            (signal) => `ability_tactic_signal:${candidate.actionId}:${signal}`,
          ),
      ]),
  );
}

function semanticRuntimeDebugTargetContextItems(
  candidates: readonly ActionSemanticCandidate[],
): string[] {
  const targetCandidates = candidates.filter(
    (candidate) =>
      candidate.targetContext !== undefined ||
      candidate.projectionIssues.includes("target_context_unavailable"),
  );
  if (targetCandidates.length === 0) return [];
  return scrubEvidence(
    targetCandidates.slice(0, 12).flatMap((candidate) => {
      const context = candidate.targetContext;
      if (!context) {
        return [
          `target_context:${candidate.actionId}:missing:unknown:unknown:target_context_unavailable`,
        ];
      }
      return [
        [
          "target_context",
          candidate.actionId,
          "present",
          context.targetKind,
          context.targetSide,
          context.availableTargetsStatus,
        ].join(":"),
        ...context.selectedTargets
          .slice(0, 4)
          .map((target) =>
            [
              "selected_target",
              candidate.actionId,
              target.targetKind,
              target.targetSide,
              target.targetZone ?? "unknown",
              target.targetDefinitionId ?? "none",
              (target.targetConstraints ?? []).join(",") || "none",
            ].join(":"),
          ),
        ...context.targetProfileMatches
          .slice(0, 4)
          .map((match) =>
            [
              "target_profile_match",
              candidate.actionId,
              match.targetProfileId ?? "unknown",
              match.status,
              match.issues.join(",") || "none",
            ].join(":"),
          ),
        ...context.targetConstraintResults
          .slice(0, 4)
          .map((constraint) =>
            [
              "target_constraint",
              candidate.actionId,
              constraint.constraintId ?? "unknown",
              constraint.status,
            ].join(":"),
          ),
      ];
    }),
  );
}

function semanticRuntimeDebugCompatibilitySignalItems(
  candidates: readonly ActionSemanticCandidate[],
  selectedActionId: string | undefined,
): string[] {
  const compatibilityCandidates = candidates.filter(
    (candidate) => (candidate.compatibilitySignals?.length ?? 0) > 0,
  );
  if (compatibilityCandidates.length === 0) return [];
  return scrubEvidence(
    compatibilityCandidates
      .slice(0, 12)
      .flatMap((candidate) => [
        `compatibility_signal_count:${candidate.actionId}:${candidate.compatibilitySignals?.length ?? 0}`,
        `compatibility_signal_${candidate.actionId === selectedActionId ? "used" : "ignored"}:${candidate.actionId}`,
        ...(candidate.compatibilitySignals ?? [])
          .slice(0, 6)
          .map(
            (signal) => `compatibility_signal:${candidate.actionId}:${signal}`,
          ),
      ]),
  );
}

function semanticRuntimeDebugCoverageGapItems(
  candidates: readonly ActionSemanticCandidate[],
): string[] {
  const items = candidates.slice(0, 12).flatMap((candidate) => [
    ...(candidate.primaryProjectionStatus === "projected"
      ? []
      : [
          `projection_status:${candidate.actionId}:${candidate.primaryProjectionStatus}`,
        ]),
    ...candidate.projectionIssues
      .slice(0, 6)
      .map((issue) => `coverage_gap:${candidate.actionId}:${issue}`),
    ...candidate.hardGates
      .filter((gate) => gate.status === "block" || gate.status === "unknown")
      .slice(0, 6)
      .map((gate) =>
        [
          "coverage_gate",
          candidate.actionId,
          gate.gateId,
          gate.status,
          gate.reason ?? "none",
        ].join(":"),
      ),
  ]);
  return scrubEvidence(items);
}

function semanticRuntimeDebugOrigin(
  candidate: ActionSemanticCandidate,
): string {
  if (candidate.sourceKind === "basic_action") return "basic_action";
  if (candidate.actionTacticSignals.length > 0) return "ability_level";
  if (candidate.targetContext) return "target_level";
  if (candidate.cardContextSignals.length > 0) return "card_level";
  if ((candidate.compatibilitySignals?.length ?? 0) > 0) {
    return "compatibility_only";
  }
  if (candidate.projectionIssues.includes("ability_unresolved")) {
    return "ability_unresolved";
  }
  return "fallback_coverage_candidate";
}

function semanticRuntimeDebugAbilityBindingStatus(
  candidate: ActionSemanticCandidate,
): "bound" | "unresolved" | "not_card_action" {
  if (candidate.sourceKind !== "card" && candidate.abilityId === undefined) {
    return "not_card_action";
  }
  return candidate.abilityBindingMethod === "unresolved"
    ? "unresolved"
    : "bound";
}

export function buildSemanticRuntimePlanSelectionDisplayContext(params: {
  planRuntime: TacticalPlanRuntimeResult;
  selectedActionId: string;
  selectedChoice?: SemanticRuntimeChoice;
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
}): SemanticRuntimeDebugPlanContext {
  const mappedActions = params.planRuntime.selectedMapping?.legalActions ?? [];
  return buildSemanticRuntimeDebugPlanContext({
    selectedActionId: params.selectedActionId,
    ...(params.selectedChoice ? { selectedChoice: params.selectedChoice } : {}),
    mappedActionIds: mappedActions.map((action) => action.actionId),
    ...(params.coverageSelection
      ? { coverageSelection: params.coverageSelection }
      : {}),
    ...(params.planRuntime.selectedPlan?.planId
      ? { selectedPlanId: params.planRuntime.selectedPlan.planId }
      : {}),
    ...(params.planRuntime.selectedPlan?.type
      ? { selectedPlanType: params.planRuntime.selectedPlan.type }
      : {}),
  });
}

export function semanticRuntimeDebugCoverageScoreBreakdown(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  context: SemanticRuntimeDebugPlanContext,
): AiDecisionScoreComponent[] {
  const coverageSelection = context.coverageSelection;
  if (
    !selected ||
    !coverageSelection ||
    choice.action.actionId !== context.selectedActionId
  ) {
    return [];
  }
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: "runner_coverage_answer_fit",
      label: `Coverage-Suchtreffer: ${coverageSelection.capabilityLabel}`,
      value: 0,
      reason: coverageSelection.evidence.join("|"),
    }),
  ];
}

export function semanticRuntimeDebugActionDisplayScore(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  context: SemanticRuntimeDebugPlanContext,
): number {
  if (choice.exclusion) return choice.score;
  if (!context.selectedByPlanMapping) return choice.score;
  const selectedFinalScore =
    context.selectedRawScore + context.planMatchDisplayBoost;
  if (selected) return selectedFinalScore;
  const selectedOrder = context.mappedActionOrder.get(context.selectedActionId);
  const choiceOrder = context.mappedActionOrder.get(choice.action.actionId);
  if (choiceOrder !== undefined && selectedOrder !== undefined) {
    if (choiceOrder > selectedOrder) {
      return Math.min(
        choice.score,
        selectedFinalScore - (choiceOrder - selectedOrder) * 25,
      );
    }
    return choice.score;
  }
  if (choice.score > selectedFinalScore) {
    return selectedFinalScore - 50;
  }
  return choice.score;
}

export function semanticRuntimeDebugPlanSelectionScoreBreakdown(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  displayScore: number,
  context: SemanticRuntimeDebugPlanContext,
): AiDecisionScoreComponent[] {
  if (!context.selectedByPlanMapping || choice.exclusion) return [];
  const reason = [
    `rawSemanticScore:${choice.score}`,
    `finalSelectionScore:${displayScore}`,
    "displayOnlyScore:true",
    "runtimeScoreUnchanged:true",
    context.selectedPlanType ? `selectedPlan:${context.selectedPlanType}` : "",
    context.planMatchDisplayBoost
      ? `planMatchDisplayBoost:${context.planMatchDisplayBoost}`
      : "",
    context.mappedActionOrder.has(choice.action.actionId)
      ? "selected_by_plan_mapping_candidate:true"
      : "plan_mismatch:true",
  ]
    .filter(Boolean)
    .join("|");
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: selected ? "selected_by_plan_mapping" : "plan_selection_adjustment",
      label: selected ? "Plan-Auswahl" : "Plan-Abgleich",
      value: roundScore(displayScore - choice.score),
      reason,
    }),
  ];
}

export function semanticRuntimeDebugActionWhyChosen(
  choice: SemanticRuntimeChoice,
  context: SemanticRuntimeDebugPlanContext,
): string[] {
  if (context.selectedByPlanMapping) {
    return [
      "selected_by_plan_mapping",
      `rawSemanticScore:${choice.score}`,
      `finalSelectionScore:${choice.score + context.planMatchDisplayBoost}`,
      "displayOnlyScore:true",
      ...(context.selectedPlanType
        ? [`selectedPlan:${context.selectedPlanType}`]
        : []),
    ];
  }
  return ["semantic_runtime_actual"];
}

export function semanticRuntimeDebugActionWhyNot(
  choice: SemanticRuntimeChoice,
  displayScore: number,
  context: SemanticRuntimeDebugPlanContext,
): string[] {
  if (context.selectedByPlanMapping) {
    const mapped = context.mappedActionOrder.has(choice.action.actionId);
    return [
      mapped ? "lower_plan_fit" : "plan_mismatch",
      mapped ? "selected_by_plan_mapping" : "excluded_by_current_plan",
      `rawSemanticScore:${choice.score}`,
      `finalSelectionScore:${displayScore}`,
      "displayOnlyScore:true",
      ...(displayScore < choice.score
        ? ["lower_final_score_after_adjustment"]
        : []),
    ];
  }
  return ["semantic_score_below_selected"];
}

export function semanticRuntimeDebugStrategicRuntimeItems(
  input: AiDecisionInput,
  selectedEvidence: readonly string[],
): string[] {
  const enrichedInput = input as AiDecisionInputWithDeckCapabilities;
  const state = enrichedInput.ownStrategicIntentState;
  if (!state) return [];
  return scrubEvidence([
    ...semanticRuntimeDebugDeckStrategyItems(enrichedInput),
    `strategic_intent_state:${state.primaryStrategy.strategyId}`,
    `strategic_intent_family:${state.primaryStrategy.family}`,
    `strategic_intent_phase:${state.phase}`,
    `strategic_intent_transition:${state.transition.status}`,
    `strategic_intent_completeness:${state.primaryStrategy.completeness}`,
    `strategic_intent_target:${state.targetVector.kind}`,
    ...(state.targetVector.targetId
      ? [`strategic_intent_target_id:${state.targetVector.targetId}`]
      : []),
    `strategic_intent_reserve:${state.reserve.kind}:${state.reserve.required}:${state.reserve.available ?? "unknown"}:${state.reserve.satisfied}`,
    ...semanticRuntimeDebugStrategyPortfolioItems(state),
    `strategic_intent_blocker_count:${state.blockers.length}`,
    ...state.blockers
      .slice(0, 4)
      .map(
        (blocker) =>
          `strategic_intent_blocker:${blocker.reason}:${blocker.severity}`,
      ),
    ...selectedEvidence
      .filter(
        (entry) =>
          entry.startsWith("semantic_strategic_action_fit") ||
          entry.startsWith("strategic_action_fit_"),
      )
      .slice(0, 12),
  ]);
}

function semanticRuntimeDebugStrategyPortfolioItems(
  state: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >,
): string[] {
  const portfolio = state.strategyPortfolio;
  if (!portfolio) return ["strategy_portfolio:missing"];
  return [
    `strategy_portfolio_active:${portfolio.activeStrategyId ?? "none"}`,
    `strategy_portfolio_reason:${portfolio.activeSelectionReason}`,
    `strategy_portfolio_productive_count:${portfolio.productiveCandidates.length}`,
    `strategy_portfolio_blocked_count:${portfolio.blockedCandidates.length}`,
    ...portfolio.productiveCandidates
      .slice(0, 5)
      .map((candidate) =>
        [
          "strategy_portfolio_candidate",
          candidate.strategyId,
          candidate.candidateRole,
          candidate.runtimeStatus,
          roundScore(candidate.selectionScore),
          candidate.targetVector.kind,
          candidate.reserve.satisfied,
        ].join(":"),
      ),
    ...portfolio.blockedCandidates
      .slice(0, 5)
      .map((candidate) =>
        [
          "strategy_portfolio_blocked",
          candidate.strategyId,
          candidate.runtimeStatus,
          candidate.runtimeBlockers.join(",") || "no_blocker_detail",
        ].join(":"),
      ),
  ];
}

function semanticRuntimeDebugDeckStrategyItems(
  input: AiDecisionInputWithDeckCapabilities,
): string[] {
  const profile = input.ownDeckStrategyProfile;
  if (!profile) {
    return ["deck_strategy_profile:missing"];
  }
  return [
    "deck_strategy_profile:ai_internal_strategy_profile",
    `deck_strategy_side:${profile.side}`,
    `deck_strategy_card_count:${profile.cardCount}`,
    `deck_strategy_primary_count:${profile.primaryStrategies.length}`,
    `deck_strategy_secondary_count:${profile.secondaryStrategies.length}`,
    ...profile.primaryStrategies
      .slice(0, 3)
      .map((strategyId) =>
        semanticRuntimeDebugDeckStrategyLine(
          "deck_strategy_primary",
          strategyId,
          profile.strategyScores[strategyId],
        ),
      ),
    ...profile.secondaryStrategies
      .slice(0, 4)
      .map((strategyId) =>
        semanticRuntimeDebugDeckStrategyLine(
          "deck_strategy_secondary",
          strategyId,
          profile.strategyScores[strategyId],
        ),
      ),
    ...profile.warnings
      .slice(0, 4)
      .map((warning) => `deck_strategy_warning:${warning}`),
  ];
}

function semanticRuntimeDebugDeckStrategyLine(
  prefix: "deck_strategy_primary" | "deck_strategy_secondary",
  strategyId: string,
  score:
    | NonNullable<
        AiDecisionInputWithDeckCapabilities["ownDeckStrategyProfile"]
      >["strategyScores"][string]
    | undefined,
): string {
  const finalScore =
    score && typeof score === "object" && "finalScore" in score
      ? Number(score.finalScore)
      : 0;
  const confidence =
    score && typeof score === "object" && "confidence" in score
      ? String(score.confidence)
      : "unknown";
  const runtimeStatus =
    score && typeof score === "object" && "runtimeStatus" in score
      ? String(score.runtimeStatus ?? "unknown")
      : "unknown";
  return `${prefix}:${strategyId}:${roundScore(finalScore)}:${confidence}:${runtimeStatus}`;
}

export function semanticRuntimeDebugSelectionScoreItems(
  selected: SemanticRuntimeChoice,
  displayScore: number,
  context: SemanticRuntimeDebugPlanContext,
): string[] {
  return scrubEvidence([
    `runtime_raw_score:${selected.score}`,
    `debug_display_score:${displayScore}`,
    `debug_display_score_delta:${roundScore(displayScore - selected.score)}`,
    "display_score_only:true",
    "runtime_score_source:semantic_components",
    `selected_by_plan_mapping:${context.selectedByPlanMapping}`,
    `plan_match_display_boost:${context.planMatchDisplayBoost}`,
    ...(context.selectedPlanType
      ? [`selected_plan_type:${context.selectedPlanType}`]
      : []),
  ]);
}

export function semanticRuntimeDebugRankedAlternatives(params: {
  rankedChoices: readonly SemanticRuntimeChoice[];
  selectedActionId: string;
  scoreBreakdownForChoice: (
    choice: SemanticRuntimeChoice,
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  scrubEvidence: (evidence: string[]) => string[];
}): NonNullable<AiDecisionDebug["rankedAlternatives"]> {
  return params.rankedChoices
    .filter((choice) => !choice.exclusion)
    .slice(0, 24)
    .map((choice, index) => ({
      rank: index + 1,
      planId: `semantic_runtime:${choice.scopeId}:${choice.action.type}`,
      planKind: choice.scopeId,
      selectedActionType: choice.action.type,
      summary: choice.explanation,
      score: choice.score,
      ...(choice.confidence !== undefined
        ? { confidence: choice.confidence }
        : {}),
      visibleReasons: params.scrubEvidence(choice.evidence).slice(0, 4),
      scoreBreakdown: params.scoreBreakdownForChoice(choice),
      whyNot:
        choice.action.actionId === params.selectedActionId
          ? ["selected_action"]
          : ["semantic_score_below_selected"],
    }));
}

export function semanticRuntimeDebugShadowTopItems(
  selected: SemanticRuntimeChoice,
): string[] {
  const topEvidence = selected.evidence.filter(
    (entry) =>
      entry.startsWith("ai_play_strength_pilot_score") ||
      entry.startsWith("ai_play_strength_pilot_goal"),
  );
  if (topEvidence.length === 0) return [];
  return scrubEvidence([
    `semantic_shadow_top_action:${selected.action.actionId}`,
    `semantic_shadow_top_action_type:${selected.action.type}`,
    ...topEvidence,
  ]);
}

export function semanticRuntimeDebugPilotScopeItems(
  evidence: readonly string[],
): string[] {
  return scrubEvidence(
    evidence.filter(
      (entry) =>
        entry.startsWith("ai_play_strength_pilot:") ||
        entry.startsWith("pilot_scope"),
    ),
  );
}

export function semanticRuntimeDebugCalibrationProfileItems(
  evidence: readonly string[],
): string[] {
  if (!evidence.some((entry) => entry.startsWith("ai_play_strength_pilot:"))) {
    return [];
  }
  const profile = semanticShadowCalibrationProfileFromEnv();
  return scrubEvidence([
    `calibration_profile:${profile.profileId}`,
    `calibration_mode:${profile.mode}`,
    `calibration_version:${profile.version}`,
    `calibration_baseline:${profile.baselineReference}`,
    `calibration_minimum_score_gap:${profile.pilotMinimumScoreGap}`,
    `calibration_productive_use_allowed:${profile.productiveUseAllowed}`,
  ]);
}

export function semanticRuntimeDebugTargetChoiceShadowItems(
  action: LegalAction,
): string[] {
  if (
    (action.targetRequirements?.length ?? 0) === 0 &&
    (action.choiceRequirements?.length ?? 0) === 0
  ) {
    return [];
  }
  try {
    const report = buildTargetChoiceShadowReport({
      action: {
        ...action,
        targetRequirements: action.targetRequirements ?? [],
      },
    });
    return [
      ...report.evidence,
      `target_choice_action_type:${report.actionType}`,
      `target_choice_ranked_option_count:${report.rankedOptions.length}`,
      `target_choice_blocked_requirement_count:${report.blockedRequirements.length}`,
      ...report.rankedOptions
        .slice(0, 6)
        .map(
          (option) =>
            `target_choice_option:${option.rank}:${option.kind}:${option.requirementId}:${option.optionId}:${option.score}`,
        ),
      ...report.blockedRequirements
        .slice(0, 6)
        .map(
          (requirement) =>
            `target_choice_blocked:${requirement.kind}:${requirement.reason}`,
        ),
    ];
  } catch {
    return ["target_choice_shadow:unavailable_redacted"];
  }
}

export function semanticRuntimeDebugMistakeSummaryItems(
  evidence: readonly string[],
): string[] {
  return scrubEvidence(
    evidence.filter(
      (entry) =>
        entry.startsWith("mistake_summary:") ||
        entry.startsWith("observed_mistake_count:"),
    ),
  );
}

export function semanticRuntimeDebugTacticalPlanItems(
  planRuntime: TacticalPlanRuntimeResult,
): string[] {
  const selectedPlan = planRuntime.selectedPlan;
  const selectedStep = planRuntime.selectedStep;
  const selectedMapping = planRuntime.selectedMapping;
  const previousPlan = planRuntime.previousPlan;
  return [
    ...(previousPlan
      ? [
          `previous_plan:${previousPlan.planId}`,
          `previous_plan_type:${previousPlan.type}`,
          `previous_plan_status:${previousPlan.status}`,
          `previous_plan_ttl:${previousPlan.ttlDecisionsRemaining}`,
        ]
      : ["previous_plan:none"]),
    ...(planRuntime.planProgressionReason
      ? [`plan_progression_reason:${planRuntime.planProgressionReason}`]
      : []),
    ...(planRuntime.whyPlanAbandoned
      ? [`why_plan_abandoned:${planRuntime.whyPlanAbandoned}`]
      : []),
    ...(planRuntime.deckCapabilitiesUsed ?? [])
      .slice(0, 12)
      .map((fact) => `deck_capability_used:${fact}`),
    ...(planRuntime.strategicIntentStateUsed ?? [])
      .slice(0, 12)
      .map((fact) => `strategic_intent_state_used:${fact}`),
    ...(planRuntime.corpStrategicIntentUsed ?? [])
      .slice(0, 12)
      .map((fact) => `corp_strategic_intent_used:${fact}`),
    ...(planRuntime.tacticalGoalsUsed ?? [])
      .slice(0, 16)
      .map((fact) => `tactical_goal_used:${fact}`),
    ...(planRuntime.runnerStrategicIntentUsed ?? [])
      .slice(0, 12)
      .map((fact) => `runner_strategic_intent_used:${fact}`),
    ...(planRuntime.runnerRunTargetEvaluationsUsed ?? [])
      .slice(0, 12)
      .map((fact) => `runner_run_target_used:${fact}`),
    ...(planRuntime.runnerEconomyPostureUsed ?? [])
      .slice(0, 28)
      .map((fact) => `runner_economy_posture_used:${fact}`),
    ...(planRuntime.runnerHandDevelopmentEvaluationsUsed ?? [])
      .slice(0, 12)
      .map((fact) => `runner_hand_development_used:${fact}`),
    ...(planRuntime.runnerTacticalGoalsUsed ?? [])
      .slice(0, 12)
      .map((fact) => `runner_tactical_goal_used:${fact}`),
    `plan_alternative_count:${planRuntime.planAlternatives.length}`,
    `blocked_plan_count:${planRuntime.blockedPlans.length}`,
    ...(selectedPlan
      ? [
          `selected_plan:${selectedPlan.planId}`,
          `selected_plan_type:${selectedPlan.type}`,
          `selected_plan_status:${selectedPlan.status}`,
        ]
      : ["selected_plan:none"]),
    ...(selectedPlan?.type === "runner.develop_hand_card"
      ? selectedPlan.evidence
          .filter((entry) => entry.startsWith("hand_development_"))
          .slice(0, 6)
          .map((entry) => `selected_development_goal:${entry}`)
      : []),
    ...(selectedStep
      ? [
          `selected_step:${selectedStep.stepId}`,
          `selected_step_kind:${selectedStep.kind}`,
        ]
      : []),
    ...(selectedMapping
      ? [
          `selected_step_mapping:${selectedMapping.status}`,
          `mapped_legal_actions:${selectedMapping.legalActions
            .map((action) => action.actionId)
            .join("|")}`,
          ...selectedMapping.rationale
            .slice(-4)
            .map((entry) => `why_this_action:${entry}`),
        ]
      : []),
    ...planRuntime.blockedPlans
      .slice(0, 3)
      .map(
        (plan) =>
          `why_not_other_plan:${plan.planId}:${plan.blockers
            .map((blocker) => blocker.kind)
            .join(",")}`,
      ),
    ...planRuntime.planAlternatives.map((plan, index) =>
      tacticalPlanRankDebugItem(
        plan,
        index + 1,
        selectedPlan?.planId === plan.planId,
      ),
    ),
  ];
}

function tacticalPlanRankDebugItem(
  plan: TacticalPlan,
  rank: number,
  selected: boolean,
): string {
  const fields: Array<[string, string | number | boolean | undefined]> = [
    ["rank", rank],
    ["id", plan.planId],
    ["type", plan.type],
    ["target", tacticalPlanTargetDebugValue(plan.target)],
    ["target_label", plan.target?.label],
    ["target_role", tacticalPlanTargetRoleDebugValue(plan)],
    ["card_type", tacticalPlanEvidenceValue(plan, "card_type:")],
    [
      "handLimitPressure",
      tacticalPlanEvidenceValue(plan, "hand_limit_pressure:"),
    ],
    [
      "projectedOverflow",
      tacticalPlanEvidenceValue(plan, "projected_overflow:"),
    ],
    [
      "drawOverflowPenalty",
      tacticalPlanEvidenceValue(plan, "draw_overflow_penalty:"),
    ],
    [
      "discardFodderCount",
      tacticalPlanEvidenceValue(plan, "discard_fodder_count:"),
    ],
    [
      "usefulPlayableCardsInHand",
      tacticalPlanEvidenceValue(plan, "useful_playable_cards_in_hand:"),
    ],
    ["urgencyOverride", tacticalPlanEvidenceValue(plan, "urgency_override:")],
    [
      "why_draw_over_install_or_credit",
      tacticalPlanEvidenceValue(plan, "why_draw_over_install_or_credit:"),
    ],
    ["priority", plan.priority],
    ["status", plan.status],
    ["step", plan.currentStep.kind],
    ["selected", selected],
    ["blockers", plan.blockers.map((blocker) => blocker.kind).join(",")],
    [
      "capabilities",
      plan.requiredCapabilities.map((capability) => capability.kind).join(","),
    ],
    ["unblocks", tacticalPlanUnblocksDebugValue(plan)],
    ["scores", tacticalPlanScoreDebugValue(plan)],
  ];
  return `plan_rank|${fields
    .filter(([, value]) => value !== undefined && String(value).length > 0)
    .map(([key, value]) => `${key}=${formatDebugFieldValue(value!)}`)
    .join("|")}`;
}

function tacticalPlanTargetDebugValue(target: TacticalPlan["target"]): string {
  if (!target) return "";
  return [target.kind, target.id].filter(Boolean).join(":");
}

function tacticalPlanTargetRoleDebugValue(
  plan: TacticalPlan,
): string | undefined {
  if (plan.type !== "runner.develop_hand_card") return undefined;
  const prefix = "hand_development_role:";
  const role = plan.evidence.find((entry) => entry.startsWith(prefix));
  return role ? role.slice(prefix.length) : undefined;
}

function tacticalPlanEvidenceValue(
  plan: TacticalPlan,
  prefix: string,
): string | undefined {
  const entry = plan.evidence.find((candidate) => candidate.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : undefined;
}

function tacticalPlanUnblocksDebugValue(plan: TacticalPlan): string {
  return plan.evidence
    .filter((entry) => entry.startsWith("unblocks_plan:"))
    .map((entry) => entry.slice("unblocks_plan:".length))
    .join(",");
}

function tacticalPlanScoreDebugValue(plan: TacticalPlan): string {
  return plan.scoreBreakdown
    .slice(0, 5)
    .map((component) => `${component.label}:${roundScore(component.value)}`)
    .join(",");
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
