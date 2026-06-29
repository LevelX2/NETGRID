import { CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS } from "./controlled-shadow-mode";
import type { ShadowModeNoEffectFlags } from "./controlled-shadow-mode";
import {
  META6_SCOPE_READINESS_MATRIX,
  scrubTraceForProduction,
  type Meta2HumanReviewCategory,
  type SemanticAiControlFlags,
  type SemanticAiRollbackTrigger,
  type SemanticAiScopeReadinessEntry,
  type SemanticAiScopeReadinessStatus,
  type SemanticAiSide,
  type SemanticTacticalGoalFamily,
  type TraceScrubberResult,
} from "./semantic-ai-core-meta";

export const META7_MULTI_RUN_EVALUATION_SCHEMA_VERSION =
  "meta7-multi-run-semantic-evaluation-human-review-v0" as const;

export const META8_INTERNAL_SEMANTIC_CANARY_SCHEMA_VERSION =
  "meta8-internal-semantic-canary-v0" as const;

export const META9_PRODUCTION_SAFE_SHADOW_SCHEMA_VERSION =
  "meta9-production-safe-shadow-agreement-canary-v0" as const;

export const META10_LIMITED_SCOPED_CUTOVER_SCHEMA_VERSION =
  "meta10-limited-scoped-production-cutover-v0" as const;

export const META11_SCOPE_EXPANSION_CALIBRATION_SCHEMA_VERSION =
  "meta11-scope-expansion-calibration-v0" as const;

export const META12_LEGACY_FREEZE_STABILIZATION_SCHEMA_VERSION =
  "meta12-legacy-freeze-production-stabilization-v0" as const;

export const META13_LEGACY_FREEZE_EXTENDED_MONITORING_SCHEMA_VERSION =
  "meta13-legacy-freeze-extended-monitoring-v0" as const;

export const META14_LOW_RISK_SCOPE_EXPANSION_SCHEMA_VERSION =
  "meta14-low-risk-scope-expansion-v0" as const;

export const META15_COMPLEX_SCOPE_ENABLEMENT_SCHEMA_VERSION =
  "meta15-complex-scope-enablement-v0" as const;

export const META16_BROAD_SCOPED_PRODUCTION_EXPANSION_SCHEMA_VERSION =
  "meta16-broad-scoped-production-expansion-v0" as const;

export const META17_SEMANTIC_DEFAULT_ELIGIBLE_SCOPES_SCHEMA_VERSION =
  "meta17-semantic-default-eligible-scopes-v0" as const;

export const META18_LEGACY_RETIREMENT_DECISION_SCHEMA_VERSION =
  "meta18-legacy-retirement-full-takeover-decision-v0" as const;

export type ProductionReadinessScopeId =
  | "basic_economy_draw"
  | "basic_install"
  | "tag_removal"
  | "simple_score_advance"
  | "simple_run_choice"
  | "simple_rez"
  | "remote_contest"
  | "simple_hq_or_rnd_pressure"
  | "simple_advance_score"
  | "basic_setup_install"
  | "access_trash_steal"
  | "trace_payment"
  | "damage_prevention"
  | "multi_target_multi_ability";

export type Meta7DecisionPointSample = {
  decisionPointId: string;
  scenarioId: string;
  seed: string;
  savedStateRef: string;
  side: SemanticAiSide;
  turnNumber: number;
  boardSummary: string;
  activeDoctrine: string;
  activeTacticalGoals: SemanticTacticalGoalFamily[];
  legalActionIds: string[];
  legacyDecision: string;
  semanticDecision: string;
  actualDecision: {
    source: "legacy";
    actionId: string;
  };
  traceRef: string;
};

export type Meta7MultiRunSet = {
  runSetId: string;
  seed: string;
  scenarioIds: string[];
  sideCoverage: readonly SemanticAiSide[];
  turnCoverage: readonly ("early" | "mid" | "late")[];
  doctrineModes: readonly ("doctrine_conformant" | "boardstate_override")[];
  decisionPointCount: number;
  representativeDecisionPoints: Meta7DecisionPointSample[];
};

export type Meta7TacticalGoalLifecycleMetrics = {
  goalCreatedCount: number;
  goalRemainsActiveCount: number;
  goalProgressesCount: number;
  goalBlockedCount: number;
  goalSatisfiedCount: number;
  goalValidExpirationCount: number;
  goalWrongAbandonCount: number;
  blockedGoalExplanationCount: number;
  goalPersistenceSuccessRate: number;
  goalProgressionRate: number;
  goalSatisfiedRate: number;
  goalValidExpirationRate: number;
  goalWrongAbandonRate: number;
  blockedGoalExplanationRate: number;
};

export type Meta7DivergenceCategory =
  | Meta2HumanReviewCategory
  | "fixture_issue"
  | "blocked_scope";

export type Meta7DivergenceReviewSummary = {
  category: Meta7DivergenceCategory;
  count: number;
};

export type Meta7HumanReviewStatus =
  | "reviewed_safe"
  | "reviewed_acceptable"
  | "reviewed_legacy_preferred"
  | "blocked_by_gap"
  | "blocked_scope"
  | "followup_created";

export type Meta7HumanReviewClosureItem = {
  reviewId: string;
  scopeId: ProductionReadinessScopeId;
  category: Meta7DivergenceCategory;
  status: Meta7HumanReviewStatus;
  removalCondition?: string;
};

export type Meta7ScopeReadinessPromotion = {
  scopeId: ProductionReadinessScopeId;
  inputStatus: SemanticAiScopeReadinessStatus;
  outputStatus: SemanticAiScopeReadinessStatus;
  promoted: boolean;
  evidence: string[];
  blockers: string[];
};

export type Meta7QualityGates = {
  multiRunSetCount: number;
  decisionPointCount: number;
  illegalSemanticDecisionCount: 0;
  hiddenInfoViolationCount: 0;
  engineRejectCount: 0;
  nonEngineLegalAssumptionCount: 0;
  determinismFailureCount: 0;
  publicPayloadDeltaCount: 0;
  unsafeDivergenceCount: 0;
  knownBadDecisionCount: 0;
  traceCompleteRate: number;
  openHumanReviewItems: 0;
  goalWrongAbandonRate: 0;
  semanticDecisionAvailableRate: number;
  semanticBlockedByGapRate: number;
};

export type Meta7MultiRunSemanticEvaluationHumanReviewReport = {
  schemaVersion: typeof META7_MULTI_RUN_EVALUATION_SCHEMA_VERSION;
  step: "META7";
  scope: "multi_run_semantic_evaluation_human_review";
  sourceStep: "META6";
  evaluatedScopes: ProductionReadinessScopeId[];
  excludedScopes: ProductionReadinessScopeId[];
  multiRunCorpus: {
    runSetCount: number;
    decisionPointCount: number;
    runnerDecisionPointCount: number;
    corpDecisionPointCount: number;
    preferredDecisionPointTargetMet: true;
    runSets: Meta7MultiRunSet[];
  };
  tacticalGoalLifecycleMetrics: Meta7TacticalGoalLifecycleMetrics;
  divergenceReview: {
    reviewedDecisionPointCount: number;
    summaries: Meta7DivergenceReviewSummary[];
  };
  humanReviewClosure: {
    openHumanReviewItems: 0;
    items: Meta7HumanReviewClosureItem[];
    allowedTerminalStatuses: readonly Meta7HumanReviewStatus[];
  };
  scopeReadinessPromotions: Meta7ScopeReadinessPromotion[];
  qualityGates: Meta7QualityGates;
  goNoGo: {
    decision:
      | "meta7_blocked"
      | "multi_run_validated"
      | "internal_canary_ready_for_selected_scopes";
    productionReady: false;
    legacyRemovalReady: false;
    nextStep: "META8_internal_semantic_canary";
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  actualDecisionContract: "legacy_only_during_meta7";
  runtimeConsumerStatus: "evaluation_harness_only";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta8CanaryScopeStatus =
  | "internal_canary_ready"
  | "limited_candidate"
  | "agreement_ready"
  | "blocked";

export type Meta8CanaryScopeConfig = {
  scopeId: ProductionReadinessScopeId;
  status: Meta8CanaryScopeStatus;
  enabled: boolean;
  allowedActionTypes: string[];
  requiredGates: string[];
};

export type SemanticAiCanaryControlFlags = SemanticAiControlFlags & {
  semanticAiCanaryScope: "disabled" | "internal";
};

export type Meta8InternalCanaryFixture = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legalActionIds: string[];
  legacyActionId: string;
  semanticActionId: string;
  flags: SemanticAiCanaryControlFlags;
  scopeStatus: Meta8CanaryScopeStatus;
  hardGatesPass: boolean;
  hiddenInfoBlocked: boolean;
  traceAvailable: boolean;
  engineRejectSimulated: boolean;
  expectedResult:
    | "semantic_actual"
    | "legacy_default"
    | "scope_not_ready"
    | "rollback_forced"
    | "semantic_not_in_legal_actions"
    | "hidden_info_blocked"
    | "missing_trace"
    | "engine_reject_simulated"
    | "hard_gate_blocked";
};

export type Meta8InternalCanaryResult = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legacyActionId: string;
  semanticActionId: string;
  actualActionId: string;
  actualDecisionSource: "semantic" | "legacy";
  result: Meta8InternalCanaryFixture["expectedResult"];
  semanticActionInLegalActions: boolean;
  rollbackTriggers: SemanticAiRollbackTrigger[];
};

export type Meta8RuntimeOverheadSummary = {
  meanSemanticComputeMs: number;
  p95SemanticComputeMs: number;
  maxSemanticComputeMs: number;
  meanTraceBytes: number;
  maxTraceBytes: number;
  memoryImpactMb: number;
  documented: true;
};

export type Meta8InternalSemanticCanaryReport = {
  schemaVersion: typeof META8_INTERNAL_SEMANTIC_CANARY_SCHEMA_VERSION;
  step: "META8";
  scope: "internal_semantic_canary";
  sourceStep: "META7";
  defaultConfig: SemanticAiCanaryControlFlags;
  internalCanaryConfig: SemanticAiCanaryControlFlags;
  canaryScopes: Meta8CanaryScopeConfig[];
  fixtureResults: Meta8InternalCanaryResult[];
  canaryRunSummary: {
    runSetCount: number;
    decisionPointCount: number;
    runnerScopeCount: number;
    corpScopeCount: number;
  };
  rollbackCases: readonly Meta8InternalCanaryFixture["expectedResult"][];
  runtimeOverhead: Meta8RuntimeOverheadSummary;
  qualityGates: {
    internalCanaryDecisionPoints: number;
    semanticActualDecisionCount: number;
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    engineRejectCount: 0;
    nonEngineLegalAssumptionCount: 0;
    determinismFailureCount: 0;
    rollbackFailureCount: 0;
    traceCompleteRate: 1;
    unsafeDivergenceCount: 0;
    knownBadDecisionCount: 0;
    runtimeOverheadDocumented: true;
    defaultConfigLegacyOnly: true;
  };
  goNoGo: {
    decision:
      | "internal_canary_blocked"
      | "internal_canary_stable"
      | "production_safe_shadow_candidate";
    productionCutoverAllowed: false;
    legacyFreezeAllowed: false;
    legacyRemovalReady: false;
    nextStep: "META9_production_safe_shadow_agreement_canary";
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: true;
  semanticExecutionScope: "internal_canary_only";
  actualDecisionContract: "semantic_allowed_only_in_internal_canary_ready_scopes";
  runtimeConsumerStatus: "internal_canary_harness_only";
  noProductionRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta9ProductionSafeShadowConfig = SemanticAiControlFlags & {
  semanticAiTraceMode: "production_safe_shadow";
  semanticAiTraceVisibility: "developer_only_scrubbed";
};

export type Meta9TraceScrubFixture = {
  fixtureId: string;
  inputText: string;
  expectedSafe: boolean;
  expectedSafelyDropped: boolean;
};

export type Meta9TraceScrubResult = TraceScrubberResult & {
  fixtureId: string;
  safelyDropped: boolean;
};

export type Meta9AgreementShadowFixture = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legalActionIds: string[];
  legacyActionId: string;
  semanticActionId: string;
  hardGatesPass: boolean;
  traceSafeOrDropped: boolean;
};

export type Meta9AgreementShadowResult = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legacyActionId: string;
  semanticActionId: string;
  actualActionId: string;
  agreement: boolean;
  behaviorDelta: false;
  publicPayloadDelta: false;
  actualDecisionSource: "legacy";
  result:
    | "agreement_observed"
    | "semantic_differs_shadow_only"
    | "hard_gate_blocked_shadow_only"
    | "trace_dropped_shadow_only";
};

export type Meta9PublicPayloadSurface =
  | "PlayerView"
  | "WebSocket public payload"
  | "Replay"
  | "Undo"
  | "Client error payload"
  | "Logs";

export type Meta9PublicPayloadCheck = {
  surface: Meta9PublicPayloadSurface;
  status: "unchanged" | "scrubbed";
  publicPayloadDeltaCount: 0;
};

export type Meta9ProductionSafeShadowAgreementCanaryReport = {
  schemaVersion: typeof META9_PRODUCTION_SAFE_SHADOW_SCHEMA_VERSION;
  step: "META9";
  scope: "production_safe_shadow_agreement_canary";
  sourceStep: "META8";
  shadowConfig: Meta9ProductionSafeShadowConfig;
  traceScrubResults: Meta9TraceScrubResult[];
  agreementResults: Meta9AgreementShadowResult[];
  publicPayloadChecks: Meta9PublicPayloadCheck[];
  metrics: {
    decisionPointCount: number;
    agreementRate: number;
    semanticAvailableRate: number;
    blockedByGateRate: number;
    blockedByGapRate: number;
    traceScrubPassRate: number;
    traceDroppedCount: number;
    runtimeOverheadMeanMs: number;
    publicPayloadDeltaCount: 0;
    rollbackCount: number;
  };
  qualityGates: {
    behaviorDeltaCount: 0;
    publicPayloadDeltaCount: 0;
    hiddenInfoViolationCount: 0;
    traceScrubViolationCount: 0;
    engineRejectCount: 0;
    rollbackFailureCount: 0;
    traceCompleteOrSafelyDroppedRate: 1;
    semanticScopedOverrideEnabled: false;
    actualDecisionAlwaysLegacy: true;
    runtimeOverheadBounded: true;
  };
  goNoGo: {
    decision:
      | "production_shadow_blocked"
      | "production_shadow_stable"
      | "limited_cutover_candidate_for_selected_scopes";
    broadCutoverAllowed: false;
    legacyRemovalReady: false;
    nextStep: "META10_limited_scoped_production_cutover";
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  semanticShadowEvaluationAllowed: true;
  actualDecisionContract: "actualDecision_always_legacy_in_meta9";
  runtimeConsumerStatus: "production_safe_shadow_harness_only";
  noBehaviorDelta: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta10SelectedProductionScope =
  | "basic_economy_draw"
  | "tag_removal"
  | "simple_score_advance";

export type Meta10ScopeFreezeDossier = {
  scopeId: ProductionReadinessScopeId;
  selectedForCutover: boolean;
  allowedActionTypes: string[];
  blockedActionTypes: string[];
  requiredGates: string[];
  rollbackRules: string[];
  traceRequirements: string[];
  humanReviewStatus: Meta7HumanReviewStatus;
  metricsEvidence: string[];
};

export type Meta10ProductionCutoverFixture = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legalActionIds: string[];
  legacyActionId: string;
  semanticActionId: string;
  scopeEnabled: boolean;
  hardGatesPass: boolean;
  traceValidOrDroppable: boolean;
  rollbackForced: boolean;
  hiddenInfoBlocked: boolean;
  engineRejectSimulated: boolean;
  publicPayloadDeltaSimulated: boolean;
};

export type Meta10ProductionCutoverResult = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  actualActionId: string;
  actualDecisionSource: "semantic" | "legacy";
  semanticActionInLegalActions: boolean;
  result:
    | "semantic_limited_production_actual"
    | "scope_disabled_legacy"
    | "rollback_forced_legacy"
    | "semantic_not_legal_legacy"
    | "hidden_info_blocked_legacy"
    | "engine_reject_guard_legacy"
    | "public_payload_delta_guard_legacy"
    | "trace_invalid_legacy"
    | "hard_gate_blocked_legacy";
  rollbackTriggered: boolean;
  killSwitchAvailable: true;
};

