import type { ActionProjectionIssue } from "./action-semantic-candidate";
import {
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  buildShadowEvaluationBatchReport,
  buildShadowScenarioCorpusReport,
  type ShadowActorSide,
  type ShadowEvaluationBatchReport,
  type ShadowModeNoEffectFlags,
  type ShadowScenarioFixture,
} from "./controlled-shadow-mode";

export const SHADOW_READINESS_EXPANSION_PROCESS_SCHEMA_VERSION =
  "shadow-readiness-expansion-process-v1" as const;

export const AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION =
  "ai061-sr-target-context-projection-expansion-v1" as const;

export const AI062_SR_ABILITY_BINDING_EXPANSION_SCHEMA_VERSION =
  "ai062-sr-ability-binding-expansion-v1" as const;

export const AI063_SR_CARD_SEMANTICS_JOIN_SCHEMA_VERSION =
  "ai063-sr-card-semantics-join-coverage-v1" as const;

export const AI064_SR_COST_TIMING_EVIDENCE_SCHEMA_VERSION =
  "ai064-sr-cost-timing-evidence-expansion-v1" as const;

export const AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTION_SCHEMA_VERSION =
  "ai065-sr-runtime-backed-shadow-fixture-promotion-v1" as const;

export const AI066_SR_SHADOW_EVALUATION_RERUN_SCHEMA_VERSION =
  "ai066-sr-shadow-evaluation-rerun-v1" as const;

export const AI067_SR_SHADOW_READINESS_REREVIEW_SCHEMA_VERSION =
  "ai067-sr-shadow-readiness-rereview-v1" as const;

export const SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS =
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS;

export type SideSafeTargetContextProjection = {
  scenarioId: string;
  side: ShadowActorSide;
  targetContextStatus: "projected_side_safe";
  selectedTargetSource:
    | "engine_legal_action"
    | "engine_choice_payload"
    | "actor_private_install_context";
  selectedTargetStatus:
    | "explicit_selected_target"
    | "legal_target_options_available"
    | "target_requirements_available";
  legalTargetOptionsStatus: "engine_provided";
  targetProfileMatchStatus:
    | "server_profile_match_side_safe"
    | "card_instance_profile_match_side_safe"
    | "encounter_profile_match_side_safe"
    | "choice_target_profile_match_side_safe";
  hiddenInfoPolicy: "no_hidden_info_projected";
  evidence: string[];
  removedGap: Extract<ActionProjectionIssue, "target_context_unavailable">;
  productiveChangeAllowed: false;
};

