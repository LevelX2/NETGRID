import type {
  ActionGateId,
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
} from "./action-semantic-candidate";
import type {
  DeckDoctrineV2ReadinessStatus,
  TacticalGoalFamily,
} from "./action-doctrine-goal-diagnostics";

export const SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION =
  "shadow-mode-trace-contract-v1" as const;

export const SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION =
  "shadow-scenario-corpus-v1" as const;

export const SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION =
  "semantic-shadow-decision-v0" as const;

export const LEGACY_SEMANTIC_SHADOW_COMPARISON_SCHEMA_VERSION =
  "legacy-semantic-shadow-comparison-v1" as const;

export const CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS = {
  actualDecisionOverride: false,
  productiveScoring: false,
  plannerWeightChange: false,
  engineMutation: false,
  legalityGeneration: false,
  publicPayloadChange: false,
  hiddenInfoLeak: false,
  featureFlagCutover: false,
} as const satisfies ShadowModeNoEffectFlags;

export const FORBIDDEN_SHADOW_TRACE_CONSUMERS = [
  "applyAction",
  "PlayerAction",
  "PublicEvent",
  "PlayerView",
  "WebSocket payload",
  "Reconnect payload",
  "Undo preview",
  "Replay payload",
  "Client error",
  "Planner weights",
  "Productive feature flag",
] as const;

export type ShadowModeNoEffectFlags = {
  actualDecisionOverride: false;
  productiveScoring: false;
  plannerWeightChange: false;
  engineMutation: false;
  legalityGeneration: false;
  publicPayloadChange: false;
  hiddenInfoLeak: false;
  featureFlagCutover: false;
};

export type ShadowTraceVisibilityScope = "developer_only";

export type ShadowActorSide = "runner" | "corp";

export type ShadowScenarioSetupKind =
  | "fixture_state"
  | "saved_state"
  | "synthetic_legal_actions";

export type ShadowScenarioFixture = {
  scenarioId: string;
  side: ShadowActorSide;
  description: string;
  setupKind: ShadowScenarioSetupKind;
  stateRef?: string;
  expectedLegalActionTypes: string[];
  expectedTacticalGoals: string[];
  requiredCandidateFields: string[];
  knownProjectionGaps: ActionProjectionIssue[];
  hiddenInfoBoundary: string[];
  allowedShadow: boolean;
  reasonIfDisabled?: string;
};

export type ShadowScenarioCorpusSummary = {
  scenarioCount: number;
  runnerScenarioCount: number;
  corpScenarioCount: number;
  advancedScenarioCount: number;
  allowedShadowCount: number;
  syntheticLegalActionCount: number;
  runtimeBackedScenarioCount: number;
  knownProjectionGaps: ActionProjectionIssue[];
};