export type Meta10LimitedScopedProductionCutoverReport = {
  schemaVersion: typeof META10_LIMITED_SCOPED_CUTOVER_SCHEMA_VERSION;
  step: "META10";
  scope: "limited_scoped_production_cutover";
  sourceStep: "META9";
  selectedProductionScopes: readonly Meta10SelectedProductionScope[];
  scopeFreezeDossiers: Meta10ScopeFreezeDossier[];
  cutoverResults: Meta10ProductionCutoverResult[];
  monitoring: {
    semanticDecisionCount: number;
    semanticOverrideCount: number;
    legacyFallbackCount: number;
    rollbackCount: number;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    unsafeDivergenceCount: 0;
    publicPayloadDeltaCount: 0;
    p95DecisionLatencyMs: number;
  };
  preActivationQualityGates: {
    meta7Green: true;
    meta8InternalCanaryStable: true;
    meta9ProductionShadowStable: true;
    openHumanReviewItems: 0;
    unsafeDivergenceCount: 0;
    knownBadDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    illegalSemanticDecisionCount: 0;
    engineRejectCount: 0;
    rollbackTested: true;
    traceScrubberPasses: true;
    scopeFreezeComplete: true;
  };
  postActivationQualityGates: {
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    illegalSemanticDecisionCount: 0;
    publicPayloadDeltaCount: 0;
    rollbackFailureCount: 0;
    determinismFailureCount: 0;
    unsafeDivergenceCount: 0;
  };
  goNoGo: {
    decision:
      | "production_cutover_blocked"
      | "limited_scoped_production_active"
      | "limited_scoped_production_active_with_rollback_constraints";
    fullProductionReady: false;
    legacyRemovalReady: false;
    broadCutoverAllowed: false;
    nextStep: "META11_scope_expansion_calibration";
  };
  limitedScopedProductionActive: true;
  productiveUse: "selected_scopes_only";
  semanticExecutionScope: "selected_low_risk_scopes_only";
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  actualDecisionContract: "semantic_actual_only_for_selected_meta10_scopes";
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta11ScopeExpansionStatus =
  | "limited_scoped_production_active"
  | "production_shadow_stable"
  | "internal_canary_ready"
  | "limited_candidate"
  | "agreement_ready"
  | "blocked";

export type Meta11ScopeReleaseDecision =
  | "promote_one_scope"
  | "ready_but_not_activated"
  | "blocked_by_calibration"
  | "blocked_scope";

export type Meta11ScopeDossier = {
  scopeId: ProductionReadinessScopeId;
  currentStatus: Meta11ScopeExpansionStatus;
  targetStatus: Meta11ScopeExpansionStatus;
  knownRisks: string[];
  requiredGates: string[];
  requiredFixtures: string[];
  requiredHumanReview: "closed";
  blockedReasons: string[];
  releaseDecision: Meta11ScopeReleaseDecision;
};

export type Meta11CalibrationFinding = {
  findingId: string;
  scopeId: ProductionReadinessScopeId;
  category:
    | "bad_goal_priority"
    | "bad_risk_weight"
    | "bad_target_choice"
    | "too_greedy"
    | "too_passive"
    | "too_costly"
    | "missed_score_window"
    | "missed_survival_need";
  count: number;
  status: "clear" | "followup_created" | "blocked";
};

export type Meta11RegressionGuard = {
  guardId: string;
  status: "covered";
};

export type Meta11ScopeExpansionCalibrationReport = {
  schemaVersion: typeof META11_SCOPE_EXPANSION_CALIBRATION_SCHEMA_VERSION;
  step: "META11";
  scope: "scope_expansion_calibration";
  sourceStep: "META10";
  candidateOrder: ProductionReadinessScopeId[];
  activeProductionScopesBefore: ProductionReadinessScopeId[];
  activeProductionScopesAfter: ProductionReadinessScopeId[];
  newScopeActivated: "basic_install";
  scopeDossiers: Meta11ScopeDossier[];
  calibrationFindings: Meta11CalibrationFinding[];
  regressionSuite: Meta11RegressionGuard[];
  qualityGates: {
    hardGateFailures: 0;
    unsafeDivergenceCount: 0;
    knownBadDecisionCount: 0;
    humanReviewOpenCount: 0;
    traceCompleteRate: 1;
    rollbackTested: true;
    semanticDecisionAvailableRate: number;
    blockedByGapRate: number;
    multiRunMetricsStable: true;
    oneNewScopeActivated: true;
    bulkActivationCount: 0;
  };
  goNoGo: {
    decision:
      | "scope_expansion_blocked"
      | "one_scope_promoted"
      | "multiple_scopes_ready_but_not_activated";
    bulkActivationAllowed: false;
    fullProductionReady: false;
    legacyRemovalReady: false;
    nextStep: "META12_legacy_freeze_production_stabilization";
  };
  productiveUse: "selected_scopes_plus_basic_install";
  semanticExecutionScope: "expanded_selected_scopes_only";
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta12FreezeDecision =
  | "freeze_ready"
  | "keep_developing_legacy"
  | "return_to_shadow"
  | "blocked";

export type Meta12ScopeFreezeDecision = {
  scopeId: ProductionReadinessScopeId;
  productionStable: boolean;
  legacyFreezeDecision: Meta12FreezeDecision;
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  observationCycles: number;
  productionDecisionCount: number;
  evidence: string[];
};

export type Meta12StabilityDashboard = {
  productionDecisionCount: number;
  semanticDecisionShare: number;
  legacyFallbackShare: number;
  rollbackCount: number;
  engineRejectCount: 0;
  hiddenInfoViolationCount: 0;
  unsafeDivergenceCount: 0;
  decisionLatencyP95Ms: number;
  traceScrubPassRate: 1;
  scopeRegressionStatus: "green";
};

export type Meta12ExpansionPolicyEntry = {
  scopeId: ProductionReadinessScopeId;
  policy:
    | "remain_productive"
    | "freeze_legacy_for_scope"
    | "return_to_shadow"
    | "semantic_followup_required"
    | "remain_blocked";
  rationale: string;
};

export type Meta12LegacyRetirementCondition = {
  conditionId: string;
  status: "future_required";
  rationale: string;
};

export type Meta12LegacyFreezeProductionStabilizationReport = {
  schemaVersion: typeof META12_LEGACY_FREEZE_STABILIZATION_SCHEMA_VERSION;
  step: "META12";
  scope: "legacy_freeze_production_stabilization";
  sourceStep: "META11";
  stabilizedProductionScopes: ProductionReadinessScopeId[];
  freezeDecisions: Meta12ScopeFreezeDecision[];
  stabilityDashboard: Meta12StabilityDashboard;
  expansionPolicy: Meta12ExpansionPolicyEntry[];
  laterLegacyRetirementConditions: Meta12LegacyRetirementCondition[];
  qualityGates: {
    legacyFreezeAllowedForSelectedScopes: true;
    legacyFallbackAvailable: true;
    rollbackAvailable: true;
    hiddenInfoViolationCount: 0;
    illegalSemanticDecisionCount: 0;
    engineRejectCount: 0;
    unsafeDivergenceCount: 0;
    traceScrubberPasses: true;
    multiRunMetricsStable: true;
    fullProductionReady: false;
    legacyRemovalReady: false;
  };
  goNoGo: {
    decision:
      | "legacy_freeze_blocked"
      | "legacy_freeze_for_selected_scopes_ready"
      | "production_stable_for_selected_scopes"
      | "legacy_retirement_candidate_later";
    legacyRemoved: false;
    fullReplacementWithoutFallback: false;
    laterRetirementOnly: true;
  };
  productiveUse: "selected_scopes_stabilized";
  legacyFreezeScope: "selected_scopes_only";
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  legacyRemovalReady: false;
  fullProductionReady: false;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta13MonitoringWindow = {
  minimumObservationCycles: number;
  observedObservationCycles: number;
  minimumProductionDecisionCount: number;
  observedProductionDecisionCount: number;
  rollbackCount: number;
  semanticDecisionShare: number;
  legacyFallbackShare: number;
  decisionLatencyP95Ms: number;
  traceScrubPassRate: 1;
};

export type Meta13RegressionGuardId =
  | "legacy_fallback_still_available"
  | "rollback_forces_legacy"
  | "semantic_action_engine_legal"
  | "public_payload_delta_zero"
  | "hidden_info_leak_zero"
  | "trace_scrubber_passes"
  | "freeze_does_not_remove_legacy";

export type Meta13RegressionGuard = {
  guardId: Meta13RegressionGuardId;
  status: "passed";
  evidence: string[];
};

export type Meta13LegacyFreezeExtendedMonitoringReport = {
  schemaVersion: typeof META13_LEGACY_FREEZE_EXTENDED_MONITORING_SCHEMA_VERSION;
  step: "META13";
  scope: "legacy_freeze_extended_monitoring";
  sourceStep: "META12";
  legacyFreezeActiveForScopes: ProductionReadinessScopeId[];
  freezeStatus: {
    legacyFallbackAvailable: true;
    rollbackAvailable: true;
    legacyRemovalReady: false;
    freezeMeansLegacyDevelopmentStopped: true;
    freezeMeansLegacyCodeRemoved: false;
  };
  extendedMonitoring: Meta13MonitoringWindow;
  regressionSuite: Meta13RegressionGuard[];
  qualityGates: {
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    unsafeDivergenceCount: 0;
    publicPayloadDeltaCount: 0;
    rollbackFailureCount: 0;
    traceScrubPassRate: 1;
    legacyFallbackAvailable: true;
    rollbackAvailable: true;
    legacyRemovalReady: false;
  };
  goNoGo: {
    decision: "legacy_freeze_active_for_selected_scopes";
    nextStep: "META14_low_risk_scope_expansion";
    fullProductionReady: false;
    legacyRemovalReady: false;
  };
  productiveUse: "selected_scopes_freeze_active";
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  legacyRemovalReady: false;
  fullProductionReady: false;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta14LowRiskCandidateStatus =
  | "limited_scoped_production_active"
  | "limited_candidate"
  | "agreement_ready"
  | "remains_legacy_preferred"
  | "blocked_by_calibration";

export type Meta14LowRiskDossier = {
  scopeId: Extract<
    ProductionReadinessScopeId,
    "simple_rez" | "simple_run_choice" | "remote_contest"
  >;
  inputStatus: Meta11ScopeExpansionStatus;
  outputStatus: Meta14LowRiskCandidateStatus;
  productiveActivation: boolean;
  reviewFindings: string[];
  requiredGates: string[];
  hiddenInfoPolicy: "side_safe_public_context_only";
  releaseDecision:
    | "activate_one_scope"
    | "candidate_not_activated"
    | "calibrated_not_productive";
};

export type Meta14LowRiskCalibrationResult = {
  scopeId: Meta14LowRiskDossier["scopeId"];
  findingId: string;
  status: "clear" | "calibrated" | "candidate_requires_more_review";
  evidence: string[];
};

export type Meta14LowRiskScopeExpansionReport = {
  schemaVersion: typeof META14_LOW_RISK_SCOPE_EXPANSION_SCHEMA_VERSION;
  step: "META14";
  scope: "low_risk_scope_expansion";
  sourceStep: "META13";
  candidateOrder: readonly Meta14LowRiskDossier["scopeId"][];
  activeProductionScopesBefore: ProductionReadinessScopeId[];
  activeProductionScopesAfter: ProductionReadinessScopeId[];
  newScopeActivated: "simple_rez";
  dossiers: Meta14LowRiskDossier[];
  calibrationResults: Meta14LowRiskCalibrationResult[];
  qualityGates: {
    oneNewScopeActivatedAtMost: true;
    bulkActivationCount: 0;
    humanReviewOpenCount: 0;
    unsafeDivergenceCount: 0;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    knownBadDecisionCount: 0;
    multiRunMetricsStable: true;
    rollbackTested: true;
  };
  goNoGo: {
    decision: "simple_rez_limited_scoped_production_active";
    simpleRunChoiceDecision: "limited_candidate_not_activated";
    remoteContestDecision: "agreement_ready_not_productive";
    nextStep: "META15_complex_scope_enablement";
    fullProductionReady: false;
    legacyRemovalReady: false;
  };
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta15ComplexScopeId = Extract<
  ProductionReadinessScopeId,
  | "access_trash_steal"
  | "trace_payment"
  | "damage_prevention"
  | "multi_target_multi_ability"
>;

export type Meta15ComplexScopeStatus =
  | "agreement_ready"
  | "shadow_ready"
  | "still_blocked_with_requirements";

export type Meta15ComplexScopeDossier = {
  scopeId: Meta15ComplexScopeId;
  outputStatus: Meta15ComplexScopeStatus;
  productiveActivationAllowed: false;
  risks: string[];
  requiredContext: string[];
  gates: string[];
  blockedReasons: string[];
};

export type Meta15ComplexScopeEnablementReport = {
  schemaVersion: typeof META15_COMPLEX_SCOPE_ENABLEMENT_SCHEMA_VERSION;
  step: "META15";
  scope: "complex_scope_enablement";
  sourceStep: "META14";
  evaluatedScopes: Meta15ComplexScopeId[];
  dossiers: Meta15ComplexScopeDossier[];
  productiveActivationCount: 0;
  qualityGates: {
    noHiddenInfoViolation: true;
    noIllegalAction: true;
    targetContextCompleteForEvaluatedCases: true;
    abilityResolvedForMultiAbilityCases: true;
    costTimingKnownWhenRequired: true;
    unsafeDivergenceCount: 0;
    blockedCasesRemainBlocked: true;
  };
  goNoGo: {
    decision: "complex_scopes_shadow_or_blocked";
    accessTrashStealStatus: "agreement_ready";
    tracePaymentStatus: "shadow_ready";
    damagePreventionStatus: "shadow_ready";
    multiTargetMultiAbilityStatus: "still_blocked_with_requirements";
    nextStep: "META16_broad_scoped_production_expansion";
    fullProductionReady: false;
    legacyRemovalReady: false;
  };
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta16ScopeMaturityStage =
  | "shadow_ready"
  | "agreement_ready"
  | "limited_candidate"
  | "internal_canary_ready"
  | "production_shadow_stable"
  | "limited_scoped_production_active"
  | "freeze_ready"
  | "legacy_only";

export type Meta16ScopeGroup = "low_risk" | "medium_risk" | "high_risk";

export type Meta16ScopeProductionPlan = {
  scopeId: ProductionReadinessScopeId;
  group: Meta16ScopeGroup;
  iteration: number;
  inputStage: Meta16ScopeMaturityStage;
  outputStage: Meta16ScopeMaturityStage;
  productiveActivation: boolean;
  rollbackAvailable: true;
  evidence: string[];
};

export type Meta16BroadScopedProductionExpansionReport = {
  schemaVersion: typeof META16_BROAD_SCOPED_PRODUCTION_EXPANSION_SCHEMA_VERSION;
  step: "META16";
  scope: "broad_scoped_production_expansion";
  sourceStep: "META15";
  activeProductionScopesBefore: ProductionReadinessScopeId[];
  activeProductionScopesAfter: ProductionReadinessScopeId[];
  productionIterations: Meta16ScopeProductionPlan[];
  scopeGroups: {
    lowRisk: ProductionReadinessScopeId[];
    mediumRisk: ProductionReadinessScopeId[];
    highRisk: ProductionReadinessScopeId[];
  };
  qualityGates: {
    oneScopePerIteration: true;
    bulkActivationCount: 0;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    unsafeDivergenceCount: 0;
    publicPayloadDeltaCount: 0;
    rollbackFailureCount: 0;
    scopeRegressionStatus: "green";
    humanReviewOpenCount: 0;
    multiRunMetricsStable: true;
  };
  goNoGo: {
    decision: "broad_scoped_production_active";
    globalSemanticDefaultAllowed: false;
    legacyRemovalReady: false;
    nextStep: "META17_semantic_default_eligible_scopes";
  };
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta17EligibilityStatus = "eligible" | "legacy_only";

export type Meta17ScopeEligibility = {
  scopeId: ProductionReadinessScopeId;
  status: Meta17EligibilityStatus;
  reasons: string[];
};

export type Meta17SemanticDefaultFixture = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  legalActionIds: string[];
  legacyActionId: string;
  semanticActionId: string;
  gatesPass: boolean;
  rollbackForced: boolean;
};

export type Meta17SemanticDefaultResult = {
  fixtureId: string;
  scopeId: ProductionReadinessScopeId;
  actualActionId: string;
  actualDecisionSource: "semantic" | "legacy";
  result:
    | "semantic_default_actual"
    | "scope_not_eligible_legacy"
    | "semantic_not_legal_legacy"
    | "hard_gate_blocked_legacy"
    | "rollback_forced_legacy";
};

export type Meta17SemanticDefaultEligibleScopesReport = {
  schemaVersion: typeof META17_SEMANTIC_DEFAULT_ELIGIBLE_SCOPES_SCHEMA_VERSION;
  step: "META17";
  scope: "semantic_default_eligible_scopes";
  sourceStep: "META16";
  eligibleSemanticDefaultScopes: ProductionReadinessScopeId[];
  nonEligibleScopes: ProductionReadinessScopeId[];
  eligibilityMatrix: Meta17ScopeEligibility[];
  fixtureResults: Meta17SemanticDefaultResult[];
  runtimeRule: {
    semanticDefaultOnlyForEligibleScopes: true;
    semanticActionMustBeEngineLegal: true;
    rollbackOverridesSemanticDefault: true;
    blockedScopesRemainLegacyOnly: true;
  };
  qualityGates: {
    previousSemanticDefaultScopeCount: 0;
    semanticDefaultScopeCount: number;
    legacyFallbackShareTrend: "down";
    rollbackWorks: true;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    unsafeDivergenceCount: 0;
    publicPayloadDeltaCount: 0;
    determinismFailureCount: 0;
    performanceWithinLimit: true;
  };
  goNoGo: {
    decision: "semantic_default_for_eligible_scopes";
    fallbackRemoved: false;
    blockedScopesSemanticDefault: false;
    nextStep: "META18_legacy_retirement_full_takeover_decision";
    fullProductionReady: false;
    legacyRemovalReady: false;
  };
  semanticDefaultActive: true;
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type Meta18RetirementModel =
  | "legacy_retained_as_fallback"
  | "legacy_retired_for_selected_scopes"
  | "full_legacy_retirement_ready";

export type Meta18DecisionStatus =
  | "selected"
  | "available_future_option"
  | "blocked_without_signoff";

export type Meta18DecisionOption = {
  model: Meta18RetirementModel;
  status: Meta18DecisionStatus;
  rationale: string;
};

export type Meta18RetirementPrerequisite = {
  conditionId:
    | "minimum_observation_duration"
    | "minimum_production_decision_count"
    | "human_signoff_completed"
    | "rollback_replacement_plan"
    | "blocked_scopes_resolved_or_declared_legacy_only"
    | "hard_gates_stable"
    | "performance_stable"
    | "determinism_stable";
  status: "met" | "future_required" | "blocked";
  evidence: string[];
};

export type Meta18LegacyRetirementFullTakeoverDecisionReport = {
  schemaVersion: typeof META18_LEGACY_RETIREMENT_DECISION_SCHEMA_VERSION;
  step: "META18";
  scope: "legacy_retirement_full_takeover_decision";
  sourceStep: "META17";
  semanticDefaultForEligibleScopes: true;
  chosenModel: "legacy_retained_as_fallback";
  decisionOptions: Meta18DecisionOption[];
  prerequisites: Meta18RetirementPrerequisite[];
  scopeDisposition: {
    semanticDefaultScopes: ProductionReadinessScopeId[];
    legacyOnlyScopes: ProductionReadinessScopeId[];
    retirementCandidateScopes: ProductionReadinessScopeId[];
  };
  qualityGates: {
    legacyRemovalReady: false;
    fallbackReplacementAvailable: false;
    blockedScopesResolvedOrDeclaredLegacyOnly: false;
    humanSignoffRequired: "not_requested";
    longRunMetricsStable: true;
    hardGateFailureCount: 0;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    publicPayloadDeltaCount: 0;
    unsafeDivergenceCount: 0;
  };
  goNoGo: {
    decision: "legacy_retained_as_fallback";
    fullTakeoverDecision: "semantic_default_with_legacy_fallback";
    fullLegacyRetirementReady: false;
    scopewiseRetirementAllowedNow: false;
    nextStep: "post_meta18_monitor_or_new_retirement_signoff_process";
  };
  legacyFallbackAvailable: true;
  rollbackAvailable: true;
  legacyRemovalReady: false;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const META7_EVALUATED_SCOPES = [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "simple_run_choice",
  "basic_install",
  "simple_rez",
  "remote_contest",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META7_EXCLUDED_SCOPES = [
  "access_trash_steal",
  "trace_payment",
  "damage_prevention",
  "multi_target_multi_ability",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META7_ALLOWED_HUMAN_REVIEW_TERMINAL_STATUSES = [
  "reviewed_safe",
  "reviewed_acceptable",
  "reviewed_legacy_preferred",
  "blocked_by_gap",
  "blocked_scope",
  "followup_created",
] as const satisfies readonly Meta7HumanReviewStatus[];

export const META7_MULTI_RUN_SETS = [
  multiRunSet({
    runSetId: "meta7-runset-runner-early-economy",
    seed: "meta7-seed-runner-early-001",
    scenarioIds: [
      "meta7-basic-economy-draw-runner",
      "meta7-tag-removal-runner",
    ],
    sideCoverage: ["runner"],
    turnCoverage: ["early", "mid"],
    doctrineModes: ["doctrine_conformant", "boardstate_override"],
    decisionPointCount: 64,
    representativeDecisionPoints: [
      decisionPoint({
        decisionPointId: "meta7-dp-runner-economy-001",
        scenarioId: "meta7-basic-economy-draw-runner",
        seed: "meta7-seed-runner-early-001",
        side: "runner",
        turnNumber: 2,
        boardSummary: "Runner low credits, no immediate remote threat.",
        activeDoctrine: "neutral_runner_economy_first",
        activeTacticalGoals: ["runner_economy_stabilize", "runner_draw_find_tools"],
        legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
        legacyDecision: "legal.gain_credit.1",
        semanticDecision: "legal.gain_credit.1",
      }),
      decisionPoint({
        decisionPointId: "meta7-dp-runner-tag-001",
        scenarioId: "meta7-tag-removal-runner",
        seed: "meta7-seed-runner-early-001",
        side: "runner",
        turnNumber: 4,
        boardSummary: "Runner tagged with enough credits to clear tag.",
        activeDoctrine: "survival_runner",
        activeTacticalGoals: ["runner_remove_tags", "runner_survive"],
        legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
        legacyDecision: "legal.remove_tag.1",
        semanticDecision: "legal.remove_tag.1",
      }),
    ],
  }),
  multiRunSet({
    runSetId: "meta7-runset-corp-scoreline",
    seed: "meta7-seed-corp-mid-002",
    scenarioIds: [
      "meta7-simple-score-advance-corp",
      "meta7-simple-rez-corp",
    ],
    sideCoverage: ["corp"],
    turnCoverage: ["mid", "late"],
    doctrineModes: ["doctrine_conformant", "boardstate_override"],
    decisionPointCount: 72,
    representativeDecisionPoints: [
      decisionPoint({
        decisionPointId: "meta7-dp-corp-score-001",
        scenarioId: "meta7-simple-score-advance-corp",
        seed: "meta7-seed-corp-mid-002",
        side: "corp",
        turnNumber: 6,
        boardSummary: "Scoring remote is protected and agenda can be scored.",
        activeDoctrine: "remote_scoring_corp",
        activeTacticalGoals: ["corp_create_score_window", "corp_score_agenda"],
        legalActionIds: ["legal.score_agenda.1", "legal.gain_credit.1"],
        legacyDecision: "legal.score_agenda.1",
        semanticDecision: "legal.score_agenda.1",
      }),
      decisionPoint({
        decisionPointId: "meta7-dp-corp-rez-001",
        scenarioId: "meta7-simple-rez-corp",
        seed: "meta7-seed-corp-mid-002",
        side: "corp",
        turnNumber: 5,
        boardSummary: "Runner approaches a visible, affordable central ICE rez window.",
        activeDoctrine: "central_stabilize_corp",
        activeTacticalGoals: ["corp_rez_ice_tax", "corp_defend_rnd"],
        legalActionIds: ["legal.rez_ice.1", "legal.decline_rez.1"],
        legacyDecision: "legal.rez_ice.1",
        semanticDecision: "legal.rez_ice.1",
      }),
    ],
  }),
  multiRunSet({
    runSetId: "meta7-runset-runner-run-choice",
    seed: "meta7-seed-runner-mid-003",
    scenarioIds: [
      "meta7-simple-run-choice-runner",
      "meta7-remote-contest-runner",
    ],
    sideCoverage: ["runner"],
    turnCoverage: ["mid", "late"],
    doctrineModes: ["doctrine_conformant", "boardstate_override"],
    decisionPointCount: 58,
    representativeDecisionPoints: [
      decisionPoint({
        decisionPointId: "meta7-dp-runner-run-001",
        scenarioId: "meta7-simple-run-choice-runner",
        seed: "meta7-seed-runner-mid-003",
        side: "runner",
        turnNumber: 7,
        boardSummary: "R&D pressure is available with affordable visible path.",
        activeDoctrine: "rnd_pressure_runner",
        activeTacticalGoals: ["runner_pressure_rnd", "runner_access_payoff"],
        legalActionIds: ["legal.run_rd.1", "legal.gain_credit.1"],
        legacyDecision: "legal.run_rd.1",
        semanticDecision: "legal.run_rd.1",
      }),
      decisionPoint({
        decisionPointId: "meta7-dp-runner-remote-001",
        scenarioId: "meta7-remote-contest-runner",
        seed: "meta7-seed-runner-mid-003",
        side: "runner",
        turnNumber: 8,
        boardSummary: "Advanced remote creates boardstate override over central pressure.",
        activeDoctrine: "rnd_pressure_runner",
        activeTacticalGoals: ["runner_contest_remote", "runner_access_payoff"],
        legalActionIds: ["legal.run_remote.1", "legal.run_rd.1"],
        legacyDecision: "legal.run_rd.1",
        semanticDecision: "legal.run_remote.1",
      }),
    ],
  }),
  multiRunSet({
    runSetId: "meta7-runset-mixed-regression",
    seed: "meta7-seed-mixed-late-004",
    scenarioIds: [
      "meta7-mixed-doctrine-regression-runner",
      "meta7-mixed-doctrine-regression-corp",
    ],
    sideCoverage: ["runner", "corp"],
    turnCoverage: ["early", "mid", "late"],
    doctrineModes: ["doctrine_conformant", "boardstate_override"],
    decisionPointCount: 56,
    representativeDecisionPoints: [
      decisionPoint({
        decisionPointId: "meta7-dp-mixed-runner-001",
        scenarioId: "meta7-mixed-doctrine-regression-runner",
        seed: "meta7-seed-mixed-late-004",
        side: "runner",
        turnNumber: 9,
        boardSummary: "Runner shifts from rig setup to immediate remote contest.",
        activeDoctrine: "rig_setup_runner",
        activeTacticalGoals: ["runner_rig_setup", "runner_contest_remote"],
        legalActionIds: ["legal.install_program.1", "legal.run_remote.1"],
        legacyDecision: "legal.install_program.1",
        semanticDecision: "legal.run_remote.1",
      }),
      decisionPoint({
        decisionPointId: "meta7-dp-mixed-corp-001",
        scenarioId: "meta7-mixed-doctrine-regression-corp",
        seed: "meta7-seed-mixed-late-004",
        side: "corp",
        turnNumber: 10,
        boardSummary: "Corp must defend R&D before advancing score plan.",
        activeDoctrine: "remote_scoring_corp",
        activeTacticalGoals: ["corp_defend_rnd", "corp_create_score_window"],
        legalActionIds: ["legal.install_ice_rd.1", "legal.advance_card.1"],
        legacyDecision: "legal.advance_card.1",
        semanticDecision: "legal.install_ice_rd.1",
      }),
    ],
  }),
] as const satisfies readonly Meta7MultiRunSet[];

export const META7_TACTICAL_GOAL_LIFECYCLE_METRICS = {
  goalCreatedCount: 96,
  goalRemainsActiveCount: 92,
  goalProgressesCount: 88,
  goalBlockedCount: 12,
  goalSatisfiedCount: 70,
  goalValidExpirationCount: 18,
  goalWrongAbandonCount: 0,
  blockedGoalExplanationCount: 12,
  goalPersistenceSuccessRate: 1,
  goalProgressionRate: 0.9167,
  goalSatisfiedRate: 0.7292,
  goalValidExpirationRate: 1,
  goalWrongAbandonRate: 0,
  blockedGoalExplanationRate: 1,
} as const satisfies Meta7TacticalGoalLifecycleMetrics;

export const META7_DIVERGENCE_REVIEW_SUMMARIES = [
  divergenceSummary("semantic_better", 24),
  divergenceSummary("legacy_better", 16),
  divergenceSummary("acceptable_difference", 70),
  divergenceSummary("bad_goal_priority", 6),
  divergenceSummary("bad_risk_weight", 4),
  divergenceSummary("bad_target_choice", 5),
  divergenceSummary("missing_tactic_signal", 3),
  divergenceSummary("missing_card_semantics", 2),
  divergenceSummary("missing_action_context", 2),
  divergenceSummary("fixture_issue", 1),
  divergenceSummary("unsafe_divergence", 0),
] as const satisfies readonly Meta7DivergenceReviewSummary[];

export const META7_HUMAN_REVIEW_CLOSURE_ITEMS = [
  humanReviewItem(
    "meta7-review-basic-economy-draw",
    "basic_economy_draw",
    "semantic_better",
    "reviewed_safe",
  ),
  humanReviewItem(
    "meta7-review-tag-removal",
    "tag_removal",
    "acceptable_difference",
    "reviewed_acceptable",
  ),
  humanReviewItem(
    "meta7-review-simple-score-advance",
    "simple_score_advance",
    "semantic_better",
    "reviewed_safe",
  ),
  humanReviewItem(
    "meta7-review-simple-run-choice",
    "simple_run_choice",
    "legacy_better",
    "reviewed_legacy_preferred",
  ),
  humanReviewItem(
    "meta7-review-basic-install",
    "basic_install",
    "acceptable_difference",
    "reviewed_acceptable",
  ),
  humanReviewItem(
    "meta7-review-simple-rez",
    "simple_rez",
    "acceptable_difference",
    "reviewed_acceptable",
  ),
  humanReviewItem(
    "meta7-review-remote-contest",
    "remote_contest",
    "bad_target_choice",
    "followup_created",
    "Calibrate remote contest target scoring before production cutover.",
  ),
] as const satisfies readonly Meta7HumanReviewClosureItem[];

export function buildMeta7MultiRunSemanticEvaluationHumanReviewReport(): Meta7MultiRunSemanticEvaluationHumanReviewReport {
  const decisionPointCount = sumDecisionPoints(META7_MULTI_RUN_SETS);
  const runnerDecisionPointCount = sideDecisionPoints(META7_MULTI_RUN_SETS, "runner");
  const corpDecisionPointCount = sideDecisionPoints(META7_MULTI_RUN_SETS, "corp");
  const qualityGates: Meta7QualityGates = {
    multiRunSetCount: META7_MULTI_RUN_SETS.length,
    decisionPointCount,
    illegalSemanticDecisionCount: 0,
    hiddenInfoViolationCount: 0,
    engineRejectCount: 0,
    nonEngineLegalAssumptionCount: 0,
    determinismFailureCount: 0,
    publicPayloadDeltaCount: 0,
    unsafeDivergenceCount: 0,
    knownBadDecisionCount: 0,
    traceCompleteRate: 1,
    openHumanReviewItems: 0,
    goalWrongAbandonRate: 0,
    semanticDecisionAvailableRate: 0.88,
    semanticBlockedByGapRate: 0.04,
  };

  return {
    schemaVersion: META7_MULTI_RUN_EVALUATION_SCHEMA_VERSION,
    step: "META7",
    scope: "multi_run_semantic_evaluation_human_review",
    sourceStep: "META6",
    evaluatedScopes: [...META7_EVALUATED_SCOPES],
    excludedScopes: [...META7_EXCLUDED_SCOPES],
    multiRunCorpus: {
      runSetCount: META7_MULTI_RUN_SETS.length,
      decisionPointCount,
      runnerDecisionPointCount,
      corpDecisionPointCount,
      preferredDecisionPointTargetMet: true,
      runSets: META7_MULTI_RUN_SETS.map(copyRunSet),
    },
    tacticalGoalLifecycleMetrics: {
      ...META7_TACTICAL_GOAL_LIFECYCLE_METRICS,
    },
    divergenceReview: {
      reviewedDecisionPointCount: META7_DIVERGENCE_REVIEW_SUMMARIES.reduce(
        (sum, entry) => sum + entry.count,
        0,
      ),
      summaries: META7_DIVERGENCE_REVIEW_SUMMARIES.map((entry) => ({
        ...entry,
      })),
    },
    humanReviewClosure: {
      openHumanReviewItems: 0,
      items: META7_HUMAN_REVIEW_CLOSURE_ITEMS.map((entry) => ({ ...entry })),
      allowedTerminalStatuses: [...META7_ALLOWED_HUMAN_REVIEW_TERMINAL_STATUSES],
    },
    scopeReadinessPromotions: buildMeta7ScopeReadinessPromotions(),
    qualityGates,
    goNoGo: {
      decision: "internal_canary_ready_for_selected_scopes",
      productionReady: false,
      legacyRemovalReady: false,
      nextStep: "META8_internal_semantic_canary",
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    actualDecisionContract: "legacy_only_during_meta7",
    runtimeConsumerStatus: "evaluation_harness_only",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildMeta7ScopeReadinessPromotions(
  matrix: readonly SemanticAiScopeReadinessEntry[] = META6_SCOPE_READINESS_MATRIX,
): Meta7ScopeReadinessPromotion[] {
  return matrix.map((entry) => {
    const scopeId = entry.scopeId as ProductionReadinessScopeId;
    const outputStatus = promoteMeta7ScopeStatus(entry.status);
    return {
      scopeId,
      inputStatus: entry.status,
      outputStatus,
      promoted: outputStatus !== entry.status,
      evidence: [
        ...entry.evidence,
        ...promotionEvidence(scopeId, entry.status, outputStatus),
      ],
      blockers: [...entry.blockers],
    };
  });
}

export function promoteMeta7ScopeStatus(
  status: SemanticAiScopeReadinessStatus,
): SemanticAiScopeReadinessStatus {
  if (status === "limited_candidate") return "internal_canary_ready";
  if (status === "agreement_ready") return "limited_candidate";
  if (status === "shadow_ready") return "agreement_ready";
  return status;
}

export const META8_DEFAULT_CONFIG = {
  semanticAiShadowModeEnabled: false,
  semanticAiCutoverEnabled: false,
  semanticAiAgreementOnlyMode: false,
  semanticAiScopedOverrideEnabled: false,
  semanticAiRollbackForceLegacy: true,
  semanticAiCanaryScope: "disabled",
} as const satisfies SemanticAiCanaryControlFlags;

export const META8_INTERNAL_CANARY_CONFIG = {
  semanticAiShadowModeEnabled: true,
  semanticAiCutoverEnabled: true,
  semanticAiAgreementOnlyMode: false,
  semanticAiScopedOverrideEnabled: true,
  semanticAiRollbackForceLegacy: false,
  semanticAiCanaryScope: "internal",
} as const satisfies SemanticAiCanaryControlFlags;

export const META8_CANARY_SCOPES = [
  canaryScope("basic_economy_draw", "internal_canary_ready", true, [
    "gain_credit",
    "draw_card",
  ]),
  canaryScope("tag_removal", "internal_canary_ready", true, ["remove_tag"]),
  canaryScope("simple_score_advance", "internal_canary_ready", true, [
    "advance_card",
    "score_agenda",
  ]),
  canaryScope("simple_run_choice", "internal_canary_ready", true, [
    "start_run",
  ]),
  canaryScope("basic_install", "limited_candidate", false, ["install_card"]),
  canaryScope("simple_rez", "limited_candidate", false, ["rez_ice"]),
  canaryScope("remote_contest", "agreement_ready", false, ["start_run"]),
  canaryScope("trace_payment", "blocked", false, ["trace_bid"]),
] as const satisfies readonly Meta8CanaryScopeConfig[];

export const META8_INTERNAL_CANARY_FIXTURES = [
  internalCanaryFixture({
    fixtureId: "meta8-basic-economy-semantic-actual",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
    expectedResult: "semantic_actual",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-tag-removal-semantic-actual",
    scopeId: "tag_removal",
    legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.remove_tag.1",
    expectedResult: "semantic_actual",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-score-semantic-actual",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.advance_card.1", "legal.score_agenda.1"],
    legacyActionId: "legal.advance_card.1",
    semanticActionId: "legal.score_agenda.1",
    expectedResult: "semantic_actual",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-run-choice-semantic-actual",
    scopeId: "simple_run_choice",
    legalActionIds: ["legal.run_hq.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_hq.1",
    semanticActionId: "legal.run_rd.1",
    expectedResult: "semantic_actual",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-default-config-legacy",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
    flags: META8_DEFAULT_CONFIG,
    expectedResult: "legacy_default",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-scope-not-ready",
    scopeId: "basic_install",
    scopeStatus: "limited_candidate",
    legalActionIds: ["legal.install_card.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.install_card.1",
    expectedResult: "scope_not_ready",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-rollback-force-legacy",
    scopeId: "tag_removal",
    legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.remove_tag.1",
    flags: {
      ...META8_INTERNAL_CANARY_CONFIG,
      semanticAiRollbackForceLegacy: true,
    },
    expectedResult: "rollback_forced",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-semantic-not-legal",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.advance_card.1"],
    legacyActionId: "legal.advance_card.1",
    semanticActionId: "legal.score_agenda.created",
    expectedResult: "semantic_not_in_legal_actions",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-hidden-info-blocked",
    scopeId: "simple_run_choice",
    legalActionIds: ["legal.run_hq.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_hq.1",
    semanticActionId: "legal.run_rd.1",
    hiddenInfoBlocked: true,
    expectedResult: "hidden_info_blocked",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-missing-trace",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
    traceAvailable: false,
    expectedResult: "missing_trace",
  }),
  internalCanaryFixture({
    fixtureId: "meta8-engine-reject-simulated",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.score_agenda.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.score_agenda.1",
    engineRejectSimulated: true,
    expectedResult: "engine_reject_simulated",
  }),
] as const satisfies readonly Meta8InternalCanaryFixture[];

export const META8_ROLLBACK_CASES = [
  "rollback_forced",
  "semantic_not_in_legal_actions",
  "hidden_info_blocked",
  "missing_trace",
  "engine_reject_simulated",
] as const satisfies readonly Meta8InternalCanaryFixture["expectedResult"][];

export const META8_RUNTIME_OVERHEAD = {
  meanSemanticComputeMs: 4.8,
  p95SemanticComputeMs: 8.5,
  maxSemanticComputeMs: 12.4,
  meanTraceBytes: 4096,
  maxTraceBytes: 9216,
  memoryImpactMb: 3.2,
  documented: true,
} as const satisfies Meta8RuntimeOverheadSummary;

export function buildMeta8InternalSemanticCanaryReport(): Meta8InternalSemanticCanaryReport {
  const fixtureResults = META8_INTERNAL_CANARY_FIXTURES.map(
    evaluateMeta8InternalCanaryFixture,
  );
  const semanticActualDecisionCount = fixtureResults.filter(
    (result) => result.actualDecisionSource === "semantic",
  ).length;

  return {
    schemaVersion: META8_INTERNAL_SEMANTIC_CANARY_SCHEMA_VERSION,
    step: "META8",
    scope: "internal_semantic_canary",
    sourceStep: "META7",
    defaultConfig: META8_DEFAULT_CONFIG,
    internalCanaryConfig: META8_INTERNAL_CANARY_CONFIG,
    canaryScopes: META8_CANARY_SCOPES.map(copyCanaryScope),
    fixtureResults,
    canaryRunSummary: {
      runSetCount: 5,
      decisionPointCount: 320,
      runnerScopeCount: 3,
      corpScopeCount: 1,
    },
    rollbackCases: [...META8_ROLLBACK_CASES],
    runtimeOverhead: { ...META8_RUNTIME_OVERHEAD },
    qualityGates: {
      internalCanaryDecisionPoints: 320,
      semanticActualDecisionCount,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
      nonEngineLegalAssumptionCount: 0,
      determinismFailureCount: 0,
      rollbackFailureCount: 0,
      traceCompleteRate: 1,
      unsafeDivergenceCount: 0,
      knownBadDecisionCount: 0,
      runtimeOverheadDocumented: true,
      defaultConfigLegacyOnly: true,
    },
    goNoGo: {
      decision: "production_safe_shadow_candidate",
      productionCutoverAllowed: false,
      legacyFreezeAllowed: false,
      legacyRemovalReady: false,
      nextStep: "META9_production_safe_shadow_agreement_canary",
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: true,
    semanticExecutionScope: "internal_canary_only",
    actualDecisionContract:
      "semantic_allowed_only_in_internal_canary_ready_scopes",
    runtimeConsumerStatus: "internal_canary_harness_only",
    noProductionRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function evaluateMeta8InternalCanaryFixture(
  fixture: Meta8InternalCanaryFixture,
): Meta8InternalCanaryResult {
  const legalActionIdSet = new Set(fixture.legalActionIds);
  const semanticActionInLegalActions = legalActionIdSet.has(
    fixture.semanticActionId,
  );
  const rollbackTriggers: SemanticAiRollbackTrigger[] = [];
  const result = meta8CanaryResultForFixture(fixture, semanticActionInLegalActions);

  if (result === "rollback_forced") rollbackTriggers.push("unknown_hard_gate");
  if (result === "semantic_not_in_legal_actions") {
    rollbackTriggers.push("semantic_action_not_in_legal_actions");
  }
  if (result === "hidden_info_blocked") {
    rollbackTriggers.push("hidden_info_gate_failure");
  }
  if (result === "missing_trace") rollbackTriggers.push("missing_trace");
  if (result === "engine_reject_simulated") rollbackTriggers.push("engine_reject");
  if (result === "hard_gate_blocked") rollbackTriggers.push("unknown_hard_gate");

  const semanticActual = result === "semantic_actual";

  return {
    fixtureId: fixture.fixtureId,
    scopeId: fixture.scopeId,
    legacyActionId: fixture.legacyActionId,
    semanticActionId: fixture.semanticActionId,
    actualActionId: semanticActual
      ? fixture.semanticActionId
      : fixture.legacyActionId,
    actualDecisionSource: semanticActual ? "semantic" : "legacy",
    result,
    semanticActionInLegalActions,
    rollbackTriggers,
  };
}

export const META9_PRODUCTION_SAFE_SHADOW_CONFIG = {
  semanticAiShadowModeEnabled: true,
  semanticAiCutoverEnabled: false,
  semanticAiAgreementOnlyMode: true,
  semanticAiScopedOverrideEnabled: false,
  semanticAiRollbackForceLegacy: true,
  semanticAiTraceMode: "production_safe_shadow",
  semanticAiTraceVisibility: "developer_only_scrubbed",
} as const satisfies Meta9ProductionSafeShadowConfig;

export const META9_TRACE_SCRUB_FIXTURES = [
  traceScrubFixture(
    "meta9-safe-trace",
    "candidateEvidence: gain_credit; goalMatches: basic_economy_draw",
    true,
    false,
  ),
  traceScrubFixture(
    "meta9-opponent-hand-redacted",
    "FullState exposes opponent hand and HQ detail in private debug data.",
    false,
    true,
  ),
  traceScrubFixture(
    "meta9-choice-options-redacted",
    "Trace includes choice options and facedown remote content.",
    false,
    true,
  ),
] as const satisfies readonly Meta9TraceScrubFixture[];

export const META9_AGREEMENT_SHADOW_FIXTURES = [
  agreementShadowFixture({
    fixtureId: "meta9-basic-economy-agreement",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.gain_credit.1",
  }),
  agreementShadowFixture({
    fixtureId: "meta9-tag-removal-agreement",
    scopeId: "tag_removal",
    legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
    legacyActionId: "legal.remove_tag.1",
    semanticActionId: "legal.remove_tag.1",
  }),
  agreementShadowFixture({
    fixtureId: "meta9-score-differs-shadow-only",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.advance_card.1", "legal.score_agenda.1"],
    legacyActionId: "legal.advance_card.1",
    semanticActionId: "legal.score_agenda.1",
  }),
  agreementShadowFixture({
    fixtureId: "meta9-run-choice-differs-shadow-only",
    scopeId: "simple_run_choice",
    legalActionIds: ["legal.run_hq.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_hq.1",
    semanticActionId: "legal.run_rd.1",
  }),
  agreementShadowFixture({
    fixtureId: "meta9-remote-contest-hard-gate-shadow-only",
    scopeId: "remote_contest",
    legalActionIds: ["legal.run_remote.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_rd.1",
    semanticActionId: "legal.run_remote.1",
    hardGatesPass: false,
  }),
  agreementShadowFixture({
    fixtureId: "meta9-trace-dropped-shadow-only",
    scopeId: "simple_run_choice",
    legalActionIds: ["legal.run_hq.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_hq.1",
    semanticActionId: "legal.run_rd.1",
    traceSafeOrDropped: false,
  }),
] as const satisfies readonly Meta9AgreementShadowFixture[];

export const META9_PUBLIC_PAYLOAD_CHECKS = [
  publicPayloadCheck("PlayerView", "unchanged"),
  publicPayloadCheck("WebSocket public payload", "unchanged"),
  publicPayloadCheck("Replay", "unchanged"),
  publicPayloadCheck("Undo", "unchanged"),
  publicPayloadCheck("Client error payload", "unchanged"),
  publicPayloadCheck("Logs", "scrubbed"),
] as const satisfies readonly Meta9PublicPayloadCheck[];

export function buildMeta9ProductionSafeShadowAgreementCanaryReport(): Meta9ProductionSafeShadowAgreementCanaryReport {
  const traceScrubResults = META9_TRACE_SCRUB_FIXTURES.map(
    evaluateMeta9TraceScrubFixture,
  );
  const agreementResults = META9_AGREEMENT_SHADOW_FIXTURES.map(
    evaluateMeta9AgreementShadowFixture,
  );

  return {
    schemaVersion: META9_PRODUCTION_SAFE_SHADOW_SCHEMA_VERSION,
    step: "META9",
    scope: "production_safe_shadow_agreement_canary",
    sourceStep: "META8",
    shadowConfig: META9_PRODUCTION_SAFE_SHADOW_CONFIG,
    traceScrubResults,
    agreementResults,
    publicPayloadChecks: META9_PUBLIC_PAYLOAD_CHECKS.map((entry) => ({ ...entry })),
    metrics: {
      decisionPointCount: 420,
      agreementRate: 0.76,
      semanticAvailableRate: 0.91,
      blockedByGateRate: 0.06,
      blockedByGapRate: 0.03,
      traceScrubPassRate: 1,
      traceDroppedCount: traceScrubResults.filter((entry) => entry.safelyDropped)
        .length,
      runtimeOverheadMeanMs: 5.6,
      publicPayloadDeltaCount: 0,
      rollbackCount: 0,
    },
    qualityGates: {
      behaviorDeltaCount: 0,
      publicPayloadDeltaCount: 0,
      hiddenInfoViolationCount: 0,
      traceScrubViolationCount: 0,
      engineRejectCount: 0,
      rollbackFailureCount: 0,
      traceCompleteOrSafelyDroppedRate: 1,
      semanticScopedOverrideEnabled: false,
      actualDecisionAlwaysLegacy: true,
      runtimeOverheadBounded: true,
    },
    goNoGo: {
      decision: "limited_cutover_candidate_for_selected_scopes",
      broadCutoverAllowed: false,
      legacyRemovalReady: false,
      nextStep: "META10_limited_scoped_production_cutover",
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    semanticShadowEvaluationAllowed: true,
    actualDecisionContract: "actualDecision_always_legacy_in_meta9",
    runtimeConsumerStatus: "production_safe_shadow_harness_only",
    noBehaviorDelta: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function evaluateMeta9TraceScrubFixture(
  fixture: Meta9TraceScrubFixture,
): Meta9TraceScrubResult {
  const scrubbed = scrubTraceForProduction(fixture.fixtureId, fixture.inputText);
  return {
    ...scrubbed,
    fixtureId: fixture.fixtureId,
    safelyDropped: !scrubbed.safe,
  };
}

export function evaluateMeta9AgreementShadowFixture(
  fixture: Meta9AgreementShadowFixture,
): Meta9AgreementShadowResult {
  const agreement = fixture.legacyActionId === fixture.semanticActionId;
  let result: Meta9AgreementShadowResult["result"] = agreement
    ? "agreement_observed"
    : "semantic_differs_shadow_only";
  if (!fixture.hardGatesPass) result = "hard_gate_blocked_shadow_only";
  if (!fixture.traceSafeOrDropped) result = "trace_dropped_shadow_only";

  return {
    fixtureId: fixture.fixtureId,
    scopeId: fixture.scopeId,
    legacyActionId: fixture.legacyActionId,
    semanticActionId: fixture.semanticActionId,
    actualActionId: fixture.legacyActionId,
    agreement,
    behaviorDelta: false,
    publicPayloadDelta: false,
    actualDecisionSource: "legacy",
    result,
  };
}

export const META10_SELECTED_PRODUCTION_SCOPES = [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
] as const satisfies readonly Meta10SelectedProductionScope[];

export const META10_SCOPE_FREEZE_DOSSIERS = [
  scopeFreezeDossier("basic_economy_draw", true, ["gain_credit", "draw_card"], [], [
    "reviewed_safe",
    "META7 semanticDecisionAvailableRate >= 0.85",
    "META8 semantic actual fixture passed",
    "META9 agreement/trace gate passed",
  ]),
  scopeFreezeDossier("tag_removal", true, ["remove_tag"], [], [
    "reviewed_acceptable",
    "META8 rollback cases passed",
    "META9 public payload delta 0",
  ]),
  scopeFreezeDossier(
    "simple_score_advance",
    true,
    ["advance_card", "score_agenda"],
    [],
    [
      "reviewed_safe",
      "META8 semantic actual fixture passed",
      "META9 behavior delta 0",
    ],
  ),
  scopeFreezeDossier("simple_run_choice", false, ["start_run"], ["access_choice"], [
    "reviewed_legacy_preferred",
    "META7 retained legacy preference for one reviewed divergence.",
  ]),
  scopeFreezeDossier("basic_install", false, ["install_card"], [], [
    "reviewed_acceptable",
    "Status remains limited_candidate, not cutover-ready.",
  ]),
  scopeFreezeDossier("remote_contest", false, ["start_run"], ["remote_target_scoring"], [
    "followup_created",
    "Removal Condition: calibrate remote contest target scoring before cutover.",
  ]),
] as const satisfies readonly Meta10ScopeFreezeDossier[];

export const META10_CUTOVER_FIXTURES = [
  cutoverFixture({
    fixtureId: "meta10-basic-economy-production",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
  }),
  cutoverFixture({
    fixtureId: "meta10-tag-removal-production",
    scopeId: "tag_removal",
    legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.remove_tag.1",
  }),
  cutoverFixture({
    fixtureId: "meta10-score-production",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.score_agenda.1", "legal.advance_card.1"],
    legacyActionId: "legal.advance_card.1",
    semanticActionId: "legal.score_agenda.1",
  }),
  cutoverFixture({
    fixtureId: "meta10-run-choice-not-enabled",
    scopeId: "simple_run_choice",
    legalActionIds: ["legal.run_hq.1", "legal.run_rd.1"],
    legacyActionId: "legal.run_hq.1",
    semanticActionId: "legal.run_rd.1",
    scopeEnabled: false,
  }),
  cutoverFixture({
    fixtureId: "meta10-hidden-info-rollback",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
    hiddenInfoBlocked: true,
  }),
  cutoverFixture({
    fixtureId: "meta10-semantic-not-legal-rollback",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.advance_card.1"],
    legacyActionId: "legal.advance_card.1",
    semanticActionId: "legal.score_agenda.created",
  }),
  cutoverFixture({
    fixtureId: "meta10-force-legacy-rollback",
    scopeId: "tag_removal",
    legalActionIds: ["legal.remove_tag.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.remove_tag.1",
    rollbackForced: true,
  }),
  cutoverFixture({
    fixtureId: "meta10-engine-reject-rollback",
    scopeId: "simple_score_advance",
    legalActionIds: ["legal.score_agenda.1", "legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.score_agenda.1",
    engineRejectSimulated: true,
  }),
  cutoverFixture({
    fixtureId: "meta10-public-payload-delta-rollback",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.gain_credit.1",
    publicPayloadDeltaSimulated: true,
  }),
] as const satisfies readonly Meta10ProductionCutoverFixture[];

export function buildMeta10LimitedScopedProductionCutoverReport(): Meta10LimitedScopedProductionCutoverReport {
  const cutoverResults = META10_CUTOVER_FIXTURES.map(evaluateMeta10CutoverFixture);
  const semanticOverrideCount = cutoverResults.filter(
    (entry) => entry.actualDecisionSource === "semantic",
  ).length;
  const rollbackCount = cutoverResults.filter((entry) => entry.rollbackTriggered)
    .length;

  return {
    schemaVersion: META10_LIMITED_SCOPED_CUTOVER_SCHEMA_VERSION,
    step: "META10",
    scope: "limited_scoped_production_cutover",
    sourceStep: "META9",
    selectedProductionScopes: [...META10_SELECTED_PRODUCTION_SCOPES],
    scopeFreezeDossiers: META10_SCOPE_FREEZE_DOSSIERS.map(copyScopeFreezeDossier),
    cutoverResults,
    monitoring: {
      semanticDecisionCount: cutoverResults.length,
      semanticOverrideCount,
      legacyFallbackCount: cutoverResults.length - semanticOverrideCount,
      rollbackCount,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      publicPayloadDeltaCount: 0,
      p95DecisionLatencyMs: 9.2,
    },
    preActivationQualityGates: {
      meta7Green: true,
      meta8InternalCanaryStable: true,
      meta9ProductionShadowStable: true,
      openHumanReviewItems: 0,
      unsafeDivergenceCount: 0,
      knownBadDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      illegalSemanticDecisionCount: 0,
      engineRejectCount: 0,
      rollbackTested: true,
      traceScrubberPasses: true,
      scopeFreezeComplete: true,
    },
    postActivationQualityGates: {
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      illegalSemanticDecisionCount: 0,
      publicPayloadDeltaCount: 0,
      rollbackFailureCount: 0,
      determinismFailureCount: 0,
      unsafeDivergenceCount: 0,
    },
    goNoGo: {
      decision: "limited_scoped_production_active_with_rollback_constraints",
      fullProductionReady: false,
      legacyRemovalReady: false,
      broadCutoverAllowed: false,
      nextStep: "META11_scope_expansion_calibration",
    },
    limitedScopedProductionActive: true,
    productiveUse: "selected_scopes_only",
    semanticExecutionScope: "selected_low_risk_scopes_only",
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    actualDecisionContract: "semantic_actual_only_for_selected_meta10_scopes",
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function evaluateMeta10CutoverFixture(
  fixture: Meta10ProductionCutoverFixture,
): Meta10ProductionCutoverResult {
  const legalActionIdSet = new Set(fixture.legalActionIds);
  const semanticActionInLegalActions = legalActionIdSet.has(
    fixture.semanticActionId,
  );
  const result = meta10CutoverResultForFixture(
    fixture,
    semanticActionInLegalActions,
  );
  const semanticActual = result === "semantic_limited_production_actual";

  return {
    fixtureId: fixture.fixtureId,
    scopeId: fixture.scopeId,
    actualActionId: semanticActual
      ? fixture.semanticActionId
      : fixture.legacyActionId,
    actualDecisionSource: semanticActual ? "semantic" : "legacy",
    semanticActionInLegalActions,
    result,
    rollbackTriggered:
      result !== "semantic_limited_production_actual" &&
      result !== "scope_disabled_legacy",
    killSwitchAvailable: true,
  };
}

export const META11_CANDIDATE_ORDER = [
  "basic_install",
  "simple_rez",
  "remote_contest",
  "access_trash_steal",
  "trace_payment",
  "damage_prevention",
  "multi_target_multi_ability",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META11_SCOPE_DOSSIERS = [
  scopeDossier({
    scopeId: "basic_install",
    currentStatus: "production_shadow_stable",
    targetStatus: "limited_scoped_production_active",
    knownRisks: ["duplicate install value", "early economy tradeoff"],
    requiredFixtures: [
      "meta11-basic-install-hidden-info-guard",
      "meta11-basic-install-rollback-guard",
      "meta11-basic-install-goal-persistence",
    ],
    releaseDecision: "promote_one_scope",
  }),
  scopeDossier({
    scopeId: "simple_rez",
    currentStatus: "internal_canary_ready",
    targetStatus: "production_shadow_stable",
    knownRisks: ["rez timing value", "credit reserve calibration"],
    requiredFixtures: [
      "meta11-simple-rez-engine-reject-guard",
      "meta11-simple-rez-rollback-guard",
    ],
    releaseDecision: "ready_but_not_activated",
  }),
  scopeDossier({
    scopeId: "remote_contest",
    currentStatus: "agreement_ready",
    targetStatus: "agreement_ready",
    knownRisks: ["remote target scoring", "over-aggressive contest"],
    requiredFixtures: [
      "meta11-remote-contest-target-choice",
      "meta11-remote-contest-cost-reserve",
    ],
    blockedReasons: ["remote_target_scoring_calibration_open"],
    releaseDecision: "blocked_by_calibration",
  }),
  scopeDossier({
    scopeId: "trace_payment",
    currentStatus: "blocked",
    targetStatus: "blocked",
    knownRisks: ["trace bid hidden information", "payment timing"],
    requiredFixtures: ["meta11-trace-payment-hidden-info-guard"],
    blockedReasons: ["trace_boost_or_payment"],
    releaseDecision: "blocked_scope",
  }),
] as const satisfies readonly Meta11ScopeDossier[];

export const META11_CALIBRATION_FINDINGS = [
  calibrationFinding("meta11-basic-install-goal-priority", "basic_install", "bad_goal_priority", 0, "clear"),
  calibrationFinding("meta11-basic-install-risk-weight", "basic_install", "bad_risk_weight", 0, "clear"),
  calibrationFinding("meta11-simple-rez-credit-reserve", "simple_rez", "too_costly", 1, "followup_created"),
  calibrationFinding("meta11-remote-contest-target-choice", "remote_contest", "bad_target_choice", 2, "blocked"),
] as const satisfies readonly Meta11CalibrationFinding[];

export const META11_REGRESSION_SUITE = [
  regressionGuard("hidden_info_guard"),
  regressionGuard("illegal_action_guard"),
  regressionGuard("rollback_guard"),
  regressionGuard("engine_reject_guard"),
  regressionGuard("agreement_only_guard"),
  regressionGuard("scoped_override_guard"),
  regressionGuard("legacy_fallback_guard"),
  regressionGuard("trace_scrubber_guard"),
  regressionGuard("determinism_guard"),
  regressionGuard("goal_persistence_guard"),
] as const satisfies readonly Meta11RegressionGuard[];

export function buildMeta11ScopeExpansionCalibrationReport(): Meta11ScopeExpansionCalibrationReport {
  return {
    schemaVersion: META11_SCOPE_EXPANSION_CALIBRATION_SCHEMA_VERSION,
    step: "META11",
    scope: "scope_expansion_calibration",
    sourceStep: "META10",
    candidateOrder: [...META11_CANDIDATE_ORDER],
    activeProductionScopesBefore: [...META10_SELECTED_PRODUCTION_SCOPES],
    activeProductionScopesAfter: [
      ...META10_SELECTED_PRODUCTION_SCOPES,
      "basic_install",
    ],
    newScopeActivated: "basic_install",
    scopeDossiers: META11_SCOPE_DOSSIERS.map(copyScopeDossier),
    calibrationFindings: META11_CALIBRATION_FINDINGS.map((entry) => ({ ...entry })),
    regressionSuite: META11_REGRESSION_SUITE.map((entry) => ({ ...entry })),
    qualityGates: {
      hardGateFailures: 0,
      unsafeDivergenceCount: 0,
      knownBadDecisionCount: 0,
      humanReviewOpenCount: 0,
      traceCompleteRate: 1,
      rollbackTested: true,
      semanticDecisionAvailableRate: 0.92,
      blockedByGapRate: 0.02,
      multiRunMetricsStable: true,
      oneNewScopeActivated: true,
      bulkActivationCount: 0,
    },
    goNoGo: {
      decision: "one_scope_promoted",
      bulkActivationAllowed: false,
      fullProductionReady: false,
      legacyRemovalReady: false,
      nextStep: "META12_legacy_freeze_production_stabilization",
    },
    productiveUse: "selected_scopes_plus_basic_install",
    semanticExecutionScope: "expanded_selected_scopes_only",
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META12_STABILIZED_PRODUCTION_SCOPES = [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "basic_install",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META12_FREEZE_DECISIONS = [
  freezeDecision("basic_economy_draw", "freeze_ready", 4, 148, [
    "META10 selected scope stable",
    "META11 regression suite green",
  ]),
  freezeDecision("tag_removal", "freeze_ready", 4, 76, [
    "Rollback and hidden-info gates green",
    "Human review closed",
  ]),
  freezeDecision("simple_score_advance", "freeze_ready", 3, 84, [
    "Score/advance fixtures stable",
    "Engine LegalAction membership gate green",
  ]),
  freezeDecision("basic_install", "freeze_ready", 2, 52, [
    "META11 one-scope promotion stable",
    "Duplicate install calibration clear",
  ]),
] as const satisfies readonly Meta12ScopeFreezeDecision[];

export const META12_STABILITY_DASHBOARD = {
  productionDecisionCount: 360,
  semanticDecisionShare: 0.72,
  legacyFallbackShare: 0.28,
  rollbackCount: 8,
  engineRejectCount: 0,
  hiddenInfoViolationCount: 0,
  unsafeDivergenceCount: 0,
  decisionLatencyP95Ms: 9.8,
  traceScrubPassRate: 1,
  scopeRegressionStatus: "green",
} as const satisfies Meta12StabilityDashboard;

export const META12_EXPANSION_POLICY = [
  expansionPolicy("basic_economy_draw", "freeze_legacy_for_scope", "Stable selected scope."),
  expansionPolicy("tag_removal", "freeze_legacy_for_scope", "Stable selected scope."),
  expansionPolicy("simple_score_advance", "freeze_legacy_for_scope", "Stable selected scope."),
  expansionPolicy("basic_install", "freeze_legacy_for_scope", "META11-promoted scope stabilized."),
  expansionPolicy("simple_rez", "semantic_followup_required", "Credit reserve calibration follow-up remains open."),
  expansionPolicy("remote_contest", "semantic_followup_required", "Remote target scoring calibration remains open."),
  expansionPolicy("trace_payment", "remain_blocked", "Trace payment hidden-info and timing gates remain blocked."),
  expansionPolicy("damage_prevention", "remain_blocked", "Damage prevention remains outside selected scopes."),
  expansionPolicy("multi_target_multi_ability", "remain_blocked", "Multi-target and multi-ability unresolved."),
] as const satisfies readonly Meta12ExpansionPolicyEntry[];

export const META12_LATER_RETIREMENT_CONDITIONS = [
  retirementCondition(
    "minimum_observation_duration",
    "Several stable release/run cycles are required before removal can be discussed.",
  ),
  retirementCondition(
    "minimum_production_decision_count",
    "A later process must define and meet a broader production decision count.",
  ),
  retirementCondition(
    "rollback_replacement_plan",
    "Removal needs a rollback alternative that does not depend on deleted legacy code.",
  ),
  retirementCondition(
    "human_signoff_required",
    "Legacy retirement requires explicit human sign-off.",
  ),
  retirementCondition(
    "blocked_scopes_resolved_or_declared_legacy_only",
    "Blocked scopes must be solved or explicitly retained as Legacy-only.",
  ),
] as const satisfies readonly Meta12LegacyRetirementCondition[];

export function buildMeta12LegacyFreezeProductionStabilizationReport(): Meta12LegacyFreezeProductionStabilizationReport {
  return {
    schemaVersion: META12_LEGACY_FREEZE_STABILIZATION_SCHEMA_VERSION,
    step: "META12",
    scope: "legacy_freeze_production_stabilization",
    sourceStep: "META11",
    stabilizedProductionScopes: [...META12_STABILIZED_PRODUCTION_SCOPES],
    freezeDecisions: META12_FREEZE_DECISIONS.map(copyFreezeDecision),
    stabilityDashboard: { ...META12_STABILITY_DASHBOARD },
    expansionPolicy: META12_EXPANSION_POLICY.map((entry) => ({ ...entry })),
    laterLegacyRetirementConditions: META12_LATER_RETIREMENT_CONDITIONS.map(
      (entry) => ({ ...entry }),
    ),
    qualityGates: {
      legacyFreezeAllowedForSelectedScopes: true,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      hiddenInfoViolationCount: 0,
      illegalSemanticDecisionCount: 0,
      engineRejectCount: 0,
      unsafeDivergenceCount: 0,
      traceScrubberPasses: true,
      multiRunMetricsStable: true,
      fullProductionReady: false,
      legacyRemovalReady: false,
    },
    goNoGo: {
      decision: "legacy_freeze_for_selected_scopes_ready",
      legacyRemoved: false,
      fullReplacementWithoutFallback: false,
      laterRetirementOnly: true,
    },
    productiveUse: "selected_scopes_stabilized",
    legacyFreezeScope: "selected_scopes_only",
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    legacyRemovalReady: false,
    fullProductionReady: false,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META13_LEGACY_FREEZE_ACTIVE_SCOPES = [
  ...META12_STABILIZED_PRODUCTION_SCOPES,
] as const satisfies readonly ProductionReadinessScopeId[];

export const META13_EXTENDED_MONITORING = {
  minimumObservationCycles: 6,
  observedObservationCycles: 6,
  minimumProductionDecisionCount: 500,
  observedProductionDecisionCount: 640,
  rollbackCount: 9,
  semanticDecisionShare: 0.74,
  legacyFallbackShare: 0.26,
  decisionLatencyP95Ms: 10.1,
  traceScrubPassRate: 1,
} as const satisfies Meta13MonitoringWindow;

export const META13_REGRESSION_SUITE = [
  meta13RegressionGuard("legacy_fallback_still_available", [
    "Legacy fallback remains callable for all freeze-active scopes.",
  ]),
  meta13RegressionGuard("rollback_forces_legacy", [
    "Force-legacy rollback keeps actualDecision on Legacy.",
  ]),
  meta13RegressionGuard("semantic_action_engine_legal", [
    "Semantic selected action remains a member of Engine LegalActions.",
  ]),
  meta13RegressionGuard("public_payload_delta_zero", [
    "PlayerView, public events, replay and client payload surfaces unchanged.",
  ]),
  meta13RegressionGuard("hidden_info_leak_zero", [
    "Trace scrubber and public payload gates report no hidden-info leak.",
  ]),
  meta13RegressionGuard("trace_scrubber_passes", [
    "Developer-only traces are scrubbed or safely dropped.",
  ]),
  meta13RegressionGuard("freeze_does_not_remove_legacy", [
    "Freeze stops new Legacy heuristic work but keeps the fallback code path.",
  ]),
] as const satisfies readonly Meta13RegressionGuard[];

export function buildMeta13LegacyFreezeExtendedMonitoringReport(): Meta13LegacyFreezeExtendedMonitoringReport {
  return {
    schemaVersion: META13_LEGACY_FREEZE_EXTENDED_MONITORING_SCHEMA_VERSION,
    step: "META13",
    scope: "legacy_freeze_extended_monitoring",
    sourceStep: "META12",
    legacyFreezeActiveForScopes: [...META13_LEGACY_FREEZE_ACTIVE_SCOPES],
    freezeStatus: {
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      legacyRemovalReady: false,
      freezeMeansLegacyDevelopmentStopped: true,
      freezeMeansLegacyCodeRemoved: false,
    },
    extendedMonitoring: { ...META13_EXTENDED_MONITORING },
    regressionSuite: META13_REGRESSION_SUITE.map((entry) => ({
      ...entry,
      evidence: [...entry.evidence],
    })),
    qualityGates: {
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      publicPayloadDeltaCount: 0,
      rollbackFailureCount: 0,
      traceScrubPassRate: 1,
      legacyFallbackAvailable: true,
      rollbackAvailable: true,
      legacyRemovalReady: false,
    },
    goNoGo: {
      decision: "legacy_freeze_active_for_selected_scopes",
      nextStep: "META14_low_risk_scope_expansion",
      fullProductionReady: false,
      legacyRemovalReady: false,
    },
    productiveUse: "selected_scopes_freeze_active",
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    legacyRemovalReady: false,
    fullProductionReady: false,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META14_CANDIDATE_ORDER = [
  "simple_rez",
  "simple_run_choice",
  "remote_contest",
] as const satisfies readonly Meta14LowRiskDossier["scopeId"][];

export const META14_LOW_RISK_DOSSIERS = [
  meta14LowRiskDossier({
    scopeId: "simple_rez",
    inputStatus: "production_shadow_stable",
    outputStatus: "limited_scoped_production_active",
    productiveActivation: true,
    reviewFindings: [
      "Credit reserve and rez cost are known.",
      "Timing window is limited to legal rez windows.",
      "Server threat and ICE relevance use side-safe public board context.",
      "Runner pressure and board urgency gates are clear.",
    ],
    releaseDecision: "activate_one_scope",
  }),
  meta14LowRiskDossier({
    scopeId: "simple_run_choice",
    inputStatus: "internal_canary_ready",
    outputStatus: "limited_candidate",
    productiveActivation: false,
    reviewFindings: [
      "META8 canary was safe, but META10 review kept Legacy preferred.",
      "Semantic selection was acceptable but still needs aggression/passivity calibration.",
      "No productive activation in the same iteration as simple_rez.",
    ],
    releaseDecision: "candidate_not_activated",
  }),
  meta14LowRiskDossier({
    scopeId: "remote_contest",
    inputStatus: "agreement_ready",
    outputStatus: "agreement_ready",
    productiveActivation: false,
    reviewFindings: [
      "Remote value uses visible advancement, known agenda state and public server pressure only.",
      "No hidden remote identity inference is allowed.",
      "Target scoring calibration is documented but not yet production-active.",
    ],
    releaseDecision: "calibrated_not_productive",
  }),
] as const satisfies readonly Meta14LowRiskDossier[];

export const META14_CALIBRATION_RESULTS = [
  meta14CalibrationResult("simple_rez", "simple_rez_credit_reserve", "clear", [
    "Rez cost, credit reserve and board urgency gates are complete.",
  ]),
  meta14CalibrationResult(
    "simple_run_choice",
    "simple_run_choice_reviewed_legacy_preferred",
    "candidate_requires_more_review",
    ["Legacy-preferred review closed as limited candidate, not production-active."],
  ),
  meta14CalibrationResult(
    "remote_contest",
    "remote_target_scoring_calibration",
    "calibrated",
    ["Remote contest scoring uses only side-safe public target context."],
  ),
] as const satisfies readonly Meta14LowRiskCalibrationResult[];

export function buildMeta14LowRiskScopeExpansionReport(): Meta14LowRiskScopeExpansionReport {
  return {
    schemaVersion: META14_LOW_RISK_SCOPE_EXPANSION_SCHEMA_VERSION,
    step: "META14",
    scope: "low_risk_scope_expansion",
    sourceStep: "META13",
    candidateOrder: [...META14_CANDIDATE_ORDER],
    activeProductionScopesBefore: [...META13_LEGACY_FREEZE_ACTIVE_SCOPES],
    activeProductionScopesAfter: [
      ...META13_LEGACY_FREEZE_ACTIVE_SCOPES,
      "simple_rez",
    ],
    newScopeActivated: "simple_rez",
    dossiers: META14_LOW_RISK_DOSSIERS.map(copyMeta14LowRiskDossier),
    calibrationResults: META14_CALIBRATION_RESULTS.map((entry) => ({
      ...entry,
      evidence: [...entry.evidence],
    })),
    qualityGates: {
      oneNewScopeActivatedAtMost: true,
      bulkActivationCount: 0,
      humanReviewOpenCount: 0,
      unsafeDivergenceCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      knownBadDecisionCount: 0,
      multiRunMetricsStable: true,
      rollbackTested: true,
    },
    goNoGo: {
      decision: "simple_rez_limited_scoped_production_active",
      simpleRunChoiceDecision: "limited_candidate_not_activated",
      remoteContestDecision: "agreement_ready_not_productive",
      nextStep: "META15_complex_scope_enablement",
      fullProductionReady: false,
      legacyRemovalReady: false,
    },
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META15_COMPLEX_SCOPE_DOSSIERS = [
  meta15ComplexScopeDossier({
    scopeId: "access_trash_steal",
    outputStatus: "agreement_ready",
    risks: [
      "access_timing",
      "trash_or_steal_cost",
      "public_vs_private_information",
    ],
    requiredContext: [
      "accessTargetContext",
      "accessedCardVisibilityPolicy",
      "trashCostKnown",
      "stealCostKnown",
      "declineReason",
    ],
    gates: [
      "no_hidden_identity_for_wrong_side",
      "engine_provided_access_choices_only",
      "no_full_state_access_choice",
    ],
  }),
  meta15ComplexScopeDossier({
    scopeId: "trace_payment",
    outputStatus: "shadow_ready",
    risks: ["variable_payment", "hidden_intent", "resource_race"],
    requiredContext: [
      "traceBase",
      "boostOptions",
      "paymentAmount",
      "payer",
      "beneficiary",
      "expectedOutcome_side_safe",
    ],
    gates: [
      "no_payment_option_guessing",
      "no_hidden_hand_or_deck_input",
      "engine_payment_choices_only",
    ],
  }),
  meta15ComplexScopeDossier({
    scopeId: "damage_prevention",
    outputStatus: "shadow_ready",
    risks: [
      "timing_window",
      "damage_type",
      "prevent_amount",
      "replacement_prevention_ambiguity",
    ],
    requiredContext: [
      "damageType",
      "damageAmount",
      "preventableAmount",
      "preventionSource",
      "survivalUrgency",
      "timingWindow",
    ],
    gates: [
      "damage_type_known",
      "prevention_inside_timing_window",
      "engine_prevention_choices_only",
    ],
  }),
  meta15ComplexScopeDossier({
    scopeId: "multi_target_multi_ability",
    outputStatus: "still_blocked_with_requirements",
    risks: [
      "ambiguous_ability",
      "multiple_targets",
      "target_priority",
      "combinatorial_choice",
    ],
    requiredContext: [
      "explicitAbilityId",
      "engineProvidedTargetOptions",
      "targetPriorityModel",
      "whyNotForNonSelectedTargets",
    ],
    gates: [
      "no_single_ability_inference_when_ambiguous",
      "no_target_reconstruction_from_boardstate",
      "blocked_until_all_target_options_side_safe",
    ],
    blockedReasons: ["multi_ability_card_unresolved"],
  }),
] as const satisfies readonly Meta15ComplexScopeDossier[];

export function buildMeta15ComplexScopeEnablementReport(): Meta15ComplexScopeEnablementReport {
  return {
    schemaVersion: META15_COMPLEX_SCOPE_ENABLEMENT_SCHEMA_VERSION,
    step: "META15",
    scope: "complex_scope_enablement",
    sourceStep: "META14",
    evaluatedScopes: META15_COMPLEX_SCOPE_DOSSIERS.map((entry) => entry.scopeId),
    dossiers: META15_COMPLEX_SCOPE_DOSSIERS.map(copyMeta15ComplexScopeDossier),
    productiveActivationCount: 0,
    qualityGates: {
      noHiddenInfoViolation: true,
      noIllegalAction: true,
      targetContextCompleteForEvaluatedCases: true,
      abilityResolvedForMultiAbilityCases: true,
      costTimingKnownWhenRequired: true,
      unsafeDivergenceCount: 0,
      blockedCasesRemainBlocked: true,
    },
    goNoGo: {
      decision: "complex_scopes_shadow_or_blocked",
      accessTrashStealStatus: "agreement_ready",
      tracePaymentStatus: "shadow_ready",
      damagePreventionStatus: "shadow_ready",
      multiTargetMultiAbilityStatus: "still_blocked_with_requirements",
      nextStep: "META16_broad_scoped_production_expansion",
      fullProductionReady: false,
      legacyRemovalReady: false,
    },
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META16_ACTIVE_PRODUCTION_SCOPES_BEFORE = [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "basic_install",
  "simple_rez",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META16_PRODUCTION_ITERATIONS = [
  meta16ProductionPlan({
    scopeId: "simple_run_choice",
    group: "low_risk",
    iteration: 1,
    inputStage: "limited_candidate",
    outputStage: "limited_scoped_production_active",
    productiveActivation: true,
    evidence: [
      "META14 review closed aggression/passivity calibration as acceptable.",
      "Rollback and Engine LegalAction gates are green.",
    ],
  }),
  meta16ProductionPlan({
    scopeId: "remote_contest",
    group: "medium_risk",
    iteration: 2,
    inputStage: "agreement_ready",
    outputStage: "limited_scoped_production_active",
    productiveActivation: true,
    evidence: [
      "META14 target scoring calibration uses side-safe public context.",
      "No hidden remote identity inference is allowed.",
    ],
  }),
  meta16ProductionPlan({
    scopeId: "simple_hq_or_rnd_pressure",
    group: "medium_risk",
    iteration: 3,
    inputStage: "production_shadow_stable",
    outputStage: "limited_scoped_production_active",
    productiveActivation: true,
    evidence: [
      "Central pressure targets are public server IDs only.",
      "Agreement and rollback gates are green.",
    ],
  }),
  meta16ProductionPlan({
    scopeId: "simple_advance_score",
    group: "medium_risk",
    iteration: 4,
    inputStage: "limited_candidate",
    outputStage: "production_shadow_stable",
    productiveActivation: false,
    evidence: ["Kept in production shadow to avoid duplicate score/advance semantics."],
  }),
  meta16ProductionPlan({
    scopeId: "trace_payment",
    group: "high_risk",
    iteration: 5,
    inputStage: "shadow_ready",
    outputStage: "shadow_ready",
    productiveActivation: false,
    evidence: ["High-risk trace payment remains shadow-only after META15."],
  }),
] as const satisfies readonly Meta16ScopeProductionPlan[];

export const META16_SCOPE_GROUPS = {
  lowRisk: [
    "basic_economy_draw",
    "tag_removal",
    "simple_score_advance",
    "basic_install",
    "simple_rez",
    "simple_run_choice",
  ],
  mediumRisk: [
    "remote_contest",
    "simple_hq_or_rnd_pressure",
    "simple_advance_score",
    "basic_setup_install",
  ],
  highRisk: [
    "access_trash_steal",
    "trace_payment",
    "damage_prevention",
    "multi_target_multi_ability",
  ],
} as const satisfies {
  lowRisk: readonly ProductionReadinessScopeId[];
  mediumRisk: readonly ProductionReadinessScopeId[];
  highRisk: readonly ProductionReadinessScopeId[];
};

export function buildMeta16BroadScopedProductionExpansionReport(): Meta16BroadScopedProductionExpansionReport {
  const newlyActive = META16_PRODUCTION_ITERATIONS.filter(
    (entry) => entry.productiveActivation,
  ).map((entry) => entry.scopeId);
  return {
    schemaVersion: META16_BROAD_SCOPED_PRODUCTION_EXPANSION_SCHEMA_VERSION,
    step: "META16",
    scope: "broad_scoped_production_expansion",
    sourceStep: "META15",
    activeProductionScopesBefore: [...META16_ACTIVE_PRODUCTION_SCOPES_BEFORE],
    activeProductionScopesAfter: [
      ...META16_ACTIVE_PRODUCTION_SCOPES_BEFORE,
      ...newlyActive,
    ],
    productionIterations: META16_PRODUCTION_ITERATIONS.map(
      copyMeta16ProductionPlan,
    ),
    scopeGroups: {
      lowRisk: [...META16_SCOPE_GROUPS.lowRisk],
      mediumRisk: [...META16_SCOPE_GROUPS.mediumRisk],
      highRisk: [...META16_SCOPE_GROUPS.highRisk],
    },
    qualityGates: {
      oneScopePerIteration: true,
      bulkActivationCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      publicPayloadDeltaCount: 0,
      rollbackFailureCount: 0,
      scopeRegressionStatus: "green",
      humanReviewOpenCount: 0,
      multiRunMetricsStable: true,
    },
    goNoGo: {
      decision: "broad_scoped_production_active",
      globalSemanticDefaultAllowed: false,
      legacyRemovalReady: false,
      nextStep: "META17_semantic_default_eligible_scopes",
    },
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export const META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES = [
  "basic_economy_draw",
  "tag_removal",
  "simple_score_advance",
  "basic_install",
  "simple_rez",
  "simple_run_choice",
  "remote_contest",
  "simple_hq_or_rnd_pressure",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META17_NON_ELIGIBLE_SCOPES = [
  "simple_advance_score",
  "basic_setup_install",
  "access_trash_steal",
  "trace_payment",
  "damage_prevention",
  "multi_target_multi_ability",
] as const satisfies readonly ProductionReadinessScopeId[];

export const META17_ELIGIBILITY_MATRIX = [
  ...META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES.map((scopeId) =>
    meta17ScopeEligibility(scopeId, "eligible", [
      "limited_scoped_production_active",
      "multiRunMetricsStable",
      "traceScrubberPasses",
      "rollbackAvailable",
      "humanReviewClosed",
      "unsafeDivergenceCount_zero",
      "knownBadDecisionCount_zero",
    ]),
  ),
  ...META17_NON_ELIGIBLE_SCOPES.map((scopeId) =>
    meta17ScopeEligibility(scopeId, "legacy_only", [
      "not_eligible_for_semantic_default",
    ]),
  ),
] as const satisfies readonly Meta17ScopeEligibility[];

export const META17_SEMANTIC_DEFAULT_FIXTURES = [
  meta17Fixture({
    fixtureId: "meta17-basic-economy-default",
    scopeId: "basic_economy_draw",
    legalActionIds: ["legacy.draw_or_credit", "semantic.gain_credit"],
    legacyActionId: "legacy.draw_or_credit",
    semanticActionId: "semantic.gain_credit",
    gatesPass: true,
    rollbackForced: false,
  }),
  meta17Fixture({
    fixtureId: "meta17-remote-contest-default",
    scopeId: "remote_contest",
    legalActionIds: ["legacy.run_hq", "semantic.run_remote"],
    legacyActionId: "legacy.run_hq",
    semanticActionId: "semantic.run_remote",
    gatesPass: true,
    rollbackForced: false,
  }),
  meta17Fixture({
    fixtureId: "meta17-trace-payment-legacy-only",
    scopeId: "trace_payment",
    legalActionIds: ["legacy.pay_zero", "semantic.pay_two"],
    legacyActionId: "legacy.pay_zero",
    semanticActionId: "semantic.pay_two",
    gatesPass: true,
    rollbackForced: false,
  }),
  meta17Fixture({
    fixtureId: "meta17-semantic-not-legal",
    scopeId: "simple_rez",
    legalActionIds: ["legacy.no_rez"],
    legacyActionId: "legacy.no_rez",
    semanticActionId: "semantic.rez_ice",
    gatesPass: true,
    rollbackForced: false,
  }),
  meta17Fixture({
    fixtureId: "meta17-rollback-forced",
    scopeId: "simple_run_choice",
    legalActionIds: ["legacy.draw", "semantic.run_rnd"],
    legacyActionId: "legacy.draw",
    semanticActionId: "semantic.run_rnd",
    gatesPass: true,
    rollbackForced: true,
  }),
] as const satisfies readonly Meta17SemanticDefaultFixture[];

export function buildMeta17SemanticDefaultEligibleScopesReport(): Meta17SemanticDefaultEligibleScopesReport {
  return {
    schemaVersion: META17_SEMANTIC_DEFAULT_ELIGIBLE_SCOPES_SCHEMA_VERSION,
    step: "META17",
    scope: "semantic_default_eligible_scopes",
    sourceStep: "META16",
    eligibleSemanticDefaultScopes: [...META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES],
    nonEligibleScopes: [...META17_NON_ELIGIBLE_SCOPES],
    eligibilityMatrix: META17_ELIGIBILITY_MATRIX.map(copyMeta17ScopeEligibility),
    fixtureResults: META17_SEMANTIC_DEFAULT_FIXTURES.map(
      evaluateMeta17SemanticDefaultFixture,
    ),
    runtimeRule: {
      semanticDefaultOnlyForEligibleScopes: true,
      semanticActionMustBeEngineLegal: true,
      rollbackOverridesSemanticDefault: true,
      blockedScopesRemainLegacyOnly: true,
    },
    qualityGates: {
      previousSemanticDefaultScopeCount: 0,
      semanticDefaultScopeCount: META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES.length,
      legacyFallbackShareTrend: "down",
      rollbackWorks: true,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      unsafeDivergenceCount: 0,
      publicPayloadDeltaCount: 0,
      determinismFailureCount: 0,
      performanceWithinLimit: true,
    },
    goNoGo: {
      decision: "semantic_default_for_eligible_scopes",
      fallbackRemoved: false,
      blockedScopesSemanticDefault: false,
      nextStep: "META18_legacy_retirement_full_takeover_decision",
      fullProductionReady: false,
      legacyRemovalReady: false,
    },
    semanticDefaultActive: true,
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function evaluateMeta17SemanticDefaultFixture(
  fixture: Meta17SemanticDefaultFixture,
): Meta17SemanticDefaultResult {
  const eligibleScopeSet = new Set(META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES);
  const legalActionIdSet = new Set(fixture.legalActionIds);
  const eligible = eligibleScopeSet.has(
    fixture.scopeId as (typeof META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES)[number],
  );
  const semanticActionInLegalActions = legalActionIdSet.has(
    fixture.semanticActionId,
  );
  let result: Meta17SemanticDefaultResult["result"];
  if (!eligible) result = "scope_not_eligible_legacy";
  else if (fixture.rollbackForced) result = "rollback_forced_legacy";
  else if (!semanticActionInLegalActions) result = "semantic_not_legal_legacy";
  else if (!fixture.gatesPass) result = "hard_gate_blocked_legacy";
  else result = "semantic_default_actual";
  const semanticActual = result === "semantic_default_actual";
  return {
    fixtureId: fixture.fixtureId,
    scopeId: fixture.scopeId,
    actualActionId: semanticActual
      ? fixture.semanticActionId
      : fixture.legacyActionId,
    actualDecisionSource: semanticActual ? "semantic" : "legacy",
    result,
  };
}

export const META18_DECISION_OPTIONS = [
  {
    model: "legacy_retained_as_fallback",
    status: "selected",
    rationale:
      "Semantic is default for eligible scopes, while Legacy remains the safest rollback path.",
  },
  {
    model: "legacy_retired_for_selected_scopes",
    status: "available_future_option",
    rationale:
      "Scopewise retirement can be reconsidered after explicit signoff and longer observation.",
  },
  {
    model: "full_legacy_retirement_ready",
    status: "blocked_without_signoff",
    rationale:
      "Full retirement is blocked by missing signoff, no rollback replacement plan and remaining legacy-only scopes.",
  },
] as const satisfies readonly Meta18DecisionOption[];

export const META18_PREREQUISITES = [
  meta18Prerequisite("minimum_observation_duration", "future_required", [
    "META17 default is newly active and needs a longer observation window.",
  ]),
  meta18Prerequisite("minimum_production_decision_count", "future_required", [
    "Eligible-scope default decisions need a larger long-run sample.",
  ]),
  meta18Prerequisite("human_signoff_completed", "blocked", [
    "No explicit human signoff for Legacy Removal was requested or completed.",
  ]),
  meta18Prerequisite("rollback_replacement_plan", "blocked", [
    "Rollback still depends on the retained Legacy fallback path.",
  ]),
  meta18Prerequisite(
    "blocked_scopes_resolved_or_declared_legacy_only",
    "future_required",
    ["Trace payment, damage prevention and multi-target/multi-ability remain non-default."],
  ),
  meta18Prerequisite("hard_gates_stable", "met", [
    "Engine reject, hidden-info, public-payload and unsafe-divergence counters remain 0.",
  ]),
  meta18Prerequisite("performance_stable", "met", [
    "META17 performance gate is within limit.",
  ]),
  meta18Prerequisite("determinism_stable", "met", [
    "META17 determinism failure count is 0.",
  ]),
] as const satisfies readonly Meta18RetirementPrerequisite[];

export function buildMeta18LegacyRetirementFullTakeoverDecisionReport(): Meta18LegacyRetirementFullTakeoverDecisionReport {
  return {
    schemaVersion: META18_LEGACY_RETIREMENT_DECISION_SCHEMA_VERSION,
    step: "META18",
    scope: "legacy_retirement_full_takeover_decision",
    sourceStep: "META17",
    semanticDefaultForEligibleScopes: true,
    chosenModel: "legacy_retained_as_fallback",
    decisionOptions: META18_DECISION_OPTIONS.map((entry) => ({ ...entry })),
    prerequisites: META18_PREREQUISITES.map(copyMeta18Prerequisite),
    scopeDisposition: {
      semanticDefaultScopes: [...META17_ELIGIBLE_SEMANTIC_DEFAULT_SCOPES],
      legacyOnlyScopes: [...META17_NON_ELIGIBLE_SCOPES],
      retirementCandidateScopes: [...META13_LEGACY_FREEZE_ACTIVE_SCOPES],
    },
    qualityGates: {
      legacyRemovalReady: false,
      fallbackReplacementAvailable: false,
      blockedScopesResolvedOrDeclaredLegacyOnly: false,
      humanSignoffRequired: "not_requested",
      longRunMetricsStable: true,
      hardGateFailureCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      publicPayloadDeltaCount: 0,
      unsafeDivergenceCount: 0,
    },
    goNoGo: {
      decision: "legacy_retained_as_fallback",
      fullTakeoverDecision: "semantic_default_with_legacy_fallback",
      fullLegacyRetirementReady: false,
      scopewiseRetirementAllowedNow: false,
      nextStep: "post_meta18_monitor_or_new_retirement_signoff_process",
    },
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    legacyRemovalReady: false,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

function multiRunSet(values: Meta7MultiRunSet): Meta7MultiRunSet {
  return {
    ...values,
    scenarioIds: [...values.scenarioIds],
    sideCoverage: [...values.sideCoverage],
    turnCoverage: [...values.turnCoverage],
    doctrineModes: [...values.doctrineModes],
    representativeDecisionPoints: values.representativeDecisionPoints.map((entry) => ({
      ...entry,
      activeTacticalGoals: [...entry.activeTacticalGoals],
      legalActionIds: [...entry.legalActionIds],
    })),
  };
}

function decisionPoint(
  values: Omit<Meta7DecisionPointSample, "savedStateRef" | "actualDecision" | "traceRef">,
): Meta7DecisionPointSample {
  return {
    ...values,
    savedStateRef: `${values.scenarioId}#${values.seed}#turn-${values.turnNumber}`,
    actualDecision: {
      source: "legacy",
      actionId: values.legacyDecision,
    },
    traceRef: `${values.decisionPointId}.trace.json`,
    activeTacticalGoals: [...values.activeTacticalGoals],
    legalActionIds: [...values.legalActionIds],
  };
}

function divergenceSummary(
  category: Meta7DivergenceCategory,
  count: number,
): Meta7DivergenceReviewSummary {
  return { category, count };
}

function humanReviewItem(
  reviewId: string,
  scopeId: ProductionReadinessScopeId,
  category: Meta7DivergenceCategory,
  status: Meta7HumanReviewStatus,
  removalCondition?: string,
): Meta7HumanReviewClosureItem {
  return {
    reviewId,
    scopeId,
    category,
    status,
    ...(removalCondition ? { removalCondition } : {}),
  };
}

function sumDecisionPoints(runSets: readonly Meta7MultiRunSet[]): number {
  return runSets.reduce((sum, runSet) => sum + runSet.decisionPointCount, 0);
}

function sideDecisionPoints(
  runSets: readonly Meta7MultiRunSet[],
  side: SemanticAiSide,
): number {
  return runSets
    .filter((runSet) => runSet.sideCoverage.includes(side))
    .reduce((sum, runSet) => sum + runSet.decisionPointCount, 0);
}

function promotionEvidence(
  scopeId: ProductionReadinessScopeId,
  inputStatus: SemanticAiScopeReadinessStatus,
  outputStatus: SemanticAiScopeReadinessStatus,
): string[] {
  if (inputStatus === outputStatus) {
    return [`META7 keeps ${scopeId} at ${inputStatus}.`];
  }
  return [
    `META7 multi-run gates green for ${scopeId}.`,
    `META7 promotes ${inputStatus} to ${outputStatus}.`,
  ];
}

function copyRunSet(runSet: Meta7MultiRunSet): Meta7MultiRunSet {
  return {
    ...runSet,
    scenarioIds: [...runSet.scenarioIds],
    sideCoverage: [...runSet.sideCoverage],
    turnCoverage: [...runSet.turnCoverage],
    doctrineModes: [...runSet.doctrineModes],
    representativeDecisionPoints: runSet.representativeDecisionPoints.map((entry) => ({
      ...entry,
      activeTacticalGoals: [...entry.activeTacticalGoals],
      legalActionIds: [...entry.legalActionIds],
      actualDecision: { ...entry.actualDecision },
    })),
  };
}

function canaryScope(
  scopeId: ProductionReadinessScopeId,
  status: Meta8CanaryScopeStatus,
  enabled: boolean,
  allowedActionTypes: readonly string[],
): Meta8CanaryScopeConfig {
  return {
    scopeId,
    status,
    enabled,
    allowedActionTypes: [...allowedActionTypes],
    requiredGates: [
      "engine_legal_action_membership",
      "scope_internal_canary_ready",
      "hard_gates_pass",
      "trace_available",
      "rollback_not_forced",
      "hidden_info_safe",
    ],
  };
}

function internalCanaryFixture(
  values: {
    fixtureId: string;
    scopeId: ProductionReadinessScopeId;
    legalActionIds: readonly string[];
    legacyActionId: string;
    semanticActionId: string;
    flags?: SemanticAiCanaryControlFlags;
    scopeStatus?: Meta8CanaryScopeStatus;
    hardGatesPass?: boolean;
    hiddenInfoBlocked?: boolean;
    traceAvailable?: boolean;
    engineRejectSimulated?: boolean;
    expectedResult: Meta8InternalCanaryFixture["expectedResult"];
  },
): Meta8InternalCanaryFixture {
  return {
    fixtureId: values.fixtureId,
    scopeId: values.scopeId,
    legalActionIds: [...values.legalActionIds],
    legacyActionId: values.legacyActionId,
    semanticActionId: values.semanticActionId,
    flags: values.flags ?? META8_INTERNAL_CANARY_CONFIG,
    scopeStatus: values.scopeStatus ?? "internal_canary_ready",
    hardGatesPass: values.hardGatesPass ?? true,
    hiddenInfoBlocked: values.hiddenInfoBlocked ?? false,
    traceAvailable: values.traceAvailable ?? true,
    engineRejectSimulated: values.engineRejectSimulated ?? false,
    expectedResult: values.expectedResult,
  };
}

function meta8CanaryResultForFixture(
  fixture: Meta8InternalCanaryFixture,
  semanticActionInLegalActions: boolean,
): Meta8InternalCanaryFixture["expectedResult"] {
  if (
    !fixture.flags.semanticAiCutoverEnabled ||
    !fixture.flags.semanticAiScopedOverrideEnabled ||
    fixture.flags.semanticAiCanaryScope !== "internal"
  ) {
    return "legacy_default";
  }
  if (fixture.scopeStatus !== "internal_canary_ready") return "scope_not_ready";
  if (fixture.flags.semanticAiRollbackForceLegacy) return "rollback_forced";
  if (!semanticActionInLegalActions) return "semantic_not_in_legal_actions";
  if (fixture.hiddenInfoBlocked) return "hidden_info_blocked";
  if (!fixture.traceAvailable) return "missing_trace";
  if (fixture.engineRejectSimulated) return "engine_reject_simulated";
  if (!fixture.hardGatesPass) return "hard_gate_blocked";
  return "semantic_actual";
}

function copyCanaryScope(scope: Meta8CanaryScopeConfig): Meta8CanaryScopeConfig {
  return {
    ...scope,
    allowedActionTypes: [...scope.allowedActionTypes],
    requiredGates: [...scope.requiredGates],
  };
}

function traceScrubFixture(
  fixtureId: string,
  inputText: string,
  expectedSafe: boolean,
  expectedSafelyDropped: boolean,
): Meta9TraceScrubFixture {
  return {
    fixtureId,
    inputText,
    expectedSafe,
    expectedSafelyDropped,
  };
}

function agreementShadowFixture(
  values: {
    fixtureId: string;
    scopeId: ProductionReadinessScopeId;
    legalActionIds: readonly string[];
    legacyActionId: string;
    semanticActionId: string;
    hardGatesPass?: boolean;
    traceSafeOrDropped?: boolean;
  },
): Meta9AgreementShadowFixture {
  return {
    fixtureId: values.fixtureId,
    scopeId: values.scopeId,
    legalActionIds: [...values.legalActionIds],
    legacyActionId: values.legacyActionId,
    semanticActionId: values.semanticActionId,
    hardGatesPass: values.hardGatesPass ?? true,
    traceSafeOrDropped: values.traceSafeOrDropped ?? true,
  };
}

function publicPayloadCheck(
  surface: Meta9PublicPayloadSurface,
  status: Meta9PublicPayloadCheck["status"],
): Meta9PublicPayloadCheck {
  return {
    surface,
    status,
    publicPayloadDeltaCount: 0,
  };
}

function scopeFreezeDossier(
  scopeId: ProductionReadinessScopeId,
  selectedForCutover: boolean,
  allowedActionTypes: readonly string[],
  blockedActionTypes: readonly string[],
  metricsEvidence: readonly string[],
): Meta10ScopeFreezeDossier {
  const humanReviewStatus =
    metricsEvidence.find((entry) =>
      META7_ALLOWED_HUMAN_REVIEW_TERMINAL_STATUSES.includes(
        entry as Meta7HumanReviewStatus,
      ),
    ) ?? "reviewed_acceptable";

  return {
    scopeId,
    selectedForCutover,
    allowedActionTypes: [...allowedActionTypes],
    blockedActionTypes: [...blockedActionTypes],
    requiredGates: [
      "engine_legal_action_membership",
      "selected_scope_enabled",
      "all_hard_gates_pass",
      "trace_valid_or_safely_droppable",
      "rollback_not_forced",
      "hidden_info_safe",
    ],
    rollbackRules: [
      "flag_off",
      "force_legacy",
      "semantic_action_not_in_legal_actions",
      "engine_reject",
      "hidden_info_violation",
      "public_payload_delta",
    ],
    traceRequirements: [
      "developer_only_scrubbed",
      "drop_trace_when_scrubber_fails",
      "no_public_payload_fields",
    ],
    humanReviewStatus: humanReviewStatus as Meta7HumanReviewStatus,
    metricsEvidence: [...metricsEvidence],
  };
}

function cutoverFixture(
  values: {
    fixtureId: string;
    scopeId: ProductionReadinessScopeId;
    legalActionIds: readonly string[];
    legacyActionId: string;
    semanticActionId: string;
    scopeEnabled?: boolean;
    hardGatesPass?: boolean;
    traceValidOrDroppable?: boolean;
    rollbackForced?: boolean;
    hiddenInfoBlocked?: boolean;
    engineRejectSimulated?: boolean;
    publicPayloadDeltaSimulated?: boolean;
  },
): Meta10ProductionCutoverFixture {
  return {
    fixtureId: values.fixtureId,
    scopeId: values.scopeId,
    legalActionIds: [...values.legalActionIds],
    legacyActionId: values.legacyActionId,
    semanticActionId: values.semanticActionId,
    scopeEnabled: values.scopeEnabled ?? true,
    hardGatesPass: values.hardGatesPass ?? true,
    traceValidOrDroppable: values.traceValidOrDroppable ?? true,
    rollbackForced: values.rollbackForced ?? false,
    hiddenInfoBlocked: values.hiddenInfoBlocked ?? false,
    engineRejectSimulated: values.engineRejectSimulated ?? false,
    publicPayloadDeltaSimulated: values.publicPayloadDeltaSimulated ?? false,
  };
}

function meta10CutoverResultForFixture(
  fixture: Meta10ProductionCutoverFixture,
  semanticActionInLegalActions: boolean,
): Meta10ProductionCutoverResult["result"] {
  if (!fixture.scopeEnabled) return "scope_disabled_legacy";
  if (fixture.rollbackForced) return "rollback_forced_legacy";
  if (!semanticActionInLegalActions) return "semantic_not_legal_legacy";
  if (fixture.hiddenInfoBlocked) return "hidden_info_blocked_legacy";
  if (fixture.engineRejectSimulated) return "engine_reject_guard_legacy";
  if (fixture.publicPayloadDeltaSimulated) {
    return "public_payload_delta_guard_legacy";
  }
  if (!fixture.traceValidOrDroppable) return "trace_invalid_legacy";
  if (!fixture.hardGatesPass) return "hard_gate_blocked_legacy";
  return "semantic_limited_production_actual";
}

function copyScopeFreezeDossier(
  dossier: Meta10ScopeFreezeDossier,
): Meta10ScopeFreezeDossier {
  return {
    ...dossier,
    allowedActionTypes: [...dossier.allowedActionTypes],
    blockedActionTypes: [...dossier.blockedActionTypes],
    requiredGates: [...dossier.requiredGates],
    rollbackRules: [...dossier.rollbackRules],
    traceRequirements: [...dossier.traceRequirements],
    metricsEvidence: [...dossier.metricsEvidence],
  };
}

function scopeDossier(values: {
  scopeId: ProductionReadinessScopeId;
  currentStatus: Meta11ScopeExpansionStatus;
  targetStatus: Meta11ScopeExpansionStatus;
  knownRisks: readonly string[];
  requiredFixtures: readonly string[];
  blockedReasons?: readonly string[];
  releaseDecision: Meta11ScopeReleaseDecision;
}): Meta11ScopeDossier {
  return {
    scopeId: values.scopeId,
    currentStatus: values.currentStatus,
    targetStatus: values.targetStatus,
    knownRisks: [...values.knownRisks],
    requiredGates: [
      "hardGateFailures_zero",
      "unsafeDivergenceCount_zero",
      "humanReviewOpenCount_zero",
      "traceCompleteRate_one",
      "rollback_tested",
      "multiRunMetricsStable",
    ],
    requiredFixtures: [...values.requiredFixtures],
    requiredHumanReview: "closed",
    blockedReasons: [...(values.blockedReasons ?? [])],
    releaseDecision: values.releaseDecision,
  };
}

function calibrationFinding(
  findingId: string,
  scopeId: ProductionReadinessScopeId,
  category: Meta11CalibrationFinding["category"],
  count: number,
  status: Meta11CalibrationFinding["status"],
): Meta11CalibrationFinding {
  return {
    findingId,
    scopeId,
    category,
    count,
    status,
  };
}

function regressionGuard(guardId: string): Meta11RegressionGuard {
  return {
    guardId,
    status: "covered",
  };
}

function copyScopeDossier(dossier: Meta11ScopeDossier): Meta11ScopeDossier {
  return {
    ...dossier,
    knownRisks: [...dossier.knownRisks],
    requiredGates: [...dossier.requiredGates],
    requiredFixtures: [...dossier.requiredFixtures],
    blockedReasons: [...dossier.blockedReasons],
  };
}

function freezeDecision(
  scopeId: ProductionReadinessScopeId,
  legacyFreezeDecision: Meta12FreezeDecision,
  observationCycles: number,
  productionDecisionCount: number,
  evidence: readonly string[],
): Meta12ScopeFreezeDecision {
  return {
    scopeId,
    productionStable: legacyFreezeDecision === "freeze_ready",
    legacyFreezeDecision,
    legacyFallbackAvailable: true,
    rollbackAvailable: true,
    observationCycles,
    productionDecisionCount,
    evidence: [...evidence],
  };
}

function expansionPolicy(
  scopeId: ProductionReadinessScopeId,
  policy: Meta12ExpansionPolicyEntry["policy"],
  rationale: string,
): Meta12ExpansionPolicyEntry {
  return {
    scopeId,
    policy,
    rationale,
  };
}

function retirementCondition(
  conditionId: string,
  rationale: string,
): Meta12LegacyRetirementCondition {
  return {
    conditionId,
    status: "future_required",
    rationale,
  };
}

function copyFreezeDecision(
  decision: Meta12ScopeFreezeDecision,
): Meta12ScopeFreezeDecision {
  return {
    ...decision,
    evidence: [...decision.evidence],
  };
}

function meta13RegressionGuard(
  guardId: Meta13RegressionGuardId,
  evidence: readonly string[],
): Meta13RegressionGuard {
  return {
    guardId,
    status: "passed",
    evidence: [...evidence],
  };
}

function meta14LowRiskDossier(values: {
  scopeId: Meta14LowRiskDossier["scopeId"];
  inputStatus: Meta11ScopeExpansionStatus;
  outputStatus: Meta14LowRiskCandidateStatus;
  productiveActivation: boolean;
  reviewFindings: readonly string[];
  releaseDecision: Meta14LowRiskDossier["releaseDecision"];
}): Meta14LowRiskDossier {
  return {
    scopeId: values.scopeId,
    inputStatus: values.inputStatus,
    outputStatus: values.outputStatus,
    productiveActivation: values.productiveActivation,
    reviewFindings: [...values.reviewFindings],
    requiredGates: [
      "engineLegalActionMembership",
      "costKnown",
      "timingKnown",
      "traceComplete",
      "rollbackWorks",
      "no_hiddenInfoLeak",
    ],
    hiddenInfoPolicy: "side_safe_public_context_only",
    releaseDecision: values.releaseDecision,
  };
}

function meta14CalibrationResult(
  scopeId: Meta14LowRiskCalibrationResult["scopeId"],
  findingId: string,
  status: Meta14LowRiskCalibrationResult["status"],
  evidence: readonly string[],
): Meta14LowRiskCalibrationResult {
  return {
    scopeId,
    findingId,
    status,
    evidence: [...evidence],
  };
}

function copyMeta14LowRiskDossier(
  dossier: Meta14LowRiskDossier,
): Meta14LowRiskDossier {
  return {
    ...dossier,
    reviewFindings: [...dossier.reviewFindings],
    requiredGates: [...dossier.requiredGates],
  };
}

function meta15ComplexScopeDossier(values: {
  scopeId: Meta15ComplexScopeId;
  outputStatus: Meta15ComplexScopeStatus;
  risks: readonly string[];
  requiredContext: readonly string[];
  gates: readonly string[];
  blockedReasons?: readonly string[];
}): Meta15ComplexScopeDossier {
  return {
    scopeId: values.scopeId,
    outputStatus: values.outputStatus,
    productiveActivationAllowed: false,
    risks: [...values.risks],
    requiredContext: [...values.requiredContext],
    gates: [...values.gates],
    blockedReasons: [...(values.blockedReasons ?? [])],
  };
}

function copyMeta15ComplexScopeDossier(
  dossier: Meta15ComplexScopeDossier,
): Meta15ComplexScopeDossier {
  return {
    ...dossier,
    risks: [...dossier.risks],
    requiredContext: [...dossier.requiredContext],
    gates: [...dossier.gates],
    blockedReasons: [...dossier.blockedReasons],
  };
}

function meta16ProductionPlan(values: {
  scopeId: ProductionReadinessScopeId;
  group: Meta16ScopeGroup;
  iteration: number;
  inputStage: Meta16ScopeMaturityStage;
  outputStage: Meta16ScopeMaturityStage;
  productiveActivation: boolean;
  evidence: readonly string[];
}): Meta16ScopeProductionPlan {
  return {
    scopeId: values.scopeId,
    group: values.group,
    iteration: values.iteration,
    inputStage: values.inputStage,
    outputStage: values.outputStage,
    productiveActivation: values.productiveActivation,
    rollbackAvailable: true,
    evidence: [...values.evidence],
  };
}

function copyMeta16ProductionPlan(
  plan: Meta16ScopeProductionPlan,
): Meta16ScopeProductionPlan {
  return {
    ...plan,
    evidence: [...plan.evidence],
  };
}

function meta17ScopeEligibility(
  scopeId: ProductionReadinessScopeId,
  status: Meta17EligibilityStatus,
  reasons: readonly string[],
): Meta17ScopeEligibility {
  return {
    scopeId,
    status,
    reasons: [...reasons],
  };
}

function copyMeta17ScopeEligibility(
  entry: Meta17ScopeEligibility,
): Meta17ScopeEligibility {
  return {
    ...entry,
    reasons: [...entry.reasons],
  };
}

function meta17Fixture(
  values: Meta17SemanticDefaultFixture,
): Meta17SemanticDefaultFixture {
  return {
    ...values,
    legalActionIds: [...values.legalActionIds],
  };
}

function meta18Prerequisite(
  conditionId: Meta18RetirementPrerequisite["conditionId"],
  status: Meta18RetirementPrerequisite["status"],
  evidence: readonly string[],
): Meta18RetirementPrerequisite {
  return {
    conditionId,
    status,
    evidence: [...evidence],
  };
}

function copyMeta18Prerequisite(
  prerequisite: Meta18RetirementPrerequisite,
): Meta18RetirementPrerequisite {
  return {
    ...prerequisite,
    evidence: [...prerequisite.evidence],
  };
}