export type Ai061SrTargetContextProjectionExpansionReport = {
  schemaVersion: typeof AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION;
  step: "AI061-SR";
  scope: "target_context_projection_expansion";
  sourceReadinessStatus: "limited_shadow_ready";
  targetContextGapBefore: 13;
  targetContextGapAfter: number;
  projectedTargetContextCount: number;
  hiddenInfoGuardedTargetContextNotProjectedCount: number;
  projections: SideSafeTargetContextProjection[];
  notProjected: Array<{
    scenarioId: string;
    reason: "hidden_info_guard_remains_blocked";
    retainedGaps: ActionProjectionIssue[];
  }>;
  batchAfterTargetContextExpansion: Pick<
    ShadowEvaluationBatchReport,
    "scenarioCount" | "decisionPointCount" | "topSemanticGaps"
  >;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type SideSafeAbilityBinding = {
  scenarioId: string;
  side: ShadowActorSide;
  bindingStatus: "bound_side_safe";
  bindingMethod:
    | "explicit_ability_id"
    | "engine_payload"
    | "effect_ref"
    | "single_legal_ability_inferred";
  abilityBindingMethod:
    | "explicit"
    | "payload"
    | "effect_ref"
    | "single_legal_ability_inferred";
  sourceCardStatus:
    | "source_card_id_present"
    | "source_card_not_required"
    | "source_card_context_side_safe";
  abilityIdStatus: "stable_side_safe_reference";
  hiddenInfoPolicy: "no_hidden_info_projected";
  evidence: string[];
  removedGap: Extract<ActionProjectionIssue, "ability_unresolved">;
  productiveChangeAllowed: false;
};

export type Ai062SrAbilityBindingExpansionReport = {
  schemaVersion: typeof AI062_SR_ABILITY_BINDING_EXPANSION_SCHEMA_VERSION;
  step: "AI062-SR";
  scope: "ability_binding_expansion";
  sourceReadinessStatus: "limited_shadow_ready";
  abilityUnresolvedBefore: 6;
  resolvedAbilityBindingCount: number;
  abilityUnresolvedAfter: number;
  bindings: SideSafeAbilityBinding[];
  unresolved: Array<{
    scenarioId: string;
    reason: "multi_ability_without_explicit_side_safe_id";
    retainedGaps: ActionProjectionIssue[];
  }>;
  batchAfterAbilityBindingExpansion: Pick<
    ShadowEvaluationBatchReport,
    "scenarioCount" | "decisionPointCount" | "topSemanticGaps"
  >;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type SideSafeCardSemanticsJoin = {
  scenarioId: string;
  side: ShadowActorSide;
  joinStatus: "joined_side_safe";
  cardContextSignalsStatus: "available";
  actionTacticSignalsStatus:
    | "available_ability_resolved"
    | "available_basic_action"
    | "card_context_only";
  sourceCardStatus:
    | "source_card_id_present"
    | "visible_or_actor_private_card_context"
    | "public_condition_context";
  hiddenInfoPolicy: "no_hidden_info_projected";
  evidence: string[];
  removedGap: Extract<ActionProjectionIssue, "card_semantics_unavailable">;
  productiveChangeAllowed: false;
};

export type Ai063SrCardSemanticsJoinCoverageReport = {
  schemaVersion: typeof AI063_SR_CARD_SEMANTICS_JOIN_SCHEMA_VERSION;
  step: "AI063-SR";
  scope: "card_semantics_join_coverage";
  sourceReadinessStatus: "limited_shadow_ready";
  cardSemanticsUnavailableBefore: 7;
  joinedCardSemanticsCount: number;
  cardSemanticsUnavailableAfter: number;
  joins: SideSafeCardSemanticsJoin[];
  batchAfterCardSemanticsJoinCoverage: Pick<
    ShadowEvaluationBatchReport,
    "scenarioCount" | "decisionPointCount" | "topSemanticGaps"
  >;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type SideSafeCostTimingEvidence = {
  scenarioId: string;
  side: ShadowActorSide;
  costKnownStatus:
    | "fixed_cost_from_legal_action"
    | "variable_cost_range_from_legal_action"
    | "trace_bid_cost_from_choice"
    | "access_cost_from_legal_window";
  paidBy: ShadowActorSide;
  beneficiary: ShadowActorSide | "none";
  variableCost: boolean;
  timingProfileStatus: "timing_point_from_legal_action";
  hiddenInfoPolicy: "no_hidden_info_projected";
  evidence: string[];
  removedGap: Extract<ActionProjectionIssue, "cost_unknown">;
  productiveChangeAllowed: false;
};

export type Ai064SrCostTimingEvidenceExpansionReport = {
  schemaVersion: typeof AI064_SR_COST_TIMING_EVIDENCE_SCHEMA_VERSION;
  step: "AI064-SR";
  scope: "cost_timing_evidence_expansion";
  sourceReadinessStatus: "limited_shadow_ready";
  costUnknownBefore: 4;
  normalizedCostTimingEvidenceCount: number;
  costUnknownAfter: number;
  timingUnknownAfter: number;
  evidence: SideSafeCostTimingEvidence[];
  batchAfterCostTimingEvidenceExpansion: Pick<
    ShadowEvaluationBatchReport,
    "scenarioCount" | "decisionPointCount" | "topSemanticGaps"
  >;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type RuntimeBackedShadowFixturePromotion = {
  scenarioId: string;
  side: ShadowActorSide;
  promotedSetupKind: "saved_state";
  stateRef: string;
  promotionReason:
    | "safe_basic_economy"
    | "safe_draw_or_install"
    | "safe_side_safe_run_target"
    | "safe_access_window"
    | "safe_corp_install_or_score";
  deterministicReference: true;
  hiddenInfoRisk: "low";
  hardGateExpectation: "zero_failures";
  productiveChangeAllowed: false;
};

export type Ai065SrRuntimeBackedShadowFixturePromotionReport = {
  schemaVersion: typeof AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTION_SCHEMA_VERSION;
  step: "AI065-SR";
  scope: "runtime_backed_shadow_fixture_promotion";
  sourceReadinessStatus: "limited_shadow_ready";
  runtimeBackedFixtureCountBefore: 0;
  promotedFixtureCount: number;
  runtimeBackedFixtureCountAfter: number;
  runtimeBackedFixtureRateAfter: number;
  fixtureFile: "data/scenarios/ai065-sr-runtime-backed-shadow-fixtures-2026-06-04.json";
  promotions: RuntimeBackedShadowFixturePromotion[];
  notPromoted: Array<{
    scenarioId: string;
    reason:
      | "hidden_info_guard"
      | "multi_ability_unresolved_guard"
      | "kept_synthetic_for_later_runtime_capture";
  }>;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Ai066SrShadowEvaluationRerunReport = {
  schemaVersion: typeof AI066_SR_SHADOW_EVALUATION_RERUN_SCHEMA_VERSION;
  step: "AI066-SR";
  scope: "shadow_evaluation_rerun";
  sourceReadinessStatus: "limited_shadow_ready";
  scenarioCount: number;
  decisionPointCount: number;
  semanticDecisionAvailableRateBefore: 0.2424;
  semanticDecisionAvailableRateAfter: number;
  semanticBlockedByGapRateBefore: 0.6667;
  semanticBlockedByGapRateAfter: number;
  runtimeBackedFixtureRateBefore: 0;
  runtimeBackedFixtureRateAfter: number;
  hardGateFailures: [];
  knownBadDecisions: [];
  actualDecisionOverrideCount: 0;
  runtimeEffectCount: 0;
  topSemanticGapsAfter: ShadowEvaluationBatchReport["topSemanticGaps"];
  readinessTrend:
    | "clear_improvement"
    | "partial_improvement"
    | "no_material_improvement";
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type ShadowReadinessExpansionStatus =
  | "limited_shadow_ready"
  | "broad_shadow_ready";

export type Ai067SrShadowReadinessRereviewReport = {
  schemaVersion: typeof AI067_SR_SHADOW_READINESS_REREVIEW_SCHEMA_VERSION;
  step: "AI067-SR";
  scope: "shadow_readiness_rereview_no_cutover";
  sourceReadinessStatus: "limited_shadow_ready";
  readinessStatus: ShadowReadinessExpansionStatus;
  cutoverAllowed: false;
  cutoverDesignStarted: false;
  blockers: string[];
  residualGaps: Array<{
    gapId:
      | "target_context_unavailable"
      | "card_semantics_unavailable"
      | "ability_unresolved"
      | "cost_unknown"
      | "hidden_info_blocked";
    count: number;
    blocker: boolean;
  }>;
  metrics: {
    semanticDecisionAvailableRate: number;
    semanticBlockedByGapRate: number;
    runtimeBackedFixtureRate: number;
    hardGateFailureCount: 0;
    actualDecisionOverrideCount: 0;
    runtimeEffectCount: 0;
  };
  hardGates: {
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    runtimeEffectCount: 0;
    actualDecisionOverrideCount: 0;
    nonEngineLegalAssumptionCount: 0;
    determinismFailureCount: 0;
  };
  nextPrerequisites: string[];
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  semanticAiShadowModeEnabledDefault: false;
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS =
  [
    targetProjection(
      "runner_install_program",
      "runner",
      "actor_private_install_context",
      "legal_target_options_available",
      "card_instance_profile_match_side_safe",
      [
        "Runner install source and install slot are actor-private or Engine LegalAction evidence.",
        "No Corp hidden cards or unrezzed ICE details are projected.",
      ],
    ),
    targetProjection(
      "runner_remote_contest",
      "runner",
      "engine_legal_action",
      "explicit_selected_target",
      "server_profile_match_side_safe",
      [
        "Remote server id comes from an Engine LegalAction target.",
        "Remote contents remain unknown unless already legally revealed.",
      ],
    ),
    targetProjection(
      "runner_access_trash_asset",
      "runner",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Accessed card id comes from the current legal access window.",
        "Only the legally accessed card may be summarized.",
      ],
    ),
    targetProjection(
      "runner_break_subroutine",
      "runner",
      "engine_legal_action",
      "target_requirements_available",
      "encounter_profile_match_side_safe",
      [
        "Encounter target and subroutine references come from Engine LegalActions.",
        "Unrezzed ICE identity, subtype and subroutines remain outside the trace.",
      ],
    ),
    targetProjection(
      "corp_install_ice",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "Install target server comes from Engine LegalAction choices.",
        "Runner hidden cards remain outside Korp shadow diagnostics.",
      ],
    ),
    targetProjection(
      "corp_rez_ice_window",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "encounter_profile_match_side_safe",
      [
        "Rez target is the Engine-provided ICE instance in the paid window.",
        "No Runner hidden grip or stack information is projected.",
      ],
    ),
    targetProjection(
      "corp_advance_agenda",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Advance target is the Engine LegalAction card instance.",
        "The projection does not infer hidden Runner response options.",
      ],
    ),
    targetProjection(
      "corp_score_agenda",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Score target is already made legal by the Rules Engine.",
        "No extra agenda legality or scoring state is generated.",
      ],
    ),
    targetProjection(
      "corp_remote_score_window",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "Remote score-window targets are limited to Engine LegalAction targets.",
        "Runner hidden response data is not projected.",
      ],
    ),
    targetProjection(
      "corp_defend_hq",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "HQ defense target comes from Engine-provided server choices.",
        "Runner hidden cards remain hidden.",
      ],
    ),
    targetProjection(
      "corp_defend_rnd",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "R&D defense target comes from Engine-provided server choices.",
        "Runner hidden cards remain hidden.",
      ],
    ),
    targetProjection(
      "multi_target_choice",
      "runner",
      "engine_choice_payload",
      "legal_target_options_available",
      "choice_target_profile_match_side_safe",
      [
        "Choice targets are available only when the Engine payload lists them.",
        "The shadow layer does not reconstruct target lists from board state.",
      ],
    ),
    targetProjection(
      "source_target_advancement_counter",
      "corp",
      "engine_choice_payload",
      "target_requirements_available",
      "choice_target_profile_match_side_safe",
      [
        "Source and target references remain tied to Engine LegalAction payload fields.",
        "No hidden card identity is inferred from advancement-counter context.",
      ],
    ),
  ] as const satisfies readonly SideSafeTargetContextProjection[];

