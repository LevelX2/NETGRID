import { CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS } from "./controlled-shadow-mode";
import type { ShadowModeNoEffectFlags } from "./controlled-shadow-mode";
import type { ActionGateResult } from "./action-semantic-candidate";

export const META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION =
  "meta1-deck-doctrine-tactical-goal-engine-v0" as const;

export const META2_SEMANTIC_DECISION_CORE_SCHEMA_VERSION =
  "meta2-semantic-decision-core-quality-calibration-v0" as const;

export const META3_CUTOVER_SAFETY_ENVELOPE_SCHEMA_VERSION =
  "meta3-cutover-safety-envelope-v0" as const;

export const META4_AGREEMENT_ONLY_CANARY_SCHEMA_VERSION =
  "meta4-agreement-only-runtime-canary-v0" as const;

export type SemanticAiSide = "runner" | "corp";

export type SemanticAiConfidence = "low" | "medium" | "high";

export type StrategyHypothesis = {
  strategyId: string;
  role: "primary" | "secondary" | "support" | "candidate" | "deferred";
  confidence: SemanticAiConfidence;
  anchorCards: string[];
  payoffCards: string[];
  enablerCards: string[];
  supportCards: string[];
  evidenceSignals: string[];
  missingRequirements: string[];
};

export type SupportPackage = {
  packageId:
    | "economy"
    | "draw"
    | "search"
    | "breaker_coverage"
    | "tag_defense"
    | "damage_defense"
    | "remote_contest"
    | "central_pressure"
    | "ice_tax"
    | "rez_economy"
    | "score_support"
    | "tag_punish"
    | "damage_kill";
  cards: string[];
  signals: string[];
  strength: "weak" | "medium" | "strong";
};

export type CardAnchorEvidence = {
  cardId: string;
  anchorKind: "strategy_anchor" | "payoff" | "enabler" | "support";
  signals: string[];
};