export type ShadowScenarioCorpusReport = {
  schemaVersion: typeof SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION;
  scope: "shadow_scenario_corpus";
  fixtureRef: string;
  fixtures: ShadowScenarioFixture[];
  summary: ShadowScenarioCorpusSummary;
  hiddenInfoBoundaryPolicy: "explicit_per_fixture";
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type LegacyDecisionTrace = {
  selectedActionId: string;
  selectedActionType: string;
  source: "legacy_ai";
  selectedFromLegalActions: true;
  evidence: string[];
};

export type SemanticShadowScoreStatus =
  | "ranked_shadow_only"
  | "blocked_by_gate"
  | "blocked_by_gap"
  | "no_candidate"
  | "not_scored";

export type ShadowCandidateRank = {
  candidateId: string;
  actionId: string;
  actionType: string;
  rankIndex: number;
  scoreStatus: SemanticShadowScoreStatus;
  evidenceBuckets: {
    goalAlignment: string[];
    doctrineAlignment: string[];
    basicActionValue: string[];
    costPenalty: string[];
    riskPenalty: string[];
    timingFit: string[];
    targetFit: string[];
    boardThreatResponse: string[];
  };
};

export type ShadowBlockingReason = {
  candidateId: string;
  scoreStatus: Extract<
    SemanticShadowScoreStatus,
    "blocked_by_gate" | "blocked_by_gap" | "not_scored"
  >;
  gateId?: ActionGateId;
  gap?: ActionProjectionIssue;
  reason: string;
  evidence: string[];
};

export type SemanticShadowDecision = {
  selectedActionId?: string;
  selectedCandidateId?: string;
  scoreStatus: SemanticShadowScoreStatus;
  ranking: ShadowCandidateRank[];
  blockingReasons: ShadowBlockingReason[];
  whyNot: WhyNotTrace[];
  noRuntimeEffect: true;
};

export type SemanticShadowDecisionScenarioResult = {
  scenarioId: string;
  side: ShadowActorSide;
  decision: SemanticShadowDecision;
};

export type SemanticShadowDecisionSummary = {
  scenarioCount: number;
  rankedShadowOnly: number;
  blockedByGate: number;
  blockedByGap: number;
  noCandidate: number;
  notScored: number;
  selectedActionCount: number;
  runtimeConsumerCount: 0;
  illegalSemanticDecisionCount: 0;
  hiddenInfoViolationCount: 0;
};

export type SemanticShadowDecisionReport = {
  schemaVersion: typeof SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION;
  scope: "semantic_shadow_decision_v0_report_only";
  sourceCorpusSchema: typeof SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION;
  scenarioResults: SemanticShadowDecisionScenarioResult[];
  summary: SemanticShadowDecisionSummary;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type WhyNotTrace = {
  candidateId: string;
  comparedWithCandidateId?: string;
  reason:
    | "hard_gate_blocked"
    | "required_gap"
    | "lower_goal_alignment"
    | "lower_doctrine_alignment"
    | "cost_or_timing_unknown"
    | "target_context_missing"
    | "not_scored";
  evidence: string[];
};

export type SemanticShadowDecisionTrace = {
  selectedActionId?: string;
  selectedCandidateId?: string;
  scoreStatus: SemanticShadowScoreStatus;
  topCandidates: ShadowCandidateRank[];
  blockedCandidates: ShadowBlockingReason[];
  whyNot: WhyNotTrace[];
  noRuntimeEffect: true;
};

export type LegalActionTraceSummary = {
  actionId: string;
  actionType: string;
  source: "engine_legal_actions";
  timingPoint?: string;
  visibilityScope: "actor_private" | "public" | "developer_only";
};

export type ActionSemanticCandidateSummary = {
  candidateId: string;
  actionId: string;
  actionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  hardGateStatus: "pass" | "blocked" | "unknown" | "mixed";
  projectionIssues: ActionProjectionIssue[];
};

export type TacticalGoalTrace = {
  goalId: string;
  family: TacticalGoalFamily;
  side: ShadowActorSide;
  readiness: "ready" | "partial" | "blocked" | "unknown";
  evidence: string[];
};

export type DeckDoctrineReadinessTrace = {
  status: DeckDoctrineV2ReadinessStatus | "unknown";
  gaps: string[];
  evidence: string[];
};

export type ShadowHardGateTraceStatus =
  | "pass"
  | "blocked"
  | "unknown"
  | "not_applicable";

export type ShadowHardGateTraceEntry = {
  gateId: ActionGateId | "actual_decision_legacy_only";
  status: ShadowHardGateTraceStatus;
  severity: "info" | "warning" | "error";
  evidence: string[];
};

export type ShadowHardGateSummary = {
  gateResults: ShadowHardGateTraceEntry[];
  illegalSemanticDecisionCount: 0;
  hiddenInfoViolationCount: 0;
  runtimeEffectCount: 0;
  actualDecisionOverrideCount: 0;
  nonEngineLegalAssumptionCount: 0;
};

export type LegacySemanticDeltaCategory =
  | "same_exact_action"
  | "same_action_type_different_target"
  | "semantic_prefers_economy"
  | "semantic_prefers_setup"
  | "semantic_prefers_run_pressure"
  | "semantic_prefers_remote_contest"
  | "semantic_prefers_score_window"
  | "semantic_prefers_defense"
  | "semantic_avoids_hidden_info"
  | "semantic_blocked_by_target_context"
  | "semantic_blocked_by_ability_gap"
  | "semantic_blocked_by_cost_gap"
  | "semantic_lacks_card_semantics"
  | "legacy_selected_unknown_semantics"
  | "semantic_selected_risky_action"
  | "semantic_selected_unreachable_action"
  | "semantic_selected_low_value_action";

export type LegacySemanticComparisonTrace = {
  agreement:
    | "same_action"
    | "same_action_type"
    | "different_but_plausible"
    | "semantic_better_candidate"
    | "legacy_better_candidate"
    | "semantic_blocked"
    | "comparison_unavailable";
  deltaCategory: LegacySemanticDeltaCategory[];
  explanation: string[];
};

export type LegacySemanticAgreement =
  | "same_action"
  | "same_action_type"
  | "different_but_plausible"
  | "semantic_better_candidate"
  | "legacy_better_candidate"
  | "semantic_blocked"
  | "comparison_unavailable";

export type LegacySemanticComparison = {
  scenarioId: string;
  actorSide: ShadowActorSide;
  legacyActionId: string;
  legacyActionType: string;
  semanticActionId?: string;
  semanticActionType?: string;
  agreement: LegacySemanticAgreement;
  deltaCategory: LegacySemanticDeltaCategory[];
  explanation: string[];
  legacyReferenceSource: "synthetic_fixture_legal_action_order";
  hardGateStatus: "pass" | "blocked_by_gate" | "blocked_by_gap";
};

export type LegacySemanticComparisonSummary = {
  comparisonCount: number;
  sameAction: number;
  sameActionType: number;
  differentButPlausible: number;
  semanticBetterCandidate: number;
  legacyBetterCandidate: number;
  semanticBlocked: number;
  comparisonUnavailable: number;
  hardGateErrorCount: 0;
  hiddenInfoBasedSemanticDecisionCount: 0;
  unreachableSemanticDecisionCount: 0;
  nonEngineLegalSemanticDecisionCount: 0;
};

export type LegacySemanticComparisonReport = {
  schemaVersion: typeof LEGACY_SEMANTIC_SHADOW_COMPARISON_SCHEMA_VERSION;
  scope: "legacy_semantic_shadow_comparison_report_only";
  sourceDecisionSchema: typeof SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION;
  comparisons: LegacySemanticComparison[];
  summary: LegacySemanticComparisonSummary;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export type ShadowDecisionTrace = {
  traceId: string;
  matchId?: string;
  stateVersion: number;
  actorSide: ShadowActorSide;
  legacyDecision: LegacyDecisionTrace;
  semanticShadowDecision?: SemanticShadowDecisionTrace;
  legalActionSummary: LegalActionTraceSummary[];
  candidateSummary: ActionSemanticCandidateSummary[];
  tacticalGoals: TacticalGoalTrace[];
  doctrineReadiness: DeckDoctrineReadinessTrace;
  hardGates: ShadowHardGateSummary;
  comparison?: LegacySemanticComparisonTrace;
  visibilityScope: ShadowTraceVisibilityScope;
  noRuntimeEffect: true;
};

export type ShadowModeTraceContractReport = {
  schemaVersion: typeof SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION;
  scope: "trace_contract_only";
  typeName: "ShadowDecisionTrace";
  requiredTraceFields: Array<keyof ShadowDecisionTrace>;
  requiredLegacyDecisionFields: Array<keyof LegacyDecisionTrace>;
  requiredSemanticDecisionFields: Array<keyof SemanticShadowDecisionTrace>;
  requiredLegalActionSummaryFields: Array<keyof LegalActionTraceSummary>;
  requiredCandidateSummaryFields: Array<keyof ActionSemanticCandidateSummary>;
  visibilityScope: ShadowTraceVisibilityScope;
  actualDecisionContract: "actualDecision_equals_legacyDecision";
  noRuntimeEffect: true;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  forbiddenConsumers: readonly string[];
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const DEFAULT_SHADOW_SCENARIO_CORPUS = [
  scenario({
    scenarioId: "runner_basic_economy",
    side: "runner",
    description: "Runner compares basic credit gain with other safe actions.",
    expectedLegalActionTypes: ["gain_credit"],
    expectedTacticalGoals: ["runner_economy_stabilize"],
    requiredCandidateFields: ["costProfile", "timingProfile", "hardGates"],
  }),
  scenario({
    scenarioId: "runner_draw_vs_credit",
    side: "runner",
    description: "Runner compares drawing with gaining a credit.",
    expectedLegalActionTypes: ["draw_card", "gain_credit"],
    expectedTacticalGoals: ["runner_economy_stabilize", "runner_rig_setup"],
    requiredCandidateFields: ["semanticActionType", "costProfile", "timingProfile"],
  }),
  scenario({
    scenarioId: "runner_install_program",
    side: "runner",
    description: "Runner can install a program from side-safe hand context.",
    expectedLegalActionTypes: ["install_card"],
    expectedTacticalGoals: ["runner_rig_setup"],
    requiredCandidateFields: ["sourceCardId", "costProfile", "targetContext"],
    knownProjectionGaps: [
      "target_context_unavailable",
      "card_semantics_unavailable",
    ],
  }),
  scenario({
    scenarioId: "runner_install_breaker_for_known_ice",
    side: "runner",
    description:
      "Runner can install a breaker while known ICE pressure is visible.",
    expectedLegalActionTypes: ["install_card"],
    expectedTacticalGoals: ["runner_rig_setup", "runner_central_pressure"],
    requiredCandidateFields: ["sourceCardId", "cardContextSignals", "risks"],
    knownProjectionGaps: [
      "ability_unresolved",
      "card_semantics_unavailable",
    ],
  }),
  scenario({
    scenarioId: "runner_start_hq_run",
    side: "runner",
    description: "Runner starts a side-safe HQ run.",
    expectedLegalActionTypes: ["start_run"],
    expectedTacticalGoals: ["runner_central_pressure"],
    requiredCandidateFields: ["targetContext", "timingProfile", "hardGates"],
  }),
  scenario({
    scenarioId: "runner_start_rnd_run",
    side: "runner",
    description: "Runner starts a side-safe R&D run.",
    expectedLegalActionTypes: ["start_run"],
    expectedTacticalGoals: ["runner_central_pressure"],
    requiredCandidateFields: ["targetContext", "timingProfile", "hardGates"],
  }),
  scenario({
    scenarioId: "runner_remote_contest",
    side: "runner",
    description: "Runner pressures a remote without projecting hidden contents.",
    expectedLegalActionTypes: ["start_run"],
    expectedTacticalGoals: ["runner_remote_contest"],
    requiredCandidateFields: ["targetContext", "hardGates"],
    knownProjectionGaps: ["target_context_unavailable"],
    hiddenInfoBoundary: [
      "Remote contents stay unknown unless legally revealed by the Engine.",
    ],
  }),
  scenario({
    scenarioId: "runner_access_steal_agenda",
    side: "runner",
    description: "Runner resolves a legally revealed agenda access.",
    expectedLegalActionTypes: ["steal_agenda"],
    expectedTacticalGoals: ["runner_remote_contest"],
    requiredCandidateFields: ["targetContext", "costProfile", "hardGates"],
  }),
  scenario({
    scenarioId: "runner_access_trash_asset",
    side: "runner",
    description: "Runner evaluates trashing a legally accessed asset.",
    expectedLegalActionTypes: ["trash_accessed_card", "decline_trash"],
    expectedTacticalGoals: ["runner_remote_contest", "runner_survival"],
    requiredCandidateFields: ["targetContext", "costProfile", "risks"],
    knownProjectionGaps: ["target_context_unavailable", "cost_unknown"],
  }),
  scenario({
    scenarioId: "runner_remove_tag",
    side: "runner",
    description: "Runner can remove a visible tag.",
    expectedLegalActionTypes: ["remove_tag"],
    expectedTacticalGoals: ["runner_survival"],
    requiredCandidateFields: ["costProfile", "timingProfile", "risks"],
  }),
  scenario({
    scenarioId: "runner_survival_damage_risk",
    side: "runner",
    description:
      "Runner prioritizes survival when visible damage pressure is documented.",
    expectedLegalActionTypes: ["draw_card", "remove_tag", "gain_credit"],
    expectedTacticalGoals: ["runner_survival"],
    requiredCandidateFields: ["risks", "conditions", "hardGates"],
    knownProjectionGaps: ["card_semantics_unavailable"],
  }),
  scenario({
    scenarioId: "runner_jack_out_vs_continue",
    side: "runner",
    description: "Runner compares jack-out and continue-run choices.",
    expectedLegalActionTypes: ["jack_out", "continue_run"],
    expectedTacticalGoals: ["runner_central_pressure", "runner_survival"],
    requiredCandidateFields: ["timingProfile", "risks", "hardGates"],
  }),
  scenario({
    scenarioId: "runner_break_subroutine",
    side: "runner",
    description: "Runner considers breaking an Engine-provided subroutine.",
    expectedLegalActionTypes: ["break_subroutine", "pump_breaker"],
    expectedTacticalGoals: ["runner_central_pressure", "runner_survival"],
    requiredCandidateFields: ["abilityId", "targetContext", "costProfile"],
    knownProjectionGaps: ["ability_unresolved", "target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_basic_economy",
    side: "corp",
    description: "Corp compares basic credit gain with other safe actions.",
    expectedLegalActionTypes: ["gain_credit"],
    expectedTacticalGoals: ["corp_economy_stabilize"],
    requiredCandidateFields: ["costProfile", "timingProfile", "hardGates"],
  }),
  scenario({
    scenarioId: "corp_install_ice",
    side: "corp",
    description: "Corp can install ICE on a side-safe server target.",
    expectedLegalActionTypes: ["install_card"],
    expectedTacticalGoals: ["corp_central_defense", "corp_ice_tax"],
    requiredCandidateFields: ["targetContext", "sourceCardId", "costProfile"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_rez_ice_window",
    side: "corp",
    description: "Corp compares rez and decline in a paid ability window.",
    expectedLegalActionTypes: ["rez_ice", "decline_rez"],
    expectedTacticalGoals: ["corp_ice_tax", "corp_central_defense"],
    requiredCandidateFields: ["targetContext", "costProfile", "timingProfile"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_advance_agenda",
    side: "corp",
    description: "Corp advances a side-safe installed card.",
    expectedLegalActionTypes: ["advance_card"],
    expectedTacticalGoals: ["corp_remote_score_window"],
    requiredCandidateFields: ["targetContext", "costProfile", "conditions"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_score_agenda",
    side: "corp",
    description: "Corp scores an agenda through an Engine LegalAction.",
    expectedLegalActionTypes: ["score_agenda"],
    expectedTacticalGoals: ["corp_remote_score_window"],
    requiredCandidateFields: ["targetContext", "conditions", "hardGates"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_remote_score_window",
    side: "corp",
    description:
      "Corp compares advance, score and economy in a remote score window.",
    expectedLegalActionTypes: ["advance_card", "score_agenda", "gain_credit"],
    expectedTacticalGoals: ["corp_remote_score_window"],
    requiredCandidateFields: ["targetContext", "conditions", "risks"],
    knownProjectionGaps: [
      "target_context_unavailable",
      "card_semantics_unavailable",
    ],
  }),
  scenario({
    scenarioId: "corp_defend_hq",
    side: "corp",
    description: "Corp defends HQ using side-safe server information.",
    expectedLegalActionTypes: ["install_card", "rez_ice"],
    expectedTacticalGoals: ["corp_central_defense"],
    requiredCandidateFields: ["targetContext", "costProfile", "risks"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_defend_rnd",
    side: "corp",
    description: "Corp defends R&D using side-safe server information.",
    expectedLegalActionTypes: ["install_card", "rez_ice"],
    expectedTacticalGoals: ["corp_central_defense"],
    requiredCandidateFields: ["targetContext", "costProfile", "risks"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "corp_tag_trace_window",
    side: "corp",
    description: "Corp decides whether to boost or decline a trace window.",
    expectedLegalActionTypes: ["resolve_choice", "trigger_ability"],
    expectedTacticalGoals: ["corp_tag_trace_punish"],
    requiredCandidateFields: ["abilityId", "conditions", "costProfile"],
    knownProjectionGaps: ["ability_unresolved", "cost_unknown"],
  }),
  scenario({
    scenarioId: "corp_tagged_runner_punish",
    side: "corp",
    description: "Corp evaluates visible tagged-runner punishment.",
    expectedLegalActionTypes: ["play_operation", "trash_resource"],
    expectedTacticalGoals: ["corp_tag_trace_punish"],
    requiredCandidateFields: ["conditions", "risks", "costProfile"],
    knownProjectionGaps: ["card_semantics_unavailable"],
  }),
  scenario({
    scenarioId: "corp_damage_kill_window",
    side: "corp",
    description: "Corp evaluates a visible damage kill window.",
    expectedLegalActionTypes: ["play_operation", "trigger_ability"],
    expectedTacticalGoals: ["corp_tag_trace_punish"],
    requiredCandidateFields: ["conditions", "risks", "hardGates"],
    knownProjectionGaps: [
      "ability_unresolved",
      "card_semantics_unavailable",
    ],
  }),
  scenario({
    scenarioId: "corp_ambush_or_remote_bait",
    side: "corp",
    description:
      "Corp evaluates a remote-bait context without exposing hidden installed contents.",
    expectedLegalActionTypes: ["install_card", "advance_card"],
    expectedTacticalGoals: ["corp_remote_score_window"],
    requiredCandidateFields: ["targetContext", "conditions", "risks"],
    knownProjectionGaps: [
      "target_context_unavailable",
      "hidden_info_blocked",
    ],
    hiddenInfoBoundary: [
      "Runner-unknown remote contents are not projected into the shadow trace.",
    ],
  }),
  scenario({
    scenarioId: "corp_operation_play",
    side: "corp",
    description: "Corp evaluates a side-safe operation play.",
    expectedLegalActionTypes: ["play_operation"],
    expectedTacticalGoals: ["corp_economy_stabilize", "corp_tag_trace_punish"],
    requiredCandidateFields: ["sourceCardId", "costProfile", "conditions"],
    knownProjectionGaps: ["card_semantics_unavailable"],
  }),
  scenario({
    scenarioId: "trace_boost_or_decline",
    side: "corp",
    description: "Advanced trace choice keeps bid and cost evidence explicit.",
    expectedLegalActionTypes: ["resolve_choice"],
    expectedTacticalGoals: ["corp_tag_trace_punish"],
    requiredCandidateFields: ["costProfile", "timingProfile", "conditions"],
    knownProjectionGaps: ["cost_unknown"],
  }),
  scenario({
    scenarioId: "x_value_choice",
    side: "runner",
    description: "Advanced X-value choice reports unknown cost instead of guessing.",
    expectedLegalActionTypes: ["resolve_choice"],
    expectedTacticalGoals: ["runner_rig_setup"],
    requiredCandidateFields: ["costProfile", "timingProfile", "hardGates"],
    knownProjectionGaps: ["cost_unknown"],
  }),
  scenario({
    scenarioId: "multi_target_choice",
    side: "runner",
    description:
      "Advanced multi-target choice requires Engine-provided target context.",
    expectedLegalActionTypes: ["resolve_choice"],
    expectedTacticalGoals: ["runner_remote_contest"],
    requiredCandidateFields: ["targetContext", "hardGates"],
    knownProjectionGaps: ["target_context_unavailable"],
  }),
  scenario({
    scenarioId: "source_target_advancement_counter",
    side: "corp",
    description:
      "Advanced advancement-counter source/target relation stays explicit.",
    expectedLegalActionTypes: ["advance_card", "trigger_ability"],
    expectedTacticalGoals: ["corp_remote_score_window"],
    requiredCandidateFields: ["sourceCardId", "targetContext", "conditions"],
    knownProjectionGaps: ["target_context_unavailable", "ability_unresolved"],
  }),
  scenario({
    scenarioId: "hidden_info_boundary_unrezzed_ice",
    side: "runner",
    description:
      "Runner-facing shadow diagnostics must not inspect unrezzed ICE details.",
    expectedLegalActionTypes: ["start_run", "jack_out", "continue_run"],
    expectedTacticalGoals: ["runner_central_pressure", "runner_survival"],
    requiredCandidateFields: ["hardGates", "risks"],
    knownProjectionGaps: ["hidden_info_blocked"],
    hiddenInfoBoundary: [
      "Unrezzed ICE identity, subtypes and subroutines stay hidden from Runner shadow input.",
    ],
  }),
  scenario({
    scenarioId: "hidden_resource_boundary",
    side: "corp",
    description:
      "Corp-facing diagnostics must not inspect hidden Runner resource state.",
    expectedLegalActionTypes: ["play_operation", "gain_credit"],
    expectedTacticalGoals: ["corp_tag_trace_punish"],
    requiredCandidateFields: ["hardGates", "conditions"],
    knownProjectionGaps: ["hidden_info_blocked"],
    hiddenInfoBoundary: [
      "Hidden Runner resources and grip/stack contents stay outside Corp shadow input.",
    ],
  }),
  scenario({
    scenarioId: "multi_ability_card_unresolved",
    side: "corp",
    description:
      "Multi-ability card action remains blocked until ability binding is side-safe.",
    expectedLegalActionTypes: ["trigger_ability", "activated_card_ability"],
    expectedTacticalGoals: ["corp_ice_tax", "corp_tag_trace_punish"],
    requiredCandidateFields: ["abilityId", "sourceCardId", "hardGates"],
    knownProjectionGaps: ["ability_unresolved"],
  }),
] as const satisfies readonly ShadowScenarioFixture[];

export function buildShadowModeTraceContractReport(): ShadowModeTraceContractReport {
  return {
    schemaVersion: SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION,
    scope: "trace_contract_only",
    typeName: "ShadowDecisionTrace",
    requiredTraceFields: [
      "traceId",
      "stateVersion",
      "actorSide",
      "legacyDecision",
      "legalActionSummary",
      "candidateSummary",
      "tacticalGoals",
      "doctrineReadiness",
      "hardGates",
      "visibilityScope",
      "noRuntimeEffect",
    ],
    requiredLegacyDecisionFields: [
      "selectedActionId",
      "selectedActionType",
      "source",
      "selectedFromLegalActions",
      "evidence",
    ],
    requiredSemanticDecisionFields: [
      "scoreStatus",
      "topCandidates",
      "blockedCandidates",
      "whyNot",
      "noRuntimeEffect",
    ],
    requiredLegalActionSummaryFields: ["actionId", "actionType", "source"],
    requiredCandidateSummaryFields: [
      "candidateId",
      "primaryProjectionStatus",
      "hardGateStatus",
    ],
    visibilityScope: "developer_only",
    actualDecisionContract: "actualDecision_equals_legacyDecision",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    forbiddenConsumers: FORBIDDEN_SHADOW_TRACE_CONSUMERS,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildShadowScenarioCorpusReport(
  fixtures: readonly ShadowScenarioFixture[] = DEFAULT_SHADOW_SCENARIO_CORPUS,
): ShadowScenarioCorpusReport {
  const copiedFixtures = fixtures.map(copyShadowScenarioFixture);

  return {
    schemaVersion: SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION,
    scope: "shadow_scenario_corpus",
    fixtureRef: "data/scenarios/ai052-shadow-scenario-corpus-2026-06-04.json",
    fixtures: copiedFixtures,
    summary: summarizeShadowScenarioCorpus(copiedFixtures),
    hiddenInfoBoundaryPolicy: "explicit_per_fixture",
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildSemanticShadowDecisionReport(
  fixtures: readonly ShadowScenarioFixture[] = DEFAULT_SHADOW_SCENARIO_CORPUS,
): SemanticShadowDecisionReport {
  const scenarioResults = fixtures.map((fixture) => ({
    scenarioId: fixture.scenarioId,
    side: fixture.side,
    decision: buildSemanticShadowDecisionForFixture(fixture),
  }));

  return {
    schemaVersion: SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION,
    scope: "semantic_shadow_decision_v0_report_only",
    sourceCorpusSchema: SHADOW_SCENARIO_CORPUS_SCHEMA_VERSION,
    scenarioResults,
    summary: summarizeSemanticShadowDecisions(scenarioResults),
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildLegacySemanticComparisonReport(
  fixtures: readonly ShadowScenarioFixture[] = DEFAULT_SHADOW_SCENARIO_CORPUS,
  semanticReport: SemanticShadowDecisionReport =
    buildSemanticShadowDecisionReport(fixtures),
): LegacySemanticComparisonReport {
  const comparisons = fixtures.map((fixture) => {
    const result = semanticReport.scenarioResults.find(
      (candidate) => candidate.scenarioId === fixture.scenarioId,
    );
    return compareLegacyAndSemanticShadowFixture(fixture, result?.decision);
  });

  return {
    schemaVersion: LEGACY_SEMANTIC_SHADOW_COMPARISON_SCHEMA_VERSION,
    scope: "legacy_semantic_shadow_comparison_report_only",
    sourceDecisionSchema: SEMANTIC_SHADOW_DECISION_SCHEMA_VERSION,
    comparisons,
    summary: summarizeLegacySemanticComparisons(comparisons),
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildSemanticShadowDecisionForFixture(
  fixture: ShadowScenarioFixture,
): SemanticShadowDecision {
  const ranking = fixture.expectedLegalActionTypes.map((actionType, index) =>
    rankCandidateForFixture(fixture, actionType, index),
  );
  if (!fixture.allowedShadow || ranking.length === 0) {
    return {
      scoreStatus: "no_candidate",
      ranking,
      blockingReasons: [
        {
          candidateId: `${fixture.scenarioId}.no_candidate`,
          scoreStatus: "not_scored",
          reason:
            fixture.reasonIfDisabled ??
            "Scenario has no semantic shadow candidate in AI053.",
          evidence: [fixture.scenarioId],
        },
      ],
      whyNot: [],
      noRuntimeEffect: true,
    };
  }

  const scoreStatus = scoreStatusForFixture(fixture);
  const blockingReasons =
    scoreStatus === "ranked_shadow_only"
      ? []
      : ranking.flatMap((candidate) => blockingReasonsForCandidate(fixture, candidate));
  const whyNot =
    scoreStatus === "ranked_shadow_only"
      ? whyNotForRankedCandidates(ranking)
      : blockingReasons.map(whyNotForBlockingReason);

  return {
    ...(scoreStatus === "ranked_shadow_only"
      ? selectedFieldsForRanking(ranking)
      : {}),
    scoreStatus,
    ranking,
    blockingReasons,
    whyNot,
    noRuntimeEffect: true,
  };
}

function selectedFieldsForRanking(
  ranking: readonly ShadowCandidateRank[],
): Pick<SemanticShadowDecision, "selectedActionId" | "selectedCandidateId"> | {} {
  const topCandidate = ranking[0];
  if (topCandidate === undefined) return {};
  return {
    selectedActionId: topCandidate.actionId,
    selectedCandidateId: topCandidate.candidateId,
  };
}

function compareLegacyAndSemanticShadowFixture(
  fixture: ShadowScenarioFixture,
  decision: SemanticShadowDecision | undefined,
): LegacySemanticComparison {
  const legacyActionType = fixture.expectedLegalActionTypes[0] ?? "unknown";
  const legacyActionId = `${fixture.scenarioId}.${legacyActionType}.1`;
  if (decision === undefined || decision.scoreStatus === "no_candidate") {
    return {
      scenarioId: fixture.scenarioId,
      actorSide: fixture.side,
      legacyActionId,
      legacyActionType,
      agreement: "comparison_unavailable",
      deltaCategory: ["legacy_selected_unknown_semantics"],
      explanation: [
        "Semantic shadow decision is unavailable for this fixture.",
        "Legacy reference is synthetic fixture order, not runtime truth.",
      ],
      legacyReferenceSource: "synthetic_fixture_legal_action_order",
      hardGateStatus: "blocked_by_gap",
    };
  }

  if (
    decision.scoreStatus === "blocked_by_gate" ||
    decision.scoreStatus === "blocked_by_gap" ||
    decision.scoreStatus === "not_scored"
  ) {
    return {
      scenarioId: fixture.scenarioId,
      actorSide: fixture.side,
      legacyActionId,
      legacyActionType,
      agreement: "semantic_blocked",
      deltaCategory: deltaCategoriesForBlockedDecision(fixture, decision),
      explanation: [
        `Semantic shadow decision is ${decision.scoreStatus}.`,
        ...decision.blockingReasons.map((reason) => reason.reason),
        "Legacy reference remains the synthetic fixture LegalAction reference.",
      ],
      legacyReferenceSource: "synthetic_fixture_legal_action_order",
      hardGateStatus:
        decision.scoreStatus === "blocked_by_gate"
          ? "blocked_by_gate"
          : "blocked_by_gap",
    };
  }

  const semanticActionId = decision.selectedActionId;
  const semanticActionType = decision.ranking[0]?.actionType;
  if (semanticActionId === legacyActionId) {
    return {
      scenarioId: fixture.scenarioId,
      actorSide: fixture.side,
      legacyActionId,
      legacyActionType,
      semanticActionId,
      ...(semanticActionType !== undefined ? { semanticActionType } : {}),
      agreement: "same_action",
      deltaCategory: ["same_exact_action"],
      explanation: [
        "Legacy synthetic reference and semantic shadow reference point to the same LegalAction fixture candidate.",
      ],
      legacyReferenceSource: "synthetic_fixture_legal_action_order",
      hardGateStatus: "pass",
    };
  }

  return {
    scenarioId: fixture.scenarioId,
    actorSide: fixture.side,
    legacyActionId,
    legacyActionType,
    ...(semanticActionId !== undefined ? { semanticActionId } : {}),
    ...(semanticActionType !== undefined ? { semanticActionType } : {}),
    agreement:
      semanticActionType === legacyActionType
        ? "same_action_type"
        : "different_but_plausible",
    deltaCategory:
      semanticActionType === legacyActionType
        ? ["same_action_type_different_target"]
        : deltaCategoriesForActionType(semanticActionType),
    explanation: [
      "Semantic shadow decision differs from the synthetic legacy reference but remains an Engine LegalAction fixture candidate.",
      "This is report-only and does not affect actualDecision.",
    ],
    legacyReferenceSource: "synthetic_fixture_legal_action_order",
    hardGateStatus: "pass",
  };
}

function scenario(
  params: Omit<
    ShadowScenarioFixture,
    "setupKind" | "knownProjectionGaps" | "hiddenInfoBoundary" | "allowedShadow"
  > & {
    setupKind?: ShadowScenarioSetupKind;
    knownProjectionGaps?: ActionProjectionIssue[];
    hiddenInfoBoundary?: string[];
    allowedShadow?: boolean;
  },
): ShadowScenarioFixture {
  return {
    scenarioId: params.scenarioId,
    side: params.side,
    description: params.description,
    setupKind: params.setupKind ?? "synthetic_legal_actions",
    ...(params.stateRef !== undefined ? { stateRef: params.stateRef } : {}),
    expectedLegalActionTypes: [...params.expectedLegalActionTypes],
    expectedTacticalGoals: [...params.expectedTacticalGoals],
    requiredCandidateFields: [...params.requiredCandidateFields],
    knownProjectionGaps: [...(params.knownProjectionGaps ?? [])],
    hiddenInfoBoundary: [
      "No full GameState is available to shadow diagnostics.",
      "No opponent hidden hand, deck, HQ, R&D, grip or stack contents are projected.",
      ...(params.hiddenInfoBoundary ?? []),
    ],
    allowedShadow: params.allowedShadow ?? true,
    ...(params.reasonIfDisabled !== undefined
      ? { reasonIfDisabled: params.reasonIfDisabled }
      : {}),
  };
}

function copyShadowScenarioFixture(
  fixture: ShadowScenarioFixture,
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
    knownProjectionGaps: [...fixture.knownProjectionGaps],
    hiddenInfoBoundary: [...fixture.hiddenInfoBoundary],
    allowedShadow: fixture.allowedShadow,
    ...(fixture.reasonIfDisabled !== undefined
      ? { reasonIfDisabled: fixture.reasonIfDisabled }
      : {}),
  };
}

function summarizeShadowScenarioCorpus(
  fixtures: readonly ShadowScenarioFixture[],
): ShadowScenarioCorpusSummary {
  return {
    scenarioCount: fixtures.length,
    runnerScenarioCount: fixtures.filter((fixture) => fixture.side === "runner")
      .length,
    corpScenarioCount: fixtures.filter((fixture) => fixture.side === "corp")
      .length,
    advancedScenarioCount: fixtures.filter((fixture) =>
      [
        "trace_boost_or_decline",
        "x_value_choice",
        "multi_target_choice",
        "source_target_advancement_counter",
        "hidden_info_boundary_unrezzed_ice",
        "hidden_resource_boundary",
        "multi_ability_card_unresolved",
      ].includes(fixture.scenarioId),
    ).length,
    allowedShadowCount: fixtures.filter((fixture) => fixture.allowedShadow).length,
    syntheticLegalActionCount: fixtures.filter(
      (fixture) => fixture.setupKind === "synthetic_legal_actions",
    ).length,
    runtimeBackedScenarioCount: fixtures.filter(
      (fixture) => fixture.setupKind !== "synthetic_legal_actions",
    ).length,
    knownProjectionGaps: [
      ...new Set(fixtures.flatMap((fixture) => fixture.knownProjectionGaps)),
    ],
  };
}

function rankCandidateForFixture(
  fixture: ShadowScenarioFixture,
  actionType: string,
  index: number,
): ShadowCandidateRank {
  const scoreStatus = scoreStatusForFixture(fixture);
  const candidateId = `${fixture.scenarioId}.${actionType}.${index + 1}`;

  return {
    candidateId,
    actionId: candidateId,
    actionType,
    rankIndex: index,
    scoreStatus,
    evidenceBuckets: {
      goalAlignment: fixture.expectedTacticalGoals.map(
        (goal) => `AI053 fixture goal evidence: ${goal}`,
      ),
      doctrineAlignment: [
        "AI053 v0 uses only declared fixture goals and side-safe diagnostics.",
      ],
      basicActionValue: [
        `AI053 deterministic input-order candidate: ${actionType}`,
      ],
      costPenalty: gapEvidence(fixture, "cost_unknown"),
      riskPenalty: gapEvidence(fixture, "card_semantics_unavailable"),
      timingFit: gapEvidence(fixture, "timing_unknown"),
      targetFit: gapEvidence(fixture, "target_context_unavailable"),
      boardThreatResponse: gapEvidence(fixture, "hidden_info_blocked"),
    },
  };
}

function scoreStatusForFixture(
  fixture: ShadowScenarioFixture,
): SemanticShadowScoreStatus {
  if (!fixture.allowedShadow) return "not_scored";
  if (fixture.expectedLegalActionTypes.length === 0) return "no_candidate";
  if (fixture.knownProjectionGaps.includes("hidden_info_blocked")) {
    return "blocked_by_gate";
  }
  if (fixture.knownProjectionGaps.length > 0) return "blocked_by_gap";
  return "ranked_shadow_only";
}

function blockingReasonsForCandidate(
  fixture: ShadowScenarioFixture,
  candidate: ShadowCandidateRank,
): ShadowBlockingReason[] {
  if (fixture.knownProjectionGaps.includes("hidden_info_blocked")) {
    return [
      {
        candidateId: candidate.candidateId,
        scoreStatus: "blocked_by_gate",
        gateId: "hidden_info",
        gap: "hidden_info_blocked",
        reason: "Hidden-info boundary blocks semantic shadow ranking.",
        evidence: [...fixture.hiddenInfoBoundary],
      },
    ];
  }

  return fixture.knownProjectionGaps.map((gap) => ({
    candidateId: candidate.candidateId,
    scoreStatus: "blocked_by_gap",
    gap,
    reason: `Required diagnostic evidence is unavailable: ${gap}`,
    evidence: [
      fixture.scenarioId,
      ...fixture.requiredCandidateFields.map((field) => `requires ${field}`),
    ],
  }));
}

function whyNotForRankedCandidates(
  ranking: readonly ShadowCandidateRank[],
): WhyNotTrace[] {
  const topCandidate = ranking[0];
  if (topCandidate === undefined) return [];
  return ranking.slice(1).map((candidate) => ({
    candidateId: candidate.candidateId,
    comparedWithCandidateId: topCandidate.candidateId,
    reason: "lower_goal_alignment",
    evidence: [
      "AI053 v0 uses deterministic input order when no hard gate or required gap blocks ranking.",
    ],
  }));
}

function whyNotForBlockingReason(reason: ShadowBlockingReason): WhyNotTrace {
  return {
    candidateId: reason.candidateId,
    reason: whyNotReasonForBlockingReason(reason),
    evidence: [...reason.evidence],
  };
}

function whyNotReasonForBlockingReason(
  reason: ShadowBlockingReason,
): WhyNotTrace["reason"] {
  if (reason.scoreStatus === "blocked_by_gate") return "hard_gate_blocked";
  if (reason.gap === "target_context_unavailable") {
    return "target_context_missing";
  }
  if (reason.gap === "cost_unknown" || reason.gap === "timing_unknown") {
    return "cost_or_timing_unknown";
  }
  return "required_gap";
}

function gapEvidence(
  fixture: ShadowScenarioFixture,
  gap: ActionProjectionIssue,
): string[] {
  return fixture.knownProjectionGaps.includes(gap)
    ? [`AI053 blocked evidence gap: ${gap}`]
    : [];
}

function summarizeSemanticShadowDecisions(
  scenarioResults: readonly SemanticShadowDecisionScenarioResult[],
): SemanticShadowDecisionSummary {
  return {
    scenarioCount: scenarioResults.length,
    rankedShadowOnly: countDecisions(scenarioResults, "ranked_shadow_only"),
    blockedByGate: countDecisions(scenarioResults, "blocked_by_gate"),
    blockedByGap: countDecisions(scenarioResults, "blocked_by_gap"),
    noCandidate: countDecisions(scenarioResults, "no_candidate"),
    notScored: countDecisions(scenarioResults, "not_scored"),
    selectedActionCount: scenarioResults.filter(
      (result) => result.decision.selectedActionId !== undefined,
    ).length,
    runtimeConsumerCount: 0,
    illegalSemanticDecisionCount: 0,
    hiddenInfoViolationCount: 0,
  };
}

function countDecisions(
  scenarioResults: readonly SemanticShadowDecisionScenarioResult[],
  status: SemanticShadowScoreStatus,
): number {
  return scenarioResults.filter((result) => result.decision.scoreStatus === status)
    .length;
}

function deltaCategoriesForBlockedDecision(
  fixture: ShadowScenarioFixture,
  decision: SemanticShadowDecision,
): LegacySemanticDeltaCategory[] {
  if (decision.scoreStatus === "blocked_by_gate") {
    return fixture.knownProjectionGaps.includes("hidden_info_blocked")
      ? ["semantic_avoids_hidden_info"]
      : ["semantic_selected_risky_action"];
  }

  const categories = fixture.knownProjectionGaps.flatMap((gap) => {
    if (gap === "target_context_unavailable") {
      return ["semantic_blocked_by_target_context" as const];
    }
    if (gap === "ability_unresolved") {
      return ["semantic_blocked_by_ability_gap" as const];
    }
    if (gap === "cost_unknown" || gap === "timing_unknown") {
      return ["semantic_blocked_by_cost_gap" as const];
    }
    if (gap === "card_semantics_unavailable") {
      return ["semantic_lacks_card_semantics" as const];
    }
    if (gap === "hidden_info_blocked") {
      return ["semantic_avoids_hidden_info" as const];
    }
    return ["legacy_selected_unknown_semantics" as const];
  });

  return categories.length > 0 ? [...new Set(categories)] : [
    "legacy_selected_unknown_semantics",
  ];
}

function deltaCategoriesForActionType(
  actionType: string | undefined,
): LegacySemanticDeltaCategory[] {
  if (actionType === undefined) return ["legacy_selected_unknown_semantics"];
  if (actionType === "gain_credit" || actionType === "draw_card") {
    return ["semantic_prefers_economy"];
  }
  if (actionType === "install_card") return ["semantic_prefers_setup"];
  if (actionType === "start_run") return ["semantic_prefers_run_pressure"];
  if (actionType === "score_agenda" || actionType === "advance_card") {
    return ["semantic_prefers_score_window"];
  }
  if (actionType === "rez_ice") return ["semantic_prefers_defense"];
  return ["legacy_selected_unknown_semantics"];
}

function summarizeLegacySemanticComparisons(
  comparisons: readonly LegacySemanticComparison[],
): LegacySemanticComparisonSummary {
  return {
    comparisonCount: comparisons.length,
    sameAction: countComparisons(comparisons, "same_action"),
    sameActionType: countComparisons(comparisons, "same_action_type"),
    differentButPlausible: countComparisons(
      comparisons,
      "different_but_plausible",
    ),
    semanticBetterCandidate: countComparisons(
      comparisons,
      "semantic_better_candidate",
    ),
    legacyBetterCandidate: countComparisons(
      comparisons,
      "legacy_better_candidate",
    ),
    semanticBlocked: countComparisons(comparisons, "semantic_blocked"),
    comparisonUnavailable: countComparisons(
      comparisons,
      "comparison_unavailable",
    ),
    hardGateErrorCount: 0,
    hiddenInfoBasedSemanticDecisionCount: 0,
    unreachableSemanticDecisionCount: 0,
    nonEngineLegalSemanticDecisionCount: 0,
  };
}

function countComparisons(
  comparisons: readonly LegacySemanticComparison[],
  agreement: LegacySemanticAgreement,
): number {
  return comparisons.filter((comparison) => comparison.agreement === agreement)
    .length;
}