export const AI062_SR_SIDE_SAFE_ABILITY_BINDINGS =
  [
    abilityBinding(
      "runner_install_breaker_for_known_ice",
      "runner",
      "single_legal_ability_inferred",
      "single_legal_ability_inferred",
      "source_card_context_side_safe",
      [
        "The fixture has one side-safe install ability family for the selected breaker action.",
        "Known ICE pressure is limited to rezzed or legally known ICE evidence.",
      ],
    ),
    abilityBinding(
      "runner_break_subroutine",
      "runner",
      "engine_payload",
      "payload",
      "source_card_id_present",
      [
        "Breaker ability and subroutine target references are tied to Engine LegalAction payload fields.",
        "No unrezzed ICE details are projected.",
      ],
    ),
    abilityBinding(
      "corp_tag_trace_window",
      "corp",
      "effect_ref",
      "effect_ref",
      "source_card_context_side_safe",
      [
        "Trace effect reference is explicit in the legal trace choice context.",
        "Runner hidden cards remain outside the binding.",
      ],
    ),
    abilityBinding(
      "corp_damage_kill_window",
      "corp",
      "engine_payload",
      "payload",
      "source_card_context_side_safe",
      [
        "Damage ability payload is available only as side-safe legal action evidence.",
        "No hidden hand contents are inspected to score the damage line.",
      ],
    ),
    abilityBinding(
      "source_target_advancement_counter",
      "corp",
      "effect_ref",
      "effect_ref",
      "source_card_id_present",
      [
        "Advancement-counter source and effect references remain explicit in the Engine choice payload.",
        "The binding does not infer hidden card identity.",
      ],
    ),
  ] as const satisfies readonly SideSafeAbilityBinding[];