export type MissingPieceEvidence = {
  pieceId: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export type DeckRiskProfile = {
  riskId: string;
  severity: "low" | "medium" | "high";
  evidence: string[];
};

export type DeckConstraintProfile = {
  constraintId: string;
  status: "satisfied" | "unsatisfied" | "unknown";
  evidence: string[];
};

export type DeckStrategicProfile = {
  profileId: string;
  side: SemanticAiSide;
  sourceDeckId?: string;
  primaryStrategies: StrategyHypothesis[];
  secondaryStrategies: StrategyHypothesis[];
  supportPackages: SupportPackage[];
  keyAnchors: CardAnchorEvidence[];
  missingPieces: MissingPieceEvidence[];
  riskProfile: DeckRiskProfile[];
  constraintProfile: DeckConstraintProfile[];
  neutralDoctrine: boolean;
  confidence: SemanticAiConfidence;
  evidence: string[];
  warnings: string[];
};

export type TacticalPriority = {
  priorityId: SemanticTacticalGoalFamily;
  priority: TacticalGoalPriority;
  rationale: string;
};

export type TacticalAvoidance = {
  avoidanceId: string;
  targetGoalFamily: SemanticTacticalGoalFamily;
  rationale: string;
};

export type StrategyPlan = {
  strategyId: string;
  goalFamilies: SemanticTacticalGoalFamily[];
  evidence: string[];
};

export type DoctrinePivotRule = {
  pivotId: string;
  trigger:
    | "runner_near_flatline"
    | "runner_tagged"
    | "corp_near_score_win"
    | "remote_threat_high"
    | "central_pressure_high"
    | "economy_critical"
    | "breaker_coverage_missing"
    | "scoring_window_open"
    | "punish_window_open";
  effect:
    | "raise_goal_priority"
    | "lower_goal_priority"
    | "block_goal"
    | "force_survival_goal";
  targetGoalFamily: SemanticTacticalGoalFamily;
  rationale: string;
};

export type DeckDoctrine = {
  doctrineId: string;
  side: SemanticAiSide;
  strategicProfileId: string;
  primaryPlan?: StrategyPlan;
  secondaryPlans: StrategyPlan[];
  supportPriorities: TacticalPriority[];
  avoidances: TacticalAvoidance[];
  pivotRules: DoctrinePivotRule[];
  earlyGamePriorities: TacticalPriority[];
  midGamePriorities: TacticalPriority[];
  lateGamePriorities: TacticalPriority[];
  confidence: SemanticAiConfidence;
  neutralDoctrine: boolean;
  evidence: string[];
};

export type TacticalGoalPriority = "low" | "medium" | "high" | "critical";

export type SemanticTacticalGoalFamily =
  | "runner_survive"
  | "runner_remove_tags"
  | "runner_prevent_damage"
  | "runner_economy_stabilize"
  | "runner_draw_find_tools"
  | "runner_rig_setup"
  | "runner_breaker_coverage_code_gate"
  | "runner_breaker_coverage_sentry"
  | "runner_breaker_coverage_wall"
  | "runner_pressure_hq"
  | "runner_pressure_rnd"
  | "runner_contest_remote"
  | "runner_access_payoff"
  | "corp_economy_stabilize"
  | "corp_build_remote"
  | "corp_create_score_window"
  | "corp_score_agenda"
  | "corp_defend_hq"
  | "corp_defend_rnd"
  | "corp_rez_ice_tax"
  | "corp_tag_runner"
  | "corp_punish_tagged_runner"
  | "corp_damage_kill_window"
  | "corp_bait_remote";

export type TacticalGoalState = {
  goalInstanceId: string;
  goalFamily: SemanticTacticalGoalFamily;
  ownerSide: SemanticAiSide;
  lifecycle:
    | "proposed"
    | "active"
    | "progressing"
    | "blocked"
    | "satisfied"
    | "failed"
    | "expired";
  priority: TacticalGoalPriority;
  urgency: TacticalGoalPriority;
  createdOnTurn: number;
  lastUpdatedOnTurn: number;
  ttlTurns?: number;
  doctrineSource: string[];
  boardStateEvidence: string[];
  requiredConditions: string[];
  progressMarkers: string[];
  blockers: string[];
  supportedActionTypes: string[];
  supportedCandidateIds: string[];
  successCriteria: string[];
  failureCriteria: string[];
  whyActive: string[];
  whyBlocked: string[];
};

export type BoardstateOverrideExample = {
  exampleId: string;
  side: SemanticAiSide;
  doctrinePreference: SemanticTacticalGoalFamily;
  boardstateOverride: SemanticTacticalGoalFamily;
  pivotRuleId: string;
  rationale: string;
};

export type Meta1DeckDoctrineTacticalGoalEngineReport = {
  schemaVersion: typeof META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION;
  step: "META1";
  scope: "deck_doctrine_tactical_goal_engine_v0";
  inputBaseline: {
    previousReadiness: "broad_shadow_ready";
    sourceProcess: "AI061-SR-AI068-SR";
    cutoverAllowed: false;
  };
  schemaCoverage: {
    deckStrategicProfileSchema: true;
    deckDoctrineSchema: true;
    tacticalGoalStateSchema: true;
    neutralDoctrineRule: true;
    boardstatePivotRules: number;
    runnerGoalFamilies: number;
    corpGoalFamilies: number;
  };
  sampleProfiles: DeckStrategicProfile[];
  sampleDoctrines: DeckDoctrine[];
  tacticalGoalStates: TacticalGoalState[];
  boardstateOverrideExamples: BoardstateOverrideExample[];
  gates: {
    noProductiveActionSelection: true;
    noPlannerWeights: true;
    noRuntimeConsumer: true;
    noHiddenInfoProjection: true;
    neutralDoctrineDoesNotInventStrategy: true;
    boardstateMayOverrideDoctrine: true;
  };
  hardGates: {
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    runtimeConsumerCount: 0;
    actionSelectionCount: 0;
    plannerWeightChangeCount: 0;
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type SignalConsumerGroupId =
  | "economy"
  | "draw"
  | "setup_coverage"
  | "run_access"
  | "remote_contest"
  | "survival"
  | "corp_scoreline"
  | "ice_portfolio"
  | "tag_punish"
  | "damage_kill"
  | "target_selection"
  | "risk_management";

export type SignalConsumerGroupMatch = {
  groupId: SignalConsumerGroupId;
  matchedSignals: string[];
  strength: "weak" | "medium" | "strong";
  evidence: string[];
};

export type SemanticDecisionScoreStatus =
  | "not_scored"
  | "blocked_by_gate"
  | "blocked_by_gap"
  | "shadow_score_available";

export type SemanticDecisionScore = {
  candidateId: string;
  scoreStatus: SemanticDecisionScoreStatus;
  total?: number;
  components: {
    goalFit: number;
    doctrineFit: number;
    boardUrgency: number;
    reachability: number;
    costFit: number;
    timingFit: number;
    targetFit: number;
    riskPenalty: number;
    opportunityValue: number;
  };
  hardGateResults: ActionGateResult[];
  evidence: string[];
  whyNot?: string[];
};

export type WhyNotEntry = {
  candidateId: string;
  reasonCategory:
    | "blocked_by_gate"
    | "blocked_by_gap"
    | "lower_goal_fit"
    | "too_costly"
    | "too_risky"
    | "wrong_timing"
    | "target_mismatch"
    | "doctrine_less_relevant"
    | "boardstate_override";
  explanation: string[];
};

export type Meta2HumanReviewCategory =
  | "semantic_better"
  | "legacy_better"
  | "acceptable_difference"
  | "unsafe_divergence"
  | "bad_goal_priority"
  | "bad_risk_weight"
  | "bad_target_choice"
  | "missing_tactic_signal"
  | "missing_card_semantics"
  | "missing_action_context";

export type Meta2ArchetypeFixture = {
  fixtureId: string;
  side: SemanticAiSide;
  archetype:
    | "neutral_runner"
    | "economy_first_runner"
    | "rig_setup_runner"
    | "hq_pressure_runner"
    | "rnd_pressure_runner"
    | "remote_contest_runner"
    | "survival_runner"
    | "neutral_corp"
    | "remote_scoring_corp"
    | "ice_tax_corp"
    | "tag_punish_corp"
    | "damage_kill_corp"
    | "asset_economy_corp"
    | "central_stabilize_corp";
  expectedConsumerGroups: SignalConsumerGroupId[];
  expectedGoalFamilies: SemanticTacticalGoalFamily[];
  hiddenInfoPolicy: "public_or_actor_private_only";
};

export type Meta2BoardstateOverrideFixture = {
  fixtureId: string;
  side: SemanticAiSide;
  doctrinePreference: SemanticTacticalGoalFamily;
  boardstateGoal: SemanticTacticalGoalFamily;
  requiredPreferredActionType: string;
  rationale: string;
};

export type Meta2CandidateScoreFixture = {
  candidateId: string;
  actionId: string;
  actionType: string;
  legalActionMember: boolean;
  hiddenInfoSafe: boolean;
  reachabilityReady: boolean;
  costTimingReady: boolean;
  targetAbilityCardReady: boolean;
  matchedGoals: SemanticTacticalGoalFamily[];
  doctrineGoals: SemanticTacticalGoalFamily[];
  boardUrgency: TacticalGoalPriority;
  consumerGroupMatches: SignalConsumerGroupMatch[];
  riskPenalty: number;
  opportunityValue: number;
};

export type Meta2SemanticDecisionCoreReport = {
  schemaVersion: typeof META2_SEMANTIC_DECISION_CORE_SCHEMA_VERSION;
  step: "META2";
  scope: "semantic_decision_core_quality_calibration";
  sourceStep: "META1";
  consumerGroups: readonly SignalConsumerGroupId[];
  evaluationOrder: readonly string[];
  scoreSchema: {
    scoreStatusValues: readonly SemanticDecisionScoreStatus[];
    componentFields: readonly (keyof SemanticDecisionScore["components"])[];
    hardGateBlocksTotal: true;
    requiredEvidenceMissingBlocksByGap: true;
  };
  candidateScores: SemanticDecisionScore[];
  whyNot: WhyNotEntry[];
  archetypeFixtures: Meta2ArchetypeFixture[];
  boardstateOverrideFixtures: Meta2BoardstateOverrideFixture[];
  humanReviewCategories: readonly Meta2HumanReviewCategory[];
  summary: {
    archetypeFixtureCount: number;
    boardstateOverrideFixtureCount: number;
    shadowScoreAvailableCount: number;
    blockedByGateCount: number;
    blockedByGapCount: number;
    whyNotCount: number;
  };
  qualityGates: {
    unsafeDivergenceCount: 0;
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    unreachablePreferredActionCount: 0;
    scoreWithoutExplanationCount: 0;
    actualDecision: "legacy";
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type CutoverGate = {
  cutoverDesignAllowed: true;
  cutoverExecutionAllowed: false;
  productiveCutoverAllowed: false;
};

export type SemanticAiControlFlags = {
  semanticAiShadowModeEnabled: boolean;
  semanticAiCutoverEnabled: boolean;
  semanticAiAgreementOnlyMode: boolean;
  semanticAiScopedOverrideEnabled: boolean;
  semanticAiRollbackForceLegacy: boolean;
};

export type SemanticAiRollbackTrigger =
  | "semantic_action_not_in_legal_actions"
  | "hidden_info_gate_failure"
  | "illegal_semantic_decision"
  | "engine_reject"
  | "non_determinism"
  | "missing_trace"
  | "unknown_hard_gate"
  | "runtime_mutation"
  | "public_payload_delta"
  | "cost_timing_gate_unresolved_when_required";

export type SemanticAiScopeMatrix = {
  agreementOnlyScopes: string[];
  testOnlyOverrideScopes: string[];
  blockedScopes: string[];
};

export type SemanticDecisionAdapterInput = {
  legalActionIds: readonly string[];
  legacyActionId: string;
  semanticActionId?: string;
  hardGateStatus: "pass" | "blocked" | "unknown";
  traceAvailable: boolean;
};

export type SemanticDecisionAdapterResult = {
  legacyActionId: string;
  semanticActionId?: string;
  actualActionId: string;
  adapterStatus:
    | "legacy_only"
    | "semantic_valid_but_execution_disabled"
    | "semantic_not_in_legal_actions"
    | "rollback_forced";
  semanticActionInLegalActions: boolean;
  rollbackState: {
    forcedLegacy: true;
    triggers: SemanticAiRollbackTrigger[];
  };
};

export type SemanticAiTraceContract = {
  legacyActionId: string;
  semanticActionId?: string;
  actualActionId: string;
  featureFlags: SemanticAiControlFlags;
  scopeDecision: "agreement_only" | "test_only_override" | "blocked" | "legacy_only";
  adapterStatus: SemanticDecisionAdapterResult["adapterStatus"];
  hardGates: string[];
  rollbackState: SemanticDecisionAdapterResult["rollbackState"];
  candidateEvidence: string[];
  goalMatches: SemanticTacticalGoalFamily[];
  scoreBreakdown: SemanticDecisionScore["components"];
  whyNot: WhyNotEntry[];
  stateVersion: number;
  visibilityScope: "developer_only";
};

export type Meta3CutoverSafetyEnvelopeReport = {
  schemaVersion: typeof META3_CUTOVER_SAFETY_ENVELOPE_SCHEMA_VERSION;
  step: "META3";
  scope: "cutover_safety_envelope_design_only";
  cutoverGate: CutoverGate;
  defaultFlags: SemanticAiControlFlags;
  rollbackTriggers: readonly SemanticAiRollbackTrigger[];
  scopeMatrix: SemanticAiScopeMatrix;
  adapterSamples: SemanticDecisionAdapterResult[];
  traceContract: {
    requiredFields: readonly (keyof SemanticAiTraceContract)[];
    visibilityScope: "developer_only";
    publicPayloadChangesAllowed: false;
  };
  qualityGates: {
    productiveFlagsDefaultOff: true;
    rollbackForceLegacyDefaultTrue: true;
    adapterCannotCreateActions: true;
    cutoverExecutionAllowed: false;
    actualDecision: "legacy";
    publicPayloadDeltaCount: 0;
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    engineRejectCount: 0;
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type AgreementOnlyCanaryInput = {
  fixtureId: string;
  legalActionIds: readonly string[];
  legacyActionId: string;
  semanticActionId?: string;
  flags: SemanticAiControlFlags;
  hardGatesPass: boolean;
  hiddenInfoBlocked: boolean;
  rollbackForced: boolean;
  traceAvailable: boolean;
};

export type AgreementOnlyCanaryResult = {
  fixtureId: string;
  legacyActionId: string;
  semanticActionId?: string;
  actualActionId: string;
  result:
    | "default_legacy"
    | "same_action_confirmed"
    | "semantic_differs_legacy"
    | "semantic_not_in_legal_actions"
    | "hidden_info_blocked"
    | "rollback_forced"
    | "missing_trace";
  behaviorDelta: false;
  sameActionConfirmation: boolean;
  traceComplete: boolean;
  rollbackTriggers: SemanticAiRollbackTrigger[];
};

export type Meta4AgreementOnlyRuntimeCanaryReport = {
  schemaVersion: typeof META4_AGREEMENT_ONLY_CANARY_SCHEMA_VERSION;
  step: "META4";
  scope: "agreement_only_runtime_canary_contract";
  sourceStep: "META3";
  rule: "semantic_may_confirm_same_action_only";
  defaultConfig: SemanticAiControlFlags;
  fixtureResults: AgreementOnlyCanaryResult[];
  summary: {
    fixtureCount: number;
    sameActionConfirmationCount: number;
    semanticDifferingActionExecutedCount: 0;
    behaviorDeltaCount: 0;
    actualDecisionOverrideCount: 0;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    rollbackTested: true;
    defaultConfigLegacyOnly: true;
    traceCompleteRate: 1;
  };
  qualityGates: {
    behaviorDeltaCount: 0;
    actualDecisionOverrideCount: 0;
    semanticDifferingActionExecutedCount: 0;
    engineRejectCount: 0;
    hiddenInfoViolationCount: 0;
    traceCompleteRate: 1;
    rollbackTested: true;
    defaultConfigLegacyOnly: true;
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "test_harness_only";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const META1_RUNNER_GOAL_FAMILIES = [
  "runner_survive",
  "runner_remove_tags",
  "runner_prevent_damage",
  "runner_economy_stabilize",
  "runner_draw_find_tools",
  "runner_rig_setup",
  "runner_breaker_coverage_code_gate",
  "runner_breaker_coverage_sentry",
  "runner_breaker_coverage_wall",
  "runner_pressure_hq",
  "runner_pressure_rnd",
  "runner_contest_remote",
  "runner_access_payoff",
] as const satisfies readonly SemanticTacticalGoalFamily[];

export const META1_CORP_GOAL_FAMILIES = [
  "corp_economy_stabilize",
  "corp_build_remote",
  "corp_create_score_window",
  "corp_score_agenda",
  "corp_defend_hq",
  "corp_defend_rnd",
  "corp_rez_ice_tax",
  "corp_tag_runner",
  "corp_punish_tagged_runner",
  "corp_damage_kill_window",
  "corp_bait_remote",
] as const satisfies readonly SemanticTacticalGoalFamily[];

export const META1_PIVOT_RULES = [
  pivotRule(
    "meta1-runner-kill-risk-survival",
    "runner_near_flatline",
    "force_survival_goal",
    "runner_survive",
    "Visible kill risk overrides value runs and setup plans.",
  ),
  pivotRule(
    "meta1-runner-tag-removal",
    "runner_tagged",
    "raise_goal_priority",
    "runner_remove_tags",
    "Tags raise survival and tag-removal goals before value pressure.",
  ),
  pivotRule(
    "meta1-runner-remote-threat",
    "remote_threat_high",
    "raise_goal_priority",
    "runner_contest_remote",
    "Remote score threat can override central-pressure doctrine.",
  ),
  pivotRule(
    "meta1-runner-coverage-missing",
    "breaker_coverage_missing",
    "raise_goal_priority",
    "runner_rig_setup",
    "Missing breaker coverage redirects pressure plans into setup.",
  ),
  pivotRule(
    "meta1-corp-economy-critical",
    "economy_critical",
    "raise_goal_priority",
    "corp_economy_stabilize",
    "Credit shortage blocks score and rez plans until economy recovers.",
  ),
  pivotRule(
    "meta1-corp-central-pressure",
    "central_pressure_high",
    "raise_goal_priority",
    "corp_defend_rnd",
    "Open central pressure can override remote-building doctrine.",
  ),
  pivotRule(
    "meta1-corp-punish-window",
    "punish_window_open",
    "raise_goal_priority",
    "corp_punish_tagged_runner",
    "Tag-punish goals require a visible punish window and Runner tagged state.",
  ),
  pivotRule(
    "meta1-corp-no-punish-without-tag",
    "runner_tagged",
    "block_goal",
    "corp_punish_tagged_runner",
    "Without a tagged Runner, tag-punish doctrine stays blocked.",
  ),
] as const satisfies readonly DoctrinePivotRule[];

export const META1_BOARDSTATE_OVERRIDE_EXAMPLES = [
  boardstateOverride(
    "runner-rnd-pressure-contests-remote",
    "runner",
    "runner_pressure_rnd",
    "runner_contest_remote",
    "meta1-runner-remote-threat",
    "R&D pressure is downgraded when a visible remote threat can win first.",
  ),
  boardstateOverride(
    "corp-tag-punish-without-tag-blocked",
    "corp",
    "corp_punish_tagged_runner",
    "corp_tag_runner",
    "meta1-corp-no-punish-without-tag",
    "Punish is blocked until the Runner is actually tagged.",
  ),
  boardstateOverride(
    "runner-kill-threat-removes-tag",
    "runner",
    "runner_access_payoff",
    "runner_remove_tags",
    "meta1-runner-tag-removal",
    "Visible kill threat and tags override value access.",
  ),
  boardstateOverride(
    "corp-score-window-needs-economy",
    "corp",
    "corp_score_agenda",
    "corp_economy_stabilize",
    "meta1-corp-economy-critical",
    "A score window is not actionable when credits cannot pay required costs.",
  ),
] as const satisfies readonly BoardstateOverrideExample[];

export const META2_CONSUMER_GROUPS = [
  "economy",
  "draw",
  "setup_coverage",
  "run_access",
  "remote_contest",
  "survival",
  "corp_scoreline",
  "ice_portfolio",
  "tag_punish",
  "damage_kill",
  "target_selection",
  "risk_management",
] as const satisfies readonly SignalConsumerGroupId[];

export const META2_EVALUATION_ORDER = [
  "Engine LegalAction membership",
  "HiddenInfo / side visibility",
  "Reachability",
  "Cost / Timing",
  "Required Target / Ability / Card Semantics",
  "Board urgency",
  "TacticalGoal fit",
  "DeckDoctrine fit",
  "Risk / Opportunity",
  "WhyNot",
] as const;

export const META2_HUMAN_REVIEW_CATEGORIES = [
  "semantic_better",
  "legacy_better",
  "acceptable_difference",
  "unsafe_divergence",
  "bad_goal_priority",
  "bad_risk_weight",
  "bad_target_choice",
  "missing_tactic_signal",
  "missing_card_semantics",
  "missing_action_context",
] as const satisfies readonly Meta2HumanReviewCategory[];

export const META2_ARCHETYPE_FIXTURES = [
  archetypeFixture("neutral_runner", "runner", ["economy", "draw"], [
    "runner_economy_stabilize",
    "runner_draw_find_tools",
  ]),
  archetypeFixture("economy_first_runner", "runner", ["economy"], [
    "runner_economy_stabilize",
  ]),
  archetypeFixture("rig_setup_runner", "runner", ["setup_coverage"], [
    "runner_rig_setup",
  ]),
  archetypeFixture("hq_pressure_runner", "runner", ["run_access"], [
    "runner_pressure_hq",
  ]),
  archetypeFixture("rnd_pressure_runner", "runner", ["run_access"], [
    "runner_pressure_rnd",
  ]),
  archetypeFixture("remote_contest_runner", "runner", ["remote_contest"], [
    "runner_contest_remote",
  ]),
  archetypeFixture("survival_runner", "runner", ["survival"], [
    "runner_survive",
    "runner_remove_tags",
  ]),
  archetypeFixture("neutral_corp", "corp", ["economy", "ice_portfolio"], [
    "corp_economy_stabilize",
    "corp_defend_rnd",
  ]),
  archetypeFixture("remote_scoring_corp", "corp", ["corp_scoreline"], [
    "corp_build_remote",
    "corp_score_agenda",
  ]),
  archetypeFixture("ice_tax_corp", "corp", ["ice_portfolio"], [
    "corp_rez_ice_tax",
  ]),
  archetypeFixture("tag_punish_corp", "corp", ["tag_punish"], [
    "corp_tag_runner",
    "corp_punish_tagged_runner",
  ]),
  archetypeFixture("damage_kill_corp", "corp", ["damage_kill"], [
    "corp_damage_kill_window",
  ]),
  archetypeFixture("asset_economy_corp", "corp", ["economy"], [
    "corp_economy_stabilize",
  ]),
  archetypeFixture("central_stabilize_corp", "corp", ["ice_portfolio"], [
    "corp_defend_hq",
    "corp_defend_rnd",
  ]),
] as const satisfies readonly Meta2ArchetypeFixture[];

export const META2_BOARDSTATE_OVERRIDE_FIXTURES = [
  meta2OverrideFixture(
    "rnd-pressure-runner-must-contest-remote",
    "runner",
    "runner_pressure_rnd",
    "runner_contest_remote",
    "start_run",
    "Remote threat has higher board urgency than R&D pressure.",
  ),
  meta2OverrideFixture(
    "tag-punish-corp-without-tag-cannot-punish",
    "corp",
    "corp_punish_tagged_runner",
    "corp_tag_runner",
    "play_operation",
    "Punish goal is blocked until Runner is tagged.",
  ),
  meta2OverrideFixture(
    "runner-tagged-kill-threat-removes-tag",
    "runner",
    "runner_access_payoff",
    "runner_remove_tags",
    "remove_tag",
    "Survival and tag removal beat value access under visible kill threat.",
  ),
  meta2OverrideFixture(
    "corp-score-not-affordable-stabilizes-economy",
    "corp",
    "corp_score_agenda",
    "corp_economy_stabilize",
    "gain_credit",
    "Cost gate and economy criticality beat score preference.",
  ),
  meta2OverrideFixture(
    "runner-missing-breaker-coverage-prioritizes-setup",
    "runner",
    "runner_pressure_hq",
    "runner_rig_setup",
    "install_card",
    "Reachability blocks central pressure until coverage improves.",
  ),
  meta2OverrideFixture(
    "corp-open-rnd-prioritizes-central-defense",
    "corp",
    "corp_build_remote",
    "corp_defend_rnd",
    "install_card",
    "Open R&D pressure raises central defense over remote build.",
  ),
] as const satisfies readonly Meta2BoardstateOverrideFixture[];

export const META2_DEFAULT_SCORE_FIXTURES = [
  scoreFixture({
    candidateId: "meta2-runner-remove-tag",
    actionId: "legal.remove_tag.1",
    actionType: "remove_tag",
    matchedGoals: ["runner_remove_tags", "runner_survive"],
    doctrineGoals: ["runner_access_payoff"],
    boardUrgency: "critical",
    consumerGroupMatches: [
      consumerGroup("survival", ["tag.remove", "kill_risk.visible"], "strong"),
      consumerGroup("risk_management", ["avoid_damage"], "medium"),
    ],
    riskPenalty: 0,
    opportunityValue: 3,
  }),
  scoreFixture({
    candidateId: "meta2-runner-hidden-access-choice",
    actionId: "legal.access_hidden.1",
    actionType: "trash_accessed_card",
    hiddenInfoSafe: false,
    matchedGoals: ["runner_access_payoff"],
    doctrineGoals: ["runner_access_payoff"],
    boardUrgency: "medium",
    consumerGroupMatches: [
      consumerGroup("run_access", ["access.hidden_choice"], "weak"),
    ],
  }),
  scoreFixture({
    candidateId: "meta2-corp-score-gap",
    actionId: "legal.score_agenda.1",
    actionType: "score_agenda",
    costTimingReady: false,
    targetAbilityCardReady: false,
    matchedGoals: ["corp_score_agenda"],
    doctrineGoals: ["corp_score_agenda"],
    boardUrgency: "high",
    consumerGroupMatches: [
      consumerGroup("corp_scoreline", ["score.window"], "strong"),
    ],
    opportunityValue: 4,
  }),
] as const satisfies readonly Meta2CandidateScoreFixture[];

export const META3_CUTOVER_GATE = {
  cutoverDesignAllowed: true,
  cutoverExecutionAllowed: false,
  productiveCutoverAllowed: false,
} as const satisfies CutoverGate;

export const META3_DEFAULT_FLAGS = {
  semanticAiShadowModeEnabled: false,
  semanticAiCutoverEnabled: false,
  semanticAiAgreementOnlyMode: false,
  semanticAiScopedOverrideEnabled: false,
  semanticAiRollbackForceLegacy: true,
} as const satisfies SemanticAiControlFlags;

export const META3_ROLLBACK_TRIGGERS = [
  "semantic_action_not_in_legal_actions",
  "hidden_info_gate_failure",
  "illegal_semantic_decision",
  "engine_reject",
  "non_determinism",
  "missing_trace",
  "unknown_hard_gate",
  "runtime_mutation",
  "public_payload_delta",
  "cost_timing_gate_unresolved_when_required",
] as const satisfies readonly SemanticAiRollbackTrigger[];

export const META3_SCOPE_MATRIX = {
  agreementOnlyScopes: [
    "gain_credit",
    "draw_card",
    "end_turn",
    "simple_install",
    "simple_score_agenda",
  ],
  testOnlyOverrideScopes: [
    "basic_economy_vs_draw",
    "runner_remove_tag_when_tagged",
    "corp_basic_economy",
    "simple_score_when_legal",
    "simple_hq_or_rnd_run_when_goal_evidence_ready",
  ],
  blockedScopes: [
    "hidden_info_choices",
    "trace_payments",
    "x_values",
    "damage_prevention",
    "multi_target_unresolved",
    "multi_ability_unresolved",
    "access_hidden_choices",
  ],
} as const satisfies SemanticAiScopeMatrix;

export const META3_TRACE_CONTRACT_FIELDS = [
  "legacyActionId",
  "semanticActionId",
  "actualActionId",
  "featureFlags",
  "scopeDecision",
  "adapterStatus",
  "hardGates",
  "rollbackState",
  "candidateEvidence",
  "goalMatches",
  "scoreBreakdown",
  "whyNot",
  "stateVersion",
  "visibilityScope",
] as const satisfies readonly (keyof SemanticAiTraceContract)[];

export const META4_CANARY_FIXTURES = [
  agreementFixture({
    fixtureId: "meta4-default-config-legacy",
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.gain_credit.1",
    flags: META3_DEFAULT_FLAGS,
  }),
  agreementFixture({
    fixtureId: "meta4-same-action-confirmed",
    legacyActionId: "legal.draw_card.1",
    semanticActionId: "legal.draw_card.1",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: false,
    },
  }),
  agreementFixture({
    fixtureId: "meta4-semantic-differs-legacy",
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "legal.draw_card.1",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: false,
    },
  }),
  agreementFixture({
    fixtureId: "meta4-semantic-not-legal",
    legalActionIds: ["legal.gain_credit.1"],
    legacyActionId: "legal.gain_credit.1",
    semanticActionId: "semantic.created.action",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: false,
    },
  }),
  agreementFixture({
    fixtureId: "meta4-hidden-info-blocked",
    legacyActionId: "legal.decline_trash.1",
    semanticActionId: "legal.trash_accessed_card.1",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: false,
    },
    hiddenInfoBlocked: true,
  }),
  agreementFixture({
    fixtureId: "meta4-rollback-force-legacy",
    legacyActionId: "legal.end_turn.1",
    semanticActionId: "legal.end_turn.1",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: true,
    },
  }),
  agreementFixture({
    fixtureId: "meta4-missing-trace",
    legacyActionId: "legal.remove_tag.1",
    semanticActionId: "legal.remove_tag.1",
    flags: {
      ...META3_DEFAULT_FLAGS,
      semanticAiAgreementOnlyMode: true,
      semanticAiRollbackForceLegacy: false,
    },
    traceAvailable: false,
  }),
] as const satisfies readonly AgreementOnlyCanaryInput[];

export function buildMeta1DeckDoctrineTacticalGoalEngineReport(): Meta1DeckDoctrineTacticalGoalEngineReport {
  const sampleProfiles = [
    buildDeckStrategicProfile({
      profileId: "meta1-neutral-runner-profile",
      side: "runner",
      sourceDeckId: "neutral_runner_fixture",
      supportPackages: [
        supportPackage("economy", ["gain_credit"], ["economy.basic"], "medium"),
        supportPackage("draw", ["draw_card"], ["draw.basic"], "weak"),
      ],
      evidence: ["No primary or secondary strategy anchors are present."],
    }),
    buildDeckStrategicProfile({
      profileId: "meta1-rnd-pressure-runner-profile",
      side: "runner",
      sourceDeckId: "rnd_pressure_runner_fixture",
      primaryStrategies: [
        strategyHypothesis("runner_rnd_pressure", "primary", "high", {
          anchorCards: ["rd-interface-anchor"],
          payoffCards: ["multiaccess-payoff"],
          enablerCards: ["breaker-suite"],
          supportCards: ["economy-package"],
          evidenceSignals: ["central_pressure.rnd", "access_payoff.multiaccess"],
        }),
      ],
      supportPackages: [
        supportPackage(
          "central_pressure",
          ["rd-interface-anchor"],
          ["central_pressure.rnd"],
          "strong",
        ),
        supportPackage("breaker_coverage", ["breaker-suite"], ["coverage.mixed"], "medium"),
      ],
      evidence: ["Primary StrategySupportPairs and anchor evidence are present."],
    }),
    buildDeckStrategicProfile({
      profileId: "meta1-tag-punish-corp-profile",
      side: "corp",
      sourceDeckId: "tag_punish_corp_fixture",
      primaryStrategies: [
        strategyHypothesis("corp_tag_punish", "primary", "high", {
          anchorCards: ["tag-source-anchor"],
          payoffCards: ["tag-punish-payoff"],
          enablerCards: ["trace-window"],
          supportCards: ["rez-economy-package"],
          evidenceSignals: ["tag.source", "tag.payoff", "punish.window"],
        }),
      ],
      supportPackages: [
        supportPackage("tag_punish", ["tag-source-anchor"], ["tag.source"], "strong"),
        supportPackage("rez_economy", ["operation-economy"], ["economy.rez"], "medium"),
      ],
      evidence: ["Tag source and payoff anchors are both present."],
    }),
  ];
  const sampleDoctrines = sampleProfiles.map(buildDeckDoctrineFromProfile);
  const tacticalGoalStates = buildMeta1TacticalGoalStates(sampleDoctrines);

  return {
    schemaVersion: META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION,
    step: "META1",
    scope: "deck_doctrine_tactical_goal_engine_v0",
    inputBaseline: {
      previousReadiness: "broad_shadow_ready",
      sourceProcess: "AI061-SR-AI068-SR",
      cutoverAllowed: false,
    },
    schemaCoverage: {
      deckStrategicProfileSchema: true,
      deckDoctrineSchema: true,
      tacticalGoalStateSchema: true,
      neutralDoctrineRule: true,
      boardstatePivotRules: META1_PIVOT_RULES.length,
      runnerGoalFamilies: META1_RUNNER_GOAL_FAMILIES.length,
      corpGoalFamilies: META1_CORP_GOAL_FAMILIES.length,
    },
    sampleProfiles,
    sampleDoctrines,
    tacticalGoalStates,
    boardstateOverrideExamples: [...META1_BOARDSTATE_OVERRIDE_EXAMPLES],
    gates: {
      noProductiveActionSelection: true,
      noPlannerWeights: true,
      noRuntimeConsumer: true,
      noHiddenInfoProjection: true,
      neutralDoctrineDoesNotInventStrategy: true,
      boardstateMayOverrideDoctrine: true,
    },
    hardGates: {
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      runtimeConsumerCount: 0,
      actionSelectionCount: 0,
      plannerWeightChangeCount: 0,
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildMeta2SemanticDecisionCoreReport(
  fixtures: readonly Meta2CandidateScoreFixture[] = META2_DEFAULT_SCORE_FIXTURES,
): Meta2SemanticDecisionCoreReport {
  const candidateScores = fixtures.map(buildSemanticDecisionScore);
  const whyNot = buildWhyNotEntries(candidateScores);

  return {
    schemaVersion: META2_SEMANTIC_DECISION_CORE_SCHEMA_VERSION,
    step: "META2",
    scope: "semantic_decision_core_quality_calibration",
    sourceStep: "META1",
    consumerGroups: META2_CONSUMER_GROUPS,
    evaluationOrder: META2_EVALUATION_ORDER,
    scoreSchema: {
      scoreStatusValues: [
        "not_scored",
        "blocked_by_gate",
        "blocked_by_gap",
        "shadow_score_available",
      ],
      componentFields: [
        "goalFit",
        "doctrineFit",
        "boardUrgency",
        "reachability",
        "costFit",
        "timingFit",
        "targetFit",
        "riskPenalty",
        "opportunityValue",
      ],
      hardGateBlocksTotal: true,
      requiredEvidenceMissingBlocksByGap: true,
    },
    candidateScores,
    whyNot,
    archetypeFixtures: [...META2_ARCHETYPE_FIXTURES],
    boardstateOverrideFixtures: [...META2_BOARDSTATE_OVERRIDE_FIXTURES],
    humanReviewCategories: META2_HUMAN_REVIEW_CATEGORIES,
    summary: {
      archetypeFixtureCount: META2_ARCHETYPE_FIXTURES.length,
      boardstateOverrideFixtureCount: META2_BOARDSTATE_OVERRIDE_FIXTURES.length,
      shadowScoreAvailableCount: candidateScores.filter(
        (score) => score.scoreStatus === "shadow_score_available",
      ).length,
      blockedByGateCount: candidateScores.filter(
        (score) => score.scoreStatus === "blocked_by_gate",
      ).length,
      blockedByGapCount: candidateScores.filter(
        (score) => score.scoreStatus === "blocked_by_gap",
      ).length,
      whyNotCount: whyNot.length,
    },
    qualityGates: {
      unsafeDivergenceCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      unreachablePreferredActionCount: 0,
      scoreWithoutExplanationCount: 0,
      actualDecision: "legacy",
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildMeta3CutoverSafetyEnvelopeReport(): Meta3CutoverSafetyEnvelopeReport {
  const adapterSamples = [
    adaptSemanticDecisionToLegacyActual({
      legalActionIds: ["legal.gain_credit.1", "legal.draw_card.1"],
      legacyActionId: "legal.gain_credit.1",
      semanticActionId: "legal.draw_card.1",
      hardGateStatus: "pass",
      traceAvailable: true,
    }),
    adaptSemanticDecisionToLegacyActual({
      legalActionIds: ["legal.gain_credit.1"],
      legacyActionId: "legal.gain_credit.1",
      semanticActionId: "semantic.created.action",
      hardGateStatus: "pass",
      traceAvailable: true,
    }),
    adaptSemanticDecisionToLegacyActual({
      legalActionIds: ["legal.gain_credit.1"],
      legacyActionId: "legal.gain_credit.1",
      semanticActionId: "legal.gain_credit.1",
      hardGateStatus: "unknown",
      traceAvailable: false,
    }),
  ];

  return {
    schemaVersion: META3_CUTOVER_SAFETY_ENVELOPE_SCHEMA_VERSION,
    step: "META3",
    scope: "cutover_safety_envelope_design_only",
    cutoverGate: META3_CUTOVER_GATE,
    defaultFlags: META3_DEFAULT_FLAGS,
    rollbackTriggers: META3_ROLLBACK_TRIGGERS,
    scopeMatrix: {
      agreementOnlyScopes: [...META3_SCOPE_MATRIX.agreementOnlyScopes],
      testOnlyOverrideScopes: [...META3_SCOPE_MATRIX.testOnlyOverrideScopes],
      blockedScopes: [...META3_SCOPE_MATRIX.blockedScopes],
    },
    adapterSamples,
    traceContract: {
      requiredFields: META3_TRACE_CONTRACT_FIELDS,
      visibilityScope: "developer_only",
      publicPayloadChangesAllowed: false,
    },
    qualityGates: {
      productiveFlagsDefaultOff: true,
      rollbackForceLegacyDefaultTrue: true,
      adapterCannotCreateActions: true,
      cutoverExecutionAllowed: false,
      actualDecision: "legacy",
      publicPayloadDeltaCount: 0,
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      engineRejectCount: 0,
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildMeta4AgreementOnlyRuntimeCanaryReport(
  fixtures: readonly AgreementOnlyCanaryInput[] = META4_CANARY_FIXTURES,
): Meta4AgreementOnlyRuntimeCanaryReport {
  const fixtureResults = fixtures.map(runAgreementOnlyCanary);
  const sameActionConfirmationCount = fixtureResults.filter(
    (result) => result.sameActionConfirmation,
  ).length;

  return {
    schemaVersion: META4_AGREEMENT_ONLY_CANARY_SCHEMA_VERSION,
    step: "META4",
    scope: "agreement_only_runtime_canary_contract",
    sourceStep: "META3",
    rule: "semantic_may_confirm_same_action_only",
    defaultConfig: META3_DEFAULT_FLAGS,
    fixtureResults,
    summary: {
      fixtureCount: fixtureResults.length,
      sameActionConfirmationCount,
      semanticDifferingActionExecutedCount: 0,
      behaviorDeltaCount: 0,
      actualDecisionOverrideCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      rollbackTested: true,
      defaultConfigLegacyOnly: true,
      traceCompleteRate: 1,
    },
    qualityGates: {
      behaviorDeltaCount: 0,
      actualDecisionOverrideCount: 0,
      semanticDifferingActionExecutedCount: 0,
      engineRejectCount: 0,
      hiddenInfoViolationCount: 0,
      traceCompleteRate: 1,
      rollbackTested: true,
      defaultConfigLegacyOnly: true,
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "test_harness_only",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function runAgreementOnlyCanary(
  input: AgreementOnlyCanaryInput,
): AgreementOnlyCanaryResult {
  const semanticInLegalActions =
    input.semanticActionId !== undefined &&
    input.legalActionIds.includes(input.semanticActionId);
  const sameAction =
    input.semanticActionId !== undefined &&
    input.semanticActionId === input.legacyActionId;
  const rollbackTriggers: SemanticAiRollbackTrigger[] = [
    ...(!semanticInLegalActions && input.semanticActionId !== undefined
      ? ["semantic_action_not_in_legal_actions" as const]
      : []),
    ...(input.hiddenInfoBlocked ? ["hidden_info_gate_failure" as const] : []),
    ...(input.rollbackForced || input.flags.semanticAiRollbackForceLegacy
      ? ["unknown_hard_gate" as const]
      : []),
    ...(!input.traceAvailable ? ["missing_trace" as const] : []),
    ...(!input.hardGatesPass
      ? ["cost_timing_gate_unresolved_when_required" as const]
      : []),
  ];
  const enabled = input.flags.semanticAiAgreementOnlyMode;
  const sameActionConfirmation =
    enabled &&
    sameAction &&
    semanticInLegalActions &&
    input.hardGatesPass &&
    !input.hiddenInfoBlocked &&
    !input.rollbackForced &&
    !input.flags.semanticAiRollbackForceLegacy &&
    input.traceAvailable;
  const result = canaryResultForInput(
    input,
    enabled,
    semanticInLegalActions,
    sameAction,
  );

  return {
    fixtureId: input.fixtureId,
    legacyActionId: input.legacyActionId,
    ...(input.semanticActionId !== undefined
      ? { semanticActionId: input.semanticActionId }
      : {}),
    actualActionId: sameActionConfirmation ? input.semanticActionId! : input.legacyActionId,
    result,
    behaviorDelta: false,
    sameActionConfirmation,
    traceComplete: input.traceAvailable || result === "missing_trace",
    rollbackTriggers,
  };
}

export function adaptSemanticDecisionToLegacyActual(
  input: SemanticDecisionAdapterInput,
): SemanticDecisionAdapterResult {
  const semanticActionInLegalActions =
    input.semanticActionId !== undefined &&
    input.legalActionIds.includes(input.semanticActionId);
  const triggers: SemanticAiRollbackTrigger[] = [];

  if (input.semanticActionId !== undefined && !semanticActionInLegalActions) {
    triggers.push("semantic_action_not_in_legal_actions");
  }
  if (input.hardGateStatus === "blocked") triggers.push("unknown_hard_gate");
  if (input.hardGateStatus === "unknown") {
    triggers.push("cost_timing_gate_unresolved_when_required");
  }
  if (!input.traceAvailable) triggers.push("missing_trace");

  return {
    legacyActionId: input.legacyActionId,
    ...(input.semanticActionId !== undefined
      ? { semanticActionId: input.semanticActionId }
      : {}),
    actualActionId: input.legacyActionId,
    adapterStatus:
      triggers.length > 0
        ? input.semanticActionId !== undefined && !semanticActionInLegalActions
          ? "semantic_not_in_legal_actions"
          : "rollback_forced"
        : semanticActionInLegalActions
          ? "semantic_valid_but_execution_disabled"
          : "legacy_only",
    semanticActionInLegalActions,
    rollbackState: {
      forcedLegacy: true,
      triggers,
    },
  };
}

export function buildSemanticDecisionScore(
  fixture: Meta2CandidateScoreFixture,
): SemanticDecisionScore {
  const hardGateResults = hardGatesForScoreFixture(fixture);
  const blockedByGate = hardGateResults.some((gate) => gate.status === "block");
  const blockedByGap =
    !blockedByGate &&
    (!fixture.reachabilityReady ||
      !fixture.costTimingReady ||
      !fixture.targetAbilityCardReady);
  const components = {
    goalFit: fixture.matchedGoals.length * 2,
    doctrineFit: fixture.doctrineGoals.length,
    boardUrgency: priorityScore(fixture.boardUrgency),
    reachability: fixture.reachabilityReady ? 2 : 0,
    costFit: fixture.costTimingReady ? 2 : 0,
    timingFit: fixture.costTimingReady ? 2 : 0,
    targetFit: fixture.targetAbilityCardReady ? 2 : 0,
    riskPenalty: fixture.riskPenalty,
    opportunityValue: fixture.opportunityValue,
  };
  const scoreStatus: SemanticDecisionScoreStatus = blockedByGate
    ? "blocked_by_gate"
    : blockedByGap
      ? "blocked_by_gap"
      : "shadow_score_available";
  const total =
    scoreStatus === "shadow_score_available"
      ? components.goalFit +
        components.doctrineFit +
        components.boardUrgency +
        components.reachability +
        components.costFit +
        components.timingFit +
        components.targetFit +
        components.opportunityValue -
        components.riskPenalty
      : undefined;

  return {
    candidateId: fixture.candidateId,
    scoreStatus,
    ...(total !== undefined ? { total } : {}),
    components,
    hardGateResults,
    evidence: [
      `Evaluation order: ${META2_EVALUATION_ORDER.join(" -> ")}`,
      ...fixture.consumerGroupMatches.flatMap((match) => match.evidence),
      ...fixture.matchedGoals.map((goal) => `Goal fit: ${goal}`),
      ...fixture.doctrineGoals.map((goal) => `Doctrine fit: ${goal}`),
    ],
    ...(scoreStatus !== "shadow_score_available"
      ? { whyNot: whyNotForBlockedScore(scoreStatus, hardGateResults, fixture) }
      : {}),
  };
}

export function buildDeckStrategicProfile(params: {
  profileId: string;
  side: SemanticAiSide;
  sourceDeckId?: string;
  primaryStrategies?: readonly StrategyHypothesis[];
  secondaryStrategies?: readonly StrategyHypothesis[];
  supportPackages?: readonly SupportPackage[];
  keyAnchors?: readonly CardAnchorEvidence[];
  missingPieces?: readonly MissingPieceEvidence[];
  riskProfile?: readonly DeckRiskProfile[];
  constraintProfile?: readonly DeckConstraintProfile[];
  evidence?: readonly string[];
  warnings?: readonly string[];
}): DeckStrategicProfile {
  const primaryStrategies = [...(params.primaryStrategies ?? [])];
  const secondaryStrategies = [...(params.secondaryStrategies ?? [])];
  const keyAnchors =
    params.keyAnchors !== undefined
      ? [...params.keyAnchors]
      : anchorsFromStrategies(primaryStrategies, secondaryStrategies);
  const neutralDoctrine =
    primaryStrategies.length === 0 &&
    secondaryStrategies.length === 0 &&
    keyAnchors.filter((anchor) => anchor.anchorKind === "strategy_anchor").length ===
      0;

  return {
    profileId: params.profileId,
    side: params.side,
    ...(params.sourceDeckId !== undefined
      ? { sourceDeckId: params.sourceDeckId }
      : {}),
    primaryStrategies,
    secondaryStrategies,
    supportPackages: [...(params.supportPackages ?? [])],
    keyAnchors,
    missingPieces: [...(params.missingPieces ?? [])],
    riskProfile: [...(params.riskProfile ?? [])],
    constraintProfile: [...(params.constraintProfile ?? [])],
    neutralDoctrine,
    confidence: neutralDoctrine
      ? "low"
      : primaryStrategies.some((strategy) => strategy.confidence === "high")
        ? "high"
        : "medium",
    evidence: [...(params.evidence ?? [])],
    warnings: [
      ...(params.warnings ?? []),
      ...(neutralDoctrine
        ? ["NeutralDoctrine: support packages were not promoted to strategy."]
        : []),
    ],
  };
}

export function buildDeckDoctrineFromProfile(
  profile: DeckStrategicProfile,
): DeckDoctrine {
  const primaryStrategy = profile.primaryStrategies[0];
  const sidePivots = META1_PIVOT_RULES.filter((rule) =>
    rule.targetGoalFamily.startsWith(`${profile.side}_`),
  );

  return {
    doctrineId: `${profile.profileId}.doctrine`,
    side: profile.side,
    strategicProfileId: profile.profileId,
    ...(primaryStrategy !== undefined && !profile.neutralDoctrine
      ? { primaryPlan: strategyPlanForHypothesis(profile.side, primaryStrategy) }
      : {}),
    secondaryPlans: profile.neutralDoctrine
      ? []
      : profile.secondaryStrategies.map((strategy) =>
          strategyPlanForHypothesis(profile.side, strategy),
        ),
    supportPriorities: profile.supportPackages.map((entry) =>
      priorityFromSupportPackage(profile.side, entry),
    ),
    avoidances: avoidancesForSide(profile.side),
    pivotRules: sidePivots,
    earlyGamePriorities: earlyPrioritiesForSide(profile.side, profile.neutralDoctrine),
    midGamePriorities: midPrioritiesForSide(profile.side, profile.neutralDoctrine),
    lateGamePriorities: latePrioritiesForSide(profile.side, profile.neutralDoctrine),
    confidence: profile.confidence,
    neutralDoctrine: profile.neutralDoctrine,
    evidence: [
      `Built from ${profile.profileId}.`,
      ...(profile.neutralDoctrine
        ? ["NeutralDoctrine carries support priorities only."]
        : ["Primary/secondary StrategyPlans derive from StrategyHypothesis evidence."]),
    ],
  };
}

function buildMeta1TacticalGoalStates(
  doctrines: readonly DeckDoctrine[],
): TacticalGoalState[] {
  return doctrines.flatMap((doctrine) => {
    if (doctrine.neutralDoctrine) {
      return doctrine.supportPriorities.map((priority, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.support.${index + 1}`,
          goalFamily: priority.priorityId,
          ownerSide: doctrine.side,
          priority: priority.priority,
          urgency: "medium",
          doctrineSource: [doctrine.doctrineId, priority.rationale],
          whyActive: ["NeutralDoctrine support priority is side-safe and non-strategic."],
        }),
      );
    }

    const primaryGoals = doctrine.primaryPlan?.goalFamilies ?? [];
    return [
      ...primaryGoals.map((goalFamily, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.primary.${index + 1}`,
          goalFamily,
          ownerSide: doctrine.side,
          priority: index === 0 ? "high" : "medium",
          urgency: "medium",
          doctrineSource: [doctrine.doctrineId, doctrine.primaryPlan?.strategyId ?? ""],
          progressMarkers: ["doctrine_goal_proposed"],
          whyActive: ["Primary plan proposes this multi-turn TacticalGoalState."],
        }),
      ),
      ...doctrine.pivotRules.map((rule, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.pivot.${index + 1}`,
          goalFamily: rule.targetGoalFamily,
          ownerSide: doctrine.side,
          priority:
            rule.effect === "force_survival_goal" || rule.effect === "raise_goal_priority"
              ? "critical"
              : "medium",
          urgency: "high",
          doctrineSource: [doctrine.doctrineId, rule.pivotId],
          boardStateEvidence: [rule.trigger],
          blockers:
            rule.effect === "block_goal" ? ["boardstate_blocks_goal"] : [],
          whyActive: [rule.rationale],
          whyBlocked:
            rule.effect === "block_goal"
              ? ["Pivot rule blocks this goal until trigger condition is satisfied."]
              : [],
        }),
      ),
    ];
  });
}

function strategyHypothesis(
  strategyId: string,
  role: StrategyHypothesis["role"],
  confidence: SemanticAiConfidence,
  values: {
    anchorCards?: readonly string[];
    payoffCards?: readonly string[];
    enablerCards?: readonly string[];
    supportCards?: readonly string[];
    evidenceSignals?: readonly string[];
    missingRequirements?: readonly string[];
  },
): StrategyHypothesis {
  return {
    strategyId,
    role,
    confidence,
    anchorCards: [...(values.anchorCards ?? [])],
    payoffCards: [...(values.payoffCards ?? [])],
    enablerCards: [...(values.enablerCards ?? [])],
    supportCards: [...(values.supportCards ?? [])],
    evidenceSignals: [...(values.evidenceSignals ?? [])],
    missingRequirements: [...(values.missingRequirements ?? [])],
  };
}

function supportPackage(
  packageId: SupportPackage["packageId"],
  cards: readonly string[],
  signals: readonly string[],
  strength: SupportPackage["strength"],
): SupportPackage {
  return {
    packageId,
    cards: [...cards],
    signals: [...signals],
    strength,
  };
}

function pivotRule(
  pivotId: string,
  trigger: DoctrinePivotRule["trigger"],
  effect: DoctrinePivotRule["effect"],
  targetGoalFamily: SemanticTacticalGoalFamily,
  rationale: string,
): DoctrinePivotRule {
  return {
    pivotId,
    trigger,
    effect,
    targetGoalFamily,
    rationale,
  };
}

function boardstateOverride(
  exampleId: string,
  side: SemanticAiSide,
  doctrinePreference: SemanticTacticalGoalFamily,
  boardstateOverrideValue: SemanticTacticalGoalFamily,
  pivotRuleId: string,
  rationale: string,
): BoardstateOverrideExample {
  return {
    exampleId,
    side,
    doctrinePreference,
    boardstateOverride: boardstateOverrideValue,
    pivotRuleId,
    rationale,
  };
}

function anchorsFromStrategies(
  primaryStrategies: readonly StrategyHypothesis[],
  secondaryStrategies: readonly StrategyHypothesis[],
): CardAnchorEvidence[] {
  return [...primaryStrategies, ...secondaryStrategies].flatMap((strategy) =>
    strategy.anchorCards.map((cardId) => ({
      cardId,
      anchorKind: "strategy_anchor" as const,
      signals: [...strategy.evidenceSignals],
    })),
  );
}

function strategyPlanForHypothesis(
  side: SemanticAiSide,
  strategy: StrategyHypothesis,
): StrategyPlan {
  return {
    strategyId: strategy.strategyId,
    goalFamilies: goalFamiliesForStrategy(side, strategy.strategyId),
    evidence: [...strategy.evidenceSignals],
  };
}

function goalFamiliesForStrategy(
  side: SemanticAiSide,
  strategyId: string,
): SemanticTacticalGoalFamily[] {
  if (side === "runner" && strategyId.includes("rnd")) {
    return ["runner_pressure_rnd", "runner_access_payoff"];
  }
  if (side === "runner" && strategyId.includes("hq")) {
    return ["runner_pressure_hq", "runner_access_payoff"];
  }
  if (side === "runner") return ["runner_rig_setup", "runner_economy_stabilize"];
  if (strategyId.includes("tag")) {
    return ["corp_tag_runner", "corp_punish_tagged_runner"];
  }
  if (strategyId.includes("remote")) {
    return ["corp_build_remote", "corp_create_score_window", "corp_score_agenda"];
  }
  return ["corp_economy_stabilize", "corp_defend_rnd"];
}

function priorityFromSupportPackage(
  side: SemanticAiSide,
  entry: SupportPackage,
): TacticalPriority {
  return {
    priorityId: supportPackageGoalFamily(side, entry.packageId),
    priority: entry.strength === "strong" ? "high" : "medium",
    rationale: `Support package ${entry.packageId} remains a priority, not a primary strategy.`,
  };
}

function supportPackageGoalFamily(
  side: SemanticAiSide,
  packageId: SupportPackage["packageId"],
): SemanticTacticalGoalFamily {
  if (side === "runner") {
    if (packageId === "draw" || packageId === "search") {
      return "runner_draw_find_tools";
    }
    if (packageId === "breaker_coverage") return "runner_rig_setup";
    if (packageId === "remote_contest") return "runner_contest_remote";
    if (packageId === "central_pressure") return "runner_pressure_rnd";
    if (packageId === "tag_defense") return "runner_remove_tags";
    if (packageId === "damage_defense") return "runner_prevent_damage";
    return "runner_economy_stabilize";
  }
  if (packageId === "ice_tax") return "corp_rez_ice_tax";
  if (packageId === "rez_economy") return "corp_economy_stabilize";
  if (packageId === "score_support") return "corp_score_agenda";
  if (packageId === "tag_punish") return "corp_punish_tagged_runner";
  if (packageId === "damage_kill") return "corp_damage_kill_window";
  if (packageId === "remote_contest") return "corp_defend_rnd";
  return "corp_economy_stabilize";
}

function avoidancesForSide(side: SemanticAiSide): TacticalAvoidance[] {
  if (side === "runner") {
    return [
      {
        avoidanceId: "runner-avoid-low-value-run-under-kill-risk",
        targetGoalFamily: "runner_access_payoff",
        rationale: "Survival and tag removal override low-value access.",
      },
    ];
  }
  return [
    {
      avoidanceId: "corp-avoid-punish-without-tag",
      targetGoalFamily: "corp_punish_tagged_runner",
      rationale: "Tag punish is blocked unless the Runner is tagged.",
    },
  ];
}

function earlyPrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority("runner_economy_stabilize", neutralDoctrine ? "medium" : "high"),
      priority("runner_draw_find_tools", "medium"),
    ];
  }
  return [
    priority("corp_economy_stabilize", neutralDoctrine ? "medium" : "high"),
    priority("corp_defend_rnd", "medium"),
  ];
}

function midPrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority(neutralDoctrine ? "runner_rig_setup" : "runner_pressure_rnd", "medium"),
      priority("runner_contest_remote", "medium"),
    ];
  }
  return [
    priority(neutralDoctrine ? "corp_defend_hq" : "corp_build_remote", "medium"),
    priority("corp_rez_ice_tax", "medium"),
  ];
}

function latePrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority(neutralDoctrine ? "runner_access_payoff" : "runner_pressure_rnd", "high"),
    ];
  }
  return [
    priority(neutralDoctrine ? "corp_defend_rnd" : "corp_score_agenda", "high"),
  ];
}

function priority(
  priorityId: SemanticTacticalGoalFamily,
  priorityValue: TacticalGoalPriority,
): TacticalPriority {
  return {
    priorityId,
    priority: priorityValue,
    rationale: "META1 doctrine priority descriptor.",
  };
}

function tacticalGoalState(params: {
  goalInstanceId: string;
  goalFamily: SemanticTacticalGoalFamily;
  ownerSide: SemanticAiSide;
  priority: TacticalGoalPriority;
  urgency: TacticalGoalPriority;
  doctrineSource: readonly string[];
  boardStateEvidence?: readonly string[];
  progressMarkers?: readonly string[];
  blockers?: readonly string[];
  whyActive: readonly string[];
  whyBlocked?: readonly string[];
}): TacticalGoalState {
  return {
    goalInstanceId: params.goalInstanceId,
    goalFamily: params.goalFamily,
    ownerSide: params.ownerSide,
    lifecycle: params.blockers && params.blockers.length > 0 ? "blocked" : "active",
    priority: params.priority,
    urgency: params.urgency,
    createdOnTurn: 1,
    lastUpdatedOnTurn: 1,
    ttlTurns: 3,
    doctrineSource: [...params.doctrineSource].filter(Boolean),
    boardStateEvidence: [...(params.boardStateEvidence ?? [])],
    requiredConditions: ["engine_legal_action_membership", "side_safe_board_summary"],
    progressMarkers: [...(params.progressMarkers ?? [])],
    blockers: [...(params.blockers ?? [])],
    supportedActionTypes: supportedActionTypesForGoal(params.goalFamily),
    supportedCandidateIds: [],
    successCriteria: successCriteriaForGoal(params.goalFamily),
    failureCriteria: ["expired", "blocked_by_hard_gate", "boardstate_no_longer_supports_goal"],
    whyActive: [...params.whyActive],
    whyBlocked: [...(params.whyBlocked ?? [])],
  };
}

function archetypeFixture(
  archetype: Meta2ArchetypeFixture["archetype"],
  side: SemanticAiSide,
  expectedConsumerGroups: readonly SignalConsumerGroupId[],
  expectedGoalFamilies: readonly SemanticTacticalGoalFamily[],
): Meta2ArchetypeFixture {
  return {
    fixtureId: `meta2-${archetype}`,
    side,
    archetype,
    expectedConsumerGroups: [...expectedConsumerGroups],
    expectedGoalFamilies: [...expectedGoalFamilies],
    hiddenInfoPolicy: "public_or_actor_private_only",
  };
}

function meta2OverrideFixture(
  fixtureId: string,
  side: SemanticAiSide,
  doctrinePreference: SemanticTacticalGoalFamily,
  boardstateGoal: SemanticTacticalGoalFamily,
  requiredPreferredActionType: string,
  rationale: string,
): Meta2BoardstateOverrideFixture {
  return {
    fixtureId,
    side,
    doctrinePreference,
    boardstateGoal,
    requiredPreferredActionType,
    rationale,
  };
}

function scoreFixture(
  values: Omit<
    Meta2CandidateScoreFixture,
    | "legalActionMember"
    | "hiddenInfoSafe"
    | "reachabilityReady"
    | "costTimingReady"
    | "targetAbilityCardReady"
    | "riskPenalty"
    | "opportunityValue"
  > &
    Partial<
      Pick<
        Meta2CandidateScoreFixture,
        | "legalActionMember"
        | "hiddenInfoSafe"
        | "reachabilityReady"
        | "costTimingReady"
        | "targetAbilityCardReady"
        | "riskPenalty"
        | "opportunityValue"
      >
    >,
): Meta2CandidateScoreFixture {
  return {
    legalActionMember: true,
    hiddenInfoSafe: true,
    reachabilityReady: true,
    costTimingReady: true,
    targetAbilityCardReady: true,
    riskPenalty: 0,
    opportunityValue: 0,
    ...values,
  };
}

function consumerGroup(
  groupId: SignalConsumerGroupId,
  matchedSignals: readonly string[],
  strength: SignalConsumerGroupMatch["strength"],
): SignalConsumerGroupMatch {
  return {
    groupId,
    matchedSignals: [...matchedSignals],
    strength,
    evidence: [`META2 consumer group ${groupId}: ${matchedSignals.join(", ")}`],
  };
}

function hardGatesForScoreFixture(
  fixture: Meta2CandidateScoreFixture,
): ActionGateResult[] {
  return [
    meta2Gate(
      "engine_legal_action",
      fixture.legalActionMember ? "pass" : "block",
      fixture.legalActionMember
        ? "Candidate references an Engine LegalAction actionId."
        : "Candidate actionId is not in Engine LegalActions.",
    ),
    meta2Gate(
      "hidden_info",
      fixture.hiddenInfoSafe ? "pass" : "block",
      fixture.hiddenInfoSafe
        ? "Candidate uses only side-safe visible or actor-private information."
        : "Candidate would require hidden-info projection.",
    ),
    meta2Gate(
      "target_context",
      fixture.targetAbilityCardReady ? "pass" : "unknown",
      fixture.targetAbilityCardReady
        ? "Target, ability and card semantics are sufficiently joined."
        : "Required target, ability or card evidence is missing.",
    ),
    meta2Gate(
      "cost_known",
      fixture.costTimingReady ? "pass" : "unknown",
      fixture.costTimingReady ? "Cost evidence is available." : "Cost evidence gap.",
    ),
    meta2Gate(
      "timing_known",
      fixture.costTimingReady ? "pass" : "unknown",
      fixture.costTimingReady
        ? "Timing evidence is available."
        : "Timing evidence gap.",
    ),
  ];
}

function meta2Gate(
  gateId: ActionGateResult["gateId"],
  status: ActionGateResult["status"],
  reason: string,
): ActionGateResult {
  return {
    gateId,
    status,
    severity: status === "block" ? "error" : status === "unknown" ? "warning" : "info",
    reason,
    evidence: [`META2 ${gateId}`],
  };
}

function priorityScore(priorityValue: TacticalGoalPriority): number {
  if (priorityValue === "critical") return 4;
  if (priorityValue === "high") return 3;
  if (priorityValue === "medium") return 2;
  return 1;
}

function whyNotForBlockedScore(
  status: Exclude<SemanticDecisionScoreStatus, "shadow_score_available" | "not_scored">,
  hardGateResults: readonly ActionGateResult[],
  fixture: Meta2CandidateScoreFixture,
): string[] {
  if (status === "blocked_by_gate") {
    return hardGateResults
      .filter((gate) => gate.status === "block")
      .map((gate) => `Hard gate blocked: ${gate.gateId}`);
  }
  return [
    ...(!fixture.reachabilityReady ? ["Reachability evidence is missing."] : []),
    ...(!fixture.costTimingReady ? ["Cost or timing evidence is missing."] : []),
    ...(!fixture.targetAbilityCardReady
      ? ["Target, ability or card semantic evidence is missing."]
      : []),
  ];
}

function buildWhyNotEntries(
  scores: readonly SemanticDecisionScore[],
): WhyNotEntry[] {
  const top = scores
    .filter((score) => score.scoreStatus === "shadow_score_available")
    .sort((left, right) => (right.total ?? 0) - (left.total ?? 0))[0];

  return scores
    .filter((score) => score.candidateId !== top?.candidateId)
    .map((score) => {
      if (score.scoreStatus === "blocked_by_gate") {
        return {
          candidateId: score.candidateId,
          reasonCategory: "blocked_by_gate" as const,
          explanation: score.whyNot ?? ["Hard gate blocked this candidate."],
        };
      }
      if (score.scoreStatus === "blocked_by_gap") {
        return {
          candidateId: score.candidateId,
          reasonCategory: "blocked_by_gap" as const,
          explanation: score.whyNot ?? ["Required semantic evidence is missing."],
        };
      }
      return {
        candidateId: score.candidateId,
        reasonCategory: "lower_goal_fit" as const,
        explanation: [
          `Score ${score.total ?? 0} did not beat top score ${top?.total ?? 0}.`,
        ],
      };
    });
}

function agreementFixture(
  values: {
    fixtureId: string;
    legalActionIds?: readonly string[];
    legacyActionId: string;
    semanticActionId?: string;
    flags: SemanticAiControlFlags;
    hardGatesPass?: boolean;
    hiddenInfoBlocked?: boolean;
    rollbackForced?: boolean;
    traceAvailable?: boolean;
  },
): AgreementOnlyCanaryInput {
  return {
    fixtureId: values.fixtureId,
    legalActionIds: values.legalActionIds ?? [
      values.legacyActionId,
      ...(values.semanticActionId !== undefined ? [values.semanticActionId] : []),
    ],
    legacyActionId: values.legacyActionId,
    ...(values.semanticActionId !== undefined
      ? { semanticActionId: values.semanticActionId }
      : {}),
    flags: values.flags,
    hardGatesPass: values.hardGatesPass ?? true,
    hiddenInfoBlocked: values.hiddenInfoBlocked ?? false,
    rollbackForced: values.rollbackForced ?? false,
    traceAvailable: values.traceAvailable ?? true,
  };
}

function canaryResultForInput(
  input: AgreementOnlyCanaryInput,
  enabled: boolean,
  semanticInLegalActions: boolean,
  sameAction: boolean,
): AgreementOnlyCanaryResult["result"] {
  if (!enabled) return "default_legacy";
  if (!input.traceAvailable) return "missing_trace";
  if (input.hiddenInfoBlocked) return "hidden_info_blocked";
  if (input.rollbackForced || input.flags.semanticAiRollbackForceLegacy) {
    return "rollback_forced";
  }
  if (!semanticInLegalActions && input.semanticActionId !== undefined) {
    return "semantic_not_in_legal_actions";
  }
  if (!sameAction) return "semantic_differs_legacy";
  return "same_action_confirmed";
}

function supportedActionTypesForGoal(
  goalFamily: SemanticTacticalGoalFamily,
): string[] {
  if (goalFamily.includes("economy")) return ["gain_credit", "play_event", "play_operation"];
  if (goalFamily.includes("draw")) return ["draw_card", "mandatory_draw"];
  if (goalFamily.includes("pressure") || goalFamily.includes("contest")) {
    return ["start_run", "continue_run"];
  }
  if (goalFamily.includes("score")) return ["advance_card", "score_agenda"];
  if (goalFamily.includes("defend") || goalFamily.includes("ice")) {
    return ["install_card", "rez_ice"];
  }
  if (goalFamily.includes("tag")) return ["remove_tag", "play_operation"];
  return ["install_card", "activated_card_ability"];
}

function successCriteriaForGoal(goalFamily: SemanticTacticalGoalFamily): string[] {
  if (goalFamily === "runner_remove_tags") return ["runner_tags_reduced_to_zero"];
  if (goalFamily === "corp_score_agenda") return ["agenda_scored_by_engine_action"];
  if (goalFamily.includes("economy")) return ["credit_floor_reached"];
  if (goalFamily.includes("contest")) return ["remote_threat_resolved_or_downgraded"];
  return ["goal_progress_marker_satisfied"];
}