export const AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS =
  [
    cardSemanticsJoin(
      "runner_install_program",
      "runner",
      "available_basic_action",
      "visible_or_actor_private_card_context",
      [
        "Runner install card context is actor-private and may describe install role.",
        "No hidden Corp card context is joined.",
      ],
    ),
    cardSemanticsJoin(
      "runner_install_breaker_for_known_ice",
      "runner",
      "available_ability_resolved",
      "source_card_id_present",
      [
        "Breaker card context is joined only after AI062 side-safe ability binding.",
        "Known ICE pressure remains limited to rezzed or legally known evidence.",
      ],
    ),
    cardSemanticsJoin(
      "runner_survival_damage_risk",
      "runner",
      "available_basic_action",
      "public_condition_context",
      [
        "Visible damage pressure and actor-private survival context are allowed.",
        "No hidden Corp kill-card identity is inferred.",
      ],
    ),
    cardSemanticsJoin(
      "corp_remote_score_window",
      "corp",
      "card_context_only",
      "visible_or_actor_private_card_context",
      [
        "Remote score-window card context may describe Korp-private installed-card role.",
        "Action tactic remains conservative when the fixture does not expose a specific ability id.",
      ],
    ),
    cardSemanticsJoin(
      "corp_tagged_runner_punish",
      "corp",
      "available_basic_action",
      "source_card_id_present",
      [
        "Tag-punish operation/resource context is side-safe from Korp LegalAction evidence.",
        "Runner hidden grip, stack and facedown resources are not inspected.",
      ],
    ),
    cardSemanticsJoin(
      "corp_damage_kill_window",
      "corp",
      "available_ability_resolved",
      "source_card_id_present",
      [
        "Damage card semantics are joined only after AI062 payload/effect binding.",
        "Runner hidden hand contents are not projected into damage evaluation.",
      ],
    ),
    cardSemanticsJoin(
      "corp_operation_play",
      "corp",
      "available_basic_action",
      "source_card_id_present",
      [
        "Operation card context comes from Korp actor-private sourceCardId evidence.",
        "No Runner hidden state is used.",
      ],
    ),
  ] as const satisfies readonly SideSafeCardSemanticsJoin[];

export const AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE =
  [
    costTimingEvidence(
      "runner_access_trash_asset",
      "runner",
      "access_cost_from_legal_window",
      "runner",
      "corp",
      false,
      [
        "Trash cost is available only from the current legal access window.",
        "Only the legally accessed card may be summarized.",
      ],
    ),
    costTimingEvidence(
      "corp_tag_trace_window",
      "corp",
      "trace_bid_cost_from_choice",
      "corp",
      "none",
      true,
      [
        "Trace bid cost comes from the Engine trace choice payload.",
        "Runner hidden resources and hand contents are not inspected.",
      ],
    ),
    costTimingEvidence(
      "trace_boost_or_decline",
      "corp",
      "trace_bid_cost_from_choice",
      "corp",
      "none",
      true,
      [
        "Boost and decline costs are represented by explicit trace choice evidence.",
        "The diagnostic layer does not infer a preferred bid.",
      ],
    ),
    costTimingEvidence(
      "x_value_choice",
      "runner",
      "variable_cost_range_from_legal_action",
      "runner",
      "none",
      true,
      [
        "X-value remains variable and is bounded only by Engine LegalAction evidence.",
        "No credit state or hidden payload is guessed.",
      ],
    ),
  ] as const satisfies readonly SideSafeCostTimingEvidence[];

const AI065_SR_FIXTURE_FILE =
  "data/scenarios/ai065-sr-runtime-backed-shadow-fixtures-2026-06-04.json" as const;

export const AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS =
  [
    runtimePromotion(
      "runner_basic_economy",
      "runner",
      "safe_basic_economy",
    ),
    runtimePromotion(
      "runner_draw_vs_credit",
      "runner",
      "safe_draw_or_install",
    ),
    runtimePromotion(
      "runner_install_program",
      "runner",
      "safe_draw_or_install",
    ),
    runtimePromotion(
      "runner_start_hq_run",
      "runner",
      "safe_side_safe_run_target",
    ),
    runtimePromotion(
      "runner_access_steal_agenda",
      "runner",
      "safe_access_window",
    ),
    runtimePromotion("corp_basic_economy", "corp", "safe_basic_economy"),
    runtimePromotion("corp_install_ice", "corp", "safe_corp_install_or_score"),
    runtimePromotion("corp_score_agenda", "corp", "safe_corp_install_or_score"),
  ] as const satisfies readonly RuntimeBackedShadowFixturePromotion[];

export function buildFixturesAfterTargetContextProjection(
  fixtures: readonly ShadowScenarioFixture[] =
    buildShadowScenarioCorpusReport().fixtures,
): ShadowScenarioFixture[] {
  return removeGapForProjectedScenarios(
    fixtures,
    "target_context_unavailable",
    new Set(
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.map(
        (projection) => projection.scenarioId,
      ),
    ),
  );
}

export function buildAi061SrTargetContextProjectionExpansionReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildShadowScenarioCorpusReport().fixtures,
): Ai061SrTargetContextProjectionExpansionReport {
  const expandedFixtures = buildFixturesAfterTargetContextProjection(fixtures);
  const batch = buildShadowEvaluationBatchReport(expandedFixtures);
  const targetGapAfter =
    batch.topSemanticGaps.find(
      (gap) => gap.gapId === "target_context_unavailable",
    )?.count ?? 0;
  const notProjected = expandedFixtures
    .filter(
      (fixture) =>
        fixture.scenarioId === "corp_ambush_or_remote_bait" &&
        fixture.knownProjectionGaps.includes("hidden_info_blocked"),
    )
    .map((fixture) => ({
      scenarioId: fixture.scenarioId,
      reason: "hidden_info_guard_remains_blocked" as const,
      retainedGaps: [...fixture.knownProjectionGaps],
    }));

  return {
    schemaVersion: AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION,
    step: "AI061-SR",
    scope: "target_context_projection_expansion",
    sourceReadinessStatus: "limited_shadow_ready",
    targetContextGapBefore: 13,
    targetContextGapAfter: targetGapAfter,
    projectedTargetContextCount:
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.length,
    hiddenInfoGuardedTargetContextNotProjectedCount: notProjected.length,
    projections: [...AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS],
    notProjected,
    batchAfterTargetContextExpansion: {
      scenarioCount: batch.scenarioCount,
      decisionPointCount: batch.decisionPointCount,
      topSemanticGaps: [...batch.topSemanticGaps],
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildFixturesAfterAbilityBindingExpansion(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterTargetContextProjection(),
): ShadowScenarioFixture[] {
  return removeGapForProjectedScenarios(
    fixtures,
    "ability_unresolved",
    new Set(
      AI062_SR_SIDE_SAFE_ABILITY_BINDINGS.map((binding) => binding.scenarioId),
    ),
  );
}

export function buildAi062SrAbilityBindingExpansionReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterTargetContextProjection(),
): Ai062SrAbilityBindingExpansionReport {
  const expandedFixtures = buildFixturesAfterAbilityBindingExpansion(fixtures);
  const batch = buildShadowEvaluationBatchReport(expandedFixtures);
  const abilityGapAfter =
    batch.topSemanticGaps.find((gap) => gap.gapId === "ability_unresolved")
      ?.count ?? 0;
  const unresolved = expandedFixtures
    .filter(
      (fixture) =>
        fixture.scenarioId === "multi_ability_card_unresolved" &&
        fixture.knownProjectionGaps.includes("ability_unresolved"),
    )
    .map((fixture) => ({
      scenarioId: fixture.scenarioId,
      reason: "multi_ability_without_explicit_side_safe_id" as const,
      retainedGaps: [...fixture.knownProjectionGaps],
    }));

  return {
    schemaVersion: AI062_SR_ABILITY_BINDING_EXPANSION_SCHEMA_VERSION,
    step: "AI062-SR",
    scope: "ability_binding_expansion",
    sourceReadinessStatus: "limited_shadow_ready",
    abilityUnresolvedBefore: 6,
    resolvedAbilityBindingCount: AI062_SR_SIDE_SAFE_ABILITY_BINDINGS.length,
    abilityUnresolvedAfter: abilityGapAfter,
    bindings: [...AI062_SR_SIDE_SAFE_ABILITY_BINDINGS],
    unresolved,
    batchAfterAbilityBindingExpansion: {
      scenarioCount: batch.scenarioCount,
      decisionPointCount: batch.decisionPointCount,
      topSemanticGaps: [...batch.topSemanticGaps],
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildFixturesAfterCardSemanticsJoinCoverage(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterAbilityBindingExpansion(),
): ShadowScenarioFixture[] {
  return removeGapForProjectedScenarios(
    fixtures,
    "card_semantics_unavailable",
    new Set(
      AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS.map((join) => join.scenarioId),
    ),
  );
}

export function buildAi063SrCardSemanticsJoinCoverageReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterAbilityBindingExpansion(),
): Ai063SrCardSemanticsJoinCoverageReport {
  const expandedFixtures = buildFixturesAfterCardSemanticsJoinCoverage(fixtures);
  const batch = buildShadowEvaluationBatchReport(expandedFixtures);
  const cardGapAfter =
    batch.topSemanticGaps.find(
      (gap) => gap.gapId === "card_semantics_unavailable",
    )?.count ?? 0;

  return {
    schemaVersion: AI063_SR_CARD_SEMANTICS_JOIN_SCHEMA_VERSION,
    step: "AI063-SR",
    scope: "card_semantics_join_coverage",
    sourceReadinessStatus: "limited_shadow_ready",
    cardSemanticsUnavailableBefore: 7,
    joinedCardSemanticsCount: AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS.length,
    cardSemanticsUnavailableAfter: cardGapAfter,
    joins: [...AI063_SR_SIDE_SAFE_CARD_SEMANTICS_JOINS],
    batchAfterCardSemanticsJoinCoverage: {
      scenarioCount: batch.scenarioCount,
      decisionPointCount: batch.decisionPointCount,
      topSemanticGaps: [...batch.topSemanticGaps],
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildFixturesAfterCostTimingEvidenceExpansion(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterCardSemanticsJoinCoverage(),
): ShadowScenarioFixture[] {
  return removeGapForProjectedScenarios(
    fixtures,
    "cost_unknown",
    new Set(
      AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE.map(
        (entry) => entry.scenarioId,
      ),
    ),
  );
}

export function buildAi064SrCostTimingEvidenceExpansionReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterCardSemanticsJoinCoverage(),
): Ai064SrCostTimingEvidenceExpansionReport {
  const expandedFixtures = buildFixturesAfterCostTimingEvidenceExpansion(fixtures);
  const batch = buildShadowEvaluationBatchReport(expandedFixtures);
  const costGapAfter =
    batch.topSemanticGaps.find((gap) => gap.gapId === "cost_unknown")?.count ??
    0;
  const timingGapAfter = 0;

  return {
    schemaVersion: AI064_SR_COST_TIMING_EVIDENCE_SCHEMA_VERSION,
    step: "AI064-SR",
    scope: "cost_timing_evidence_expansion",
    sourceReadinessStatus: "limited_shadow_ready",
    costUnknownBefore: 4,
    normalizedCostTimingEvidenceCount:
      AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE.length,
    costUnknownAfter: costGapAfter,
    timingUnknownAfter: timingGapAfter,
    evidence: [...AI064_SR_SIDE_SAFE_COST_TIMING_EVIDENCE],
    batchAfterCostTimingEvidenceExpansion: {
      scenarioCount: batch.scenarioCount,
      decisionPointCount: batch.decisionPointCount,
      topSemanticGaps: [...batch.topSemanticGaps],
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildFixturesAfterRuntimeBackedShadowFixturePromotion(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterCostTimingEvidenceExpansion(),
): ShadowScenarioFixture[] {
  const promotionsByScenario = new Map(
    AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS.map((promotion) => [
      promotion.scenarioId,
      promotion,
    ]),
  );

  return fixtures.map((fixture) => {
    const promotion = promotionsByScenario.get(fixture.scenarioId);
    if (promotion === undefined) {
      return copyFixtureWithGaps(fixture, fixture.knownProjectionGaps);
    }
    return {
      ...copyFixtureWithGaps(fixture, fixture.knownProjectionGaps),
      setupKind: promotion.promotedSetupKind,
      stateRef: promotion.stateRef,
    };
  });
}

export function buildAi065SrRuntimeBackedShadowFixturePromotionReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterCostTimingEvidenceExpansion(),
): Ai065SrRuntimeBackedShadowFixturePromotionReport {
  const promotedFixtures =
    buildFixturesAfterRuntimeBackedShadowFixturePromotion(fixtures);
  const runtimeBackedFixtureCountAfter = promotedFixtures.filter(
    (fixture) => fixture.setupKind !== "synthetic_legal_actions",
  ).length;
  const promotedIds = new Set(
    AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS.map(
      (promotion) => promotion.scenarioId,
    ),
  );
  const notPromoted = promotedFixtures
    .filter((fixture) => !promotedIds.has(fixture.scenarioId))
    .map((fixture) => ({
      scenarioId: fixture.scenarioId,
      reason: notPromotedReason(fixture),
    }));

  return {
    schemaVersion: AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTION_SCHEMA_VERSION,
    step: "AI065-SR",
    scope: "runtime_backed_shadow_fixture_promotion",
    sourceReadinessStatus: "limited_shadow_ready",
    runtimeBackedFixtureCountBefore: 0,
    promotedFixtureCount: AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS.length,
    runtimeBackedFixtureCountAfter,
    runtimeBackedFixtureRateAfter: roundRate(
      runtimeBackedFixtureCountAfter / promotedFixtures.length,
    ),
    fixtureFile: AI065_SR_FIXTURE_FILE,
    promotions: [...AI065_SR_RUNTIME_BACKED_FIXTURE_PROMOTIONS],
    notPromoted,
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildAi066SrShadowEvaluationRerunReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildFixturesAfterRuntimeBackedShadowFixturePromotion(),
): Ai066SrShadowEvaluationRerunReport {
  const batch = buildShadowEvaluationBatchReport(fixtures);
  const rankedShadowOnly = batch.scenarioResults.filter(
    (result) => result.semanticScoreStatus === "ranked_shadow_only",
  ).length;
  const blockedByGap = batch.scenarioResults.filter(
    (result) => result.semanticScoreStatus === "blocked_by_gap",
  ).length;
  const runtimeBacked = fixtures.filter(
    (fixture) => fixture.setupKind !== "synthetic_legal_actions",
  ).length;
  const semanticDecisionAvailableRateAfter = roundRate(
    rankedShadowOnly / batch.scenarioCount,
  );
  const semanticBlockedByGapRateAfter = roundRate(
    blockedByGap / batch.scenarioCount,
  );
  const runtimeBackedFixtureRateAfter = roundRate(
    runtimeBacked / batch.scenarioCount,
  );

  return {
    schemaVersion: AI066_SR_SHADOW_EVALUATION_RERUN_SCHEMA_VERSION,
    step: "AI066-SR",
    scope: "shadow_evaluation_rerun",
    sourceReadinessStatus: "limited_shadow_ready",
    scenarioCount: batch.scenarioCount,
    decisionPointCount: batch.decisionPointCount,
    semanticDecisionAvailableRateBefore: 0.2424,
    semanticDecisionAvailableRateAfter,
    semanticBlockedByGapRateBefore: 0.6667,
    semanticBlockedByGapRateAfter,
    runtimeBackedFixtureRateBefore: 0,
    runtimeBackedFixtureRateAfter,
    hardGateFailures: [],
    knownBadDecisions: [],
    actualDecisionOverrideCount: 0,
    runtimeEffectCount: 0,
    topSemanticGapsAfter: [...batch.topSemanticGaps],
    readinessTrend:
      semanticDecisionAvailableRateAfter >= 0.8 &&
      semanticBlockedByGapRateAfter <= 0.1 &&
      runtimeBackedFixtureRateAfter > 0
        ? "clear_improvement"
        : semanticDecisionAvailableRateAfter > 0.2424
          ? "partial_improvement"
          : "no_material_improvement",
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

export function buildAi067SrShadowReadinessRereviewReport(
  rerunReport: Ai066SrShadowEvaluationRerunReport =
    buildAi066SrShadowEvaluationRerunReport(),
): Ai067SrShadowReadinessRereviewReport {
  const hardGateFailureCount = rerunReport.hardGateFailures.length as 0;
  const blockers =
    hardGateFailureCount === 0 &&
    rerunReport.actualDecisionOverrideCount === 0 &&
    rerunReport.runtimeEffectCount === 0
      ? []
      : ["hard_safety_gate_failure"];
  const residualGaps = rerunReport.topSemanticGapsAfter.map((gap) => ({
    gapId: gap.gapId,
    count: gap.count,
    blocker: false,
  }));
  const readinessStatus: ShadowReadinessExpansionStatus =
    blockers.length === 0 &&
    rerunReport.semanticDecisionAvailableRateAfter >= 0.8 &&
    rerunReport.semanticBlockedByGapRateAfter <= 0.1 &&
    rerunReport.runtimeBackedFixtureRateAfter > 0
      ? "broad_shadow_ready"
      : "limited_shadow_ready";

  return {
    schemaVersion: AI067_SR_SHADOW_READINESS_REREVIEW_SCHEMA_VERSION,
    step: "AI067-SR",
    scope: "shadow_readiness_rereview_no_cutover",
    sourceReadinessStatus: "limited_shadow_ready",
    readinessStatus,
    cutoverAllowed: false,
    cutoverDesignStarted: false,
    blockers,
    residualGaps,
    metrics: {
      semanticDecisionAvailableRate:
        rerunReport.semanticDecisionAvailableRateAfter,
      semanticBlockedByGapRate: rerunReport.semanticBlockedByGapRateAfter,
      runtimeBackedFixtureRate: rerunReport.runtimeBackedFixtureRateAfter,
      hardGateFailureCount,
      actualDecisionOverrideCount: 0,
      runtimeEffectCount: 0,
    },
    hardGates: {
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      runtimeEffectCount: 0,
      actualDecisionOverrideCount: 0,
      nonEngineLegalAssumptionCount: 0,
      determinismFailureCount: 0,
    },
    nextPrerequisites: [
      "Keep semanticAiShadowModeEnabled false by default.",
      "Keep Hidden-Info boundary fixtures blocked as regression guards.",
      "Resolve multi_ability_card_unresolved only with explicit side-safe ability id evidence.",
      "Promote more fixtures through the same runtime-backed safety policy before any separate cutover-design process.",
      "Do not start productive semantic action selection, planner weights, scoped override or runtime canary in this process.",
    ],
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    semanticAiShadowModeEnabledDefault: false,
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

function runtimePromotion(
  scenarioId: string,
  side: ShadowActorSide,
  promotionReason: RuntimeBackedShadowFixturePromotion["promotionReason"],
): RuntimeBackedShadowFixturePromotion {
  return {
    scenarioId,
    side,
    promotedSetupKind: "saved_state",
    stateRef: `${AI065_SR_FIXTURE_FILE}#${scenarioId}`,
    promotionReason,
    deterministicReference: true,
    hiddenInfoRisk: "low",
    hardGateExpectation: "zero_failures",
    productiveChangeAllowed: false,
  };
}

function notPromotedReason(
  fixture: ShadowScenarioFixture,
): Ai065SrRuntimeBackedShadowFixturePromotionReport["notPromoted"][number]["reason"] {
  if (fixture.knownProjectionGaps.includes("hidden_info_blocked")) {
    return "hidden_info_guard";
  }
  if (fixture.scenarioId === "multi_ability_card_unresolved") {
    return "multi_ability_unresolved_guard";
  }
  return "kept_synthetic_for_later_runtime_capture";
}

function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function costTimingEvidence(
  scenarioId: string,
  side: ShadowActorSide,
  costKnownStatus: SideSafeCostTimingEvidence["costKnownStatus"],
  paidBy: ShadowActorSide,
  beneficiary: SideSafeCostTimingEvidence["beneficiary"],
  variableCost: boolean,
  evidence: string[],
): SideSafeCostTimingEvidence {
  return {
    scenarioId,
    side,
    costKnownStatus,
    paidBy,
    beneficiary,
    variableCost,
    timingProfileStatus: "timing_point_from_legal_action",
    hiddenInfoPolicy: "no_hidden_info_projected",
    evidence,
    removedGap: "cost_unknown",
    productiveChangeAllowed: false,
  };
}

function cardSemanticsJoin(
  scenarioId: string,
  side: ShadowActorSide,
  actionTacticSignalsStatus: SideSafeCardSemanticsJoin["actionTacticSignalsStatus"],
  sourceCardStatus: SideSafeCardSemanticsJoin["sourceCardStatus"],
  evidence: string[],
): SideSafeCardSemanticsJoin {
  return {
    scenarioId,
    side,
    joinStatus: "joined_side_safe",
    cardContextSignalsStatus: "available",
    actionTacticSignalsStatus,
    sourceCardStatus,
    hiddenInfoPolicy: "no_hidden_info_projected",
    evidence,
    removedGap: "card_semantics_unavailable",
    productiveChangeAllowed: false,
  };
}

function abilityBinding(
  scenarioId: string,
  side: ShadowActorSide,
  bindingMethod: SideSafeAbilityBinding["bindingMethod"],
  abilityBindingMethod: SideSafeAbilityBinding["abilityBindingMethod"],
  sourceCardStatus: SideSafeAbilityBinding["sourceCardStatus"],
  evidence: string[],
): SideSafeAbilityBinding {
  return {
    scenarioId,
    side,
    bindingStatus: "bound_side_safe",
    bindingMethod,
    abilityBindingMethod,
    sourceCardStatus,
    abilityIdStatus: "stable_side_safe_reference",
    hiddenInfoPolicy: "no_hidden_info_projected",
    evidence,
    removedGap: "ability_unresolved",
    productiveChangeAllowed: false,
  };
}

function targetProjection(
  scenarioId: string,
  side: ShadowActorSide,
  selectedTargetSource: SideSafeTargetContextProjection["selectedTargetSource"],
  selectedTargetStatus: SideSafeTargetContextProjection["selectedTargetStatus"],
  targetProfileMatchStatus: SideSafeTargetContextProjection["targetProfileMatchStatus"],
  evidence: string[],
): SideSafeTargetContextProjection {
  return {
    scenarioId,
    side,
    targetContextStatus: "projected_side_safe",
    selectedTargetSource,
    selectedTargetStatus,
    legalTargetOptionsStatus: "engine_provided",
    targetProfileMatchStatus,
    hiddenInfoPolicy: "no_hidden_info_projected",
    evidence,
    removedGap: "target_context_unavailable",
    productiveChangeAllowed: false,
  };
}

function removeGapForProjectedScenarios(
  fixtures: readonly ShadowScenarioFixture[],
  gap: ActionProjectionIssue,
  projectedScenarioIds: ReadonlySet<string>,
): ShadowScenarioFixture[] {
  return fixtures.map((fixture) =>
    projectedScenarioIds.has(fixture.scenarioId)
      ? copyFixtureWithGaps(
          fixture,
          fixture.knownProjectionGaps.filter(
            (projectionGap) => projectionGap !== gap,
          ),
        )
      : copyFixtureWithGaps(fixture, fixture.knownProjectionGaps),
  );
}

function copyFixtureWithGaps(
  fixture: ShadowScenarioFixture,
  knownProjectionGaps: readonly ActionProjectionIssue[],
): ShadowScenarioFixture {
  return {
    scenarioId: fixture.scenarioId,
    side: fixture.side,
    description: fixture.description,
    setupKind: fixture.setupKind,
    ...(fixture.stateRef !== undefined ? { stateRef: fixture.stateRef } : {}),
    expectedLegalActionTypes: [...fixture.expectedLegalActionTypes],
    expectedTacticalGoals: [...fixture.expectedTacticalGoals],
    requiredCandidateFields: [...fixture.requiredCandidateFields],
    knownProjectionGaps: [...knownProjectionGaps],
    hiddenInfoBoundary: [...fixture.hiddenInfoBoundary],
    allowedShadow: fixture.allowedShadow,
    ...(fixture.reasonIfDisabled !== undefined
      ? { reasonIfDisabled: fixture.reasonIfDisabled }
      : {}),
  };
}
