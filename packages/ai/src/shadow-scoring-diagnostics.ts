import type {
  ActionGateId,
  ActionGateResult,
  ActionProjectionIssue,
} from "./action-semantic-candidate";
import {
  DIAGNOSTIC_NO_EFFECT_FLAGS,
  type DiagnosticNoEffectFlags,
  type TacticalGoalFamily,
} from "./action-doctrine-goal-diagnostics";

export const SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION =
  "shadow-scoring-fixture-design-v1" as const;

export const SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION =
  "shadow-action-ranking-report-v1" as const;

export const LEGACY_SEMANTIC_COMPARISON_HARNESS_SCHEMA_VERSION =
  "legacy-semantic-comparison-harness-v1" as const;

export const HARD_GATE_ROLLBACK_READINESS_REVIEW_SCHEMA_VERSION =
  "hard-gate-rollback-readiness-review-v1" as const;

export type ShadowFixtureSide = "runner" | "corp";

export type ShadowFixtureHiddenInfoPolicy =
  | "public_or_actor_private_only"
  | "engine_provided_targets_only"
  | "hidden_info_blocked";

export type ShadowFixtureLegalActionRef = {
  actionRef: string;
  actionType: string;
  semanticActionType: string;
  knownGaps: ActionProjectionIssue[];
};

export type ShadowScoringFixtureScenario = {
  scenarioId: string;
  side: ShadowFixtureSide;
  boardSituationSummary: string;
  availableLegalActions: ShadowFixtureLegalActionRef[];
  expectedRelevantGoals: TacticalGoalFamily[];
  knownGaps: ActionProjectionIssue[];
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy;
  legacySelectedAction?: string;
  semanticShadowAllowed: boolean;
};

export type ShadowScoringInputPolicy = {
  allowedScoringInputs: string[];
  forbiddenScoringInputs: string[];
};

export type ShadowHardGateMatrixEntry = {
  gateId: ActionGateId;
  requiredFor:
    | "all_candidates"
    | "target_sensitive_goals"
    | "multi_ability_card_scoring"
    | "cost_sensitive_scoring"
    | "timing_sensitive_scoring";
  passPolicy: "must_pass" | "required_when_applicable";
  unknownPolicy: "score_status_blocked_by_gap" | "report_only_allowed";
  blockPolicy: "score_status_blocked_by_gate";
  evidence: string[];
};

export type ShadowScoreDraftStatus =
  | "not_scored"
  | "blocked_by_gate"
  | "blocked_by_gap"
  | "score_draft_available";

export type ShadowActionScoreDraft = {
  candidateId: string;
  scenarioId: string;
  scoreStatus: ShadowScoreDraftStatus;
  goalMatches: string[];
  hardGateResults: ActionGateResult[];
  positiveEvidence: string[];
  negativeEvidence: string[];
  riskEvidence: string[];
  missingEvidence: string[];
};

export type ShadowScoreDraftSchemaDescriptor = {
  typeName: "ShadowActionScoreDraft";
  fields: Array<keyof ShadowActionScoreDraft>;
  forbiddenFields: string[];
};

export type ShadowScoringFixtureDesignSummary = {
  fixtureCount: number;
  runnerFixtureCount: number;
  corpFixtureCount: number;
  semanticShadowAllowedCount: number;
  knownGapCategories: ActionProjectionIssue[];
};

export type ShadowScoringFixtureDesignReport = {
  schemaVersion: typeof SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION;
  scope: "shadow_fixture_design_only";
  fixtureCorpus: ShadowScoringFixtureScenario[];
  inputPolicy: ShadowScoringInputPolicy;
  hardGateMatrix: ShadowHardGateMatrixEntry[];
  scoreDraftSchema: ShadowScoreDraftSchemaDescriptor;
  blockedGapPolicy: {
    scoreStatus: Extract<ShadowScoreDraftStatus, "blocked_by_gap">;
    topGaps: ActionProjectionIssue[];
    rule: string;
  };
  recommendedAI048Scope: string[];
  summary: ShadowScoringFixtureDesignSummary;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export type ShadowActionOrderingBucket =
  | "score_draft_available"
  | "blocked_by_gap"
  | "blocked_by_gate"
  | "not_scored";

export type ShadowActionRankingCandidateDraft = {
  scenarioId: string;
  side: ShadowFixtureSide;
  candidateId: string;
  actionType: string;
  scoreStatus: ShadowScoreDraftStatus;
  goalMatches: TacticalGoalFamily[];
  hardGateFailures: ActionGateId[];
  unresolvedGaps: ActionProjectionIssue[];
  positiveEvidence: string[];
  negativeEvidence: string[];
  riskEvidence: string[];
  missingEvidence: string[];
};

export type ShadowActionRankingEntry = {
  scenarioId: string;
  candidateId: string;
  actionType: string;
  reportOnlyOrderIndex: number;
  bucket: ShadowActionOrderingBucket;
  scoreStatus: ShadowScoreDraftStatus;
  goalMatches: TacticalGoalFamily[];
  hardGateFailures: ActionGateId[];
  unresolvedGaps: ActionProjectionIssue[];
  reasons: string[];
  evidence: string[];
};

export type ShadowActionRankingScenarioReport = {
  scenarioId: string;
  side: ShadowFixtureSide;
  legacyActionRef?: string;
  orderedCandidates: ShadowActionRankingEntry[];
  unresolvedGapCategories: ActionProjectionIssue[];
  hardGateFailureCategories: ActionGateId[];
};

export type ShadowActionRankingSummary = {
  scenarioCount: number;
  candidateCount: number;
  scoreDraftAvailable: number;
  blockedByGap: number;
  blockedByGate: number;
  notScored: number;
};

export type ShadowActionRankingReport = {
  schemaVersion: typeof SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION;
  scope: "report_only_shadow_ordering";
  rankingPolicy: "status_bucket_then_fixture_order";
  scenarioReports: ShadowActionRankingScenarioReport[];
  summary: ShadowActionRankingSummary;
  semanticExecutionAllowed: false;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export type LegacyActionReference = {
  scenarioId: string;
  legacyActionRef: string;
  evidence: string[];
};

export type LegacySemanticComparisonCategory =
  | "same_reference"
  | "safe_divergence"
  | "risky_divergence"
  | "insufficient_evidence"
  | "not_compared";

export type LegacySemanticComparisonEntry = {
  scenarioId: string;
  side: ShadowFixtureSide;
  category: LegacySemanticComparisonCategory;
  legacyActionRef?: string;
  semanticReportOnlyRef?: string;
  semanticBucket?: ShadowActionOrderingBucket;
  reasons: string[];
  evidence: string[];
};

export type LegacySemanticComparisonSummary = {
  scenarioCount: number;
  comparedScenarios: number;
  sameReference: number;
  safeDivergence: number;
  riskyDivergence: number;
  insufficientEvidence: number;
  notCompared: number;
};

export type LegacySemanticComparisonHarnessReport = {
  schemaVersion: typeof LEGACY_SEMANTIC_COMPARISON_HARNESS_SCHEMA_VERSION;
  scope: "diagnostic_legacy_semantic_comparison_only";
  sourceRankingSchema: typeof SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION;
  entries: LegacySemanticComparisonEntry[];
  summary: LegacySemanticComparisonSummary;
  semanticExecutionAllowed: false;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export type ShadowReadinessState =
  | "ready_with_constraints"
  | "blocked"
  | "not_evaluated";

export type HardGateRollbackReadinessGate = {
  gateId: string;
  state: ShadowReadinessState;
  evidence: string[];
  removalCondition?: string;
};

export type ProposedSemanticFeatureFlag = {
  flagId: string;
  intendedScope: string;
  defaultState: "off";
  rollbackRule: string;
};

export type HardGateRollbackReadinessReviewReport = {
  schemaVersion: typeof HARD_GATE_ROLLBACK_READINESS_REVIEW_SCHEMA_VERSION;
  scope: "hard_gate_rollback_readiness_review_only";
  broaderShadowSimulationReadiness: ShadowReadinessState;
  productiveCutoverReadiness: Extract<ShadowReadinessState, "blocked">;
  gates: HardGateRollbackReadinessGate[];
  proposedFeatureFlags: ProposedSemanticFeatureFlag[];
  rollbackRules: string[];
  missingBeforeCutover: string[];
  recommendedNextStep: "broader_shadow_simulation";
  semanticExecutionAllowed: false;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export const DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS = [
  runnerFixture("ai047-runner-economy-stabilize", "Runner credits are low and basic economy actions are legal.", ["runner_economy_stabilize"], [
    actionRef("gain_credit", "gain_credit", "economy.gain_credit"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  runnerFixture("ai047-runner-rig-setup-install-program", "Runner can install a visible program but card semantics are partial.", ["runner_rig_setup"], [
    actionRef("install_program", "install_card", "install.card", [
      "card_semantics_unavailable",
    ]),
  ], ["card_semantics_unavailable"]),
  runnerFixture("ai047-runner-central-pressure", "Runner has a central run option with engine-provided server target.", ["runner_central_pressure"], [
    actionRef("run_hq", "start_run", "run.start"),
    actionRef("run_rd", "start_run", "run.start"),
  ]),
  runnerFixture("ai047-runner-remote-contest", "Runner sees a remote threat but target details may be unavailable.", ["runner_remote_contest"], [
    actionRef("run_remote", "start_run", "run.start", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  runnerFixture("ai047-runner-survival", "Runner is tagged or under visible damage threat.", ["runner_survival"], [
    actionRef("remove_tag", "remove_tag", "tag.remove"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  runnerFixture("ai047-runner-access-decision", "Runner is resolving access with steal/trash/decline branches.", ["runner_remote_contest"], [
    actionRef("steal_agenda", "steal_agenda", "access.steal_agenda"),
    actionRef("trash_accessed_card", "trash_accessed_card", "access.trash_accessed_card", [
      "target_context_unavailable",
    ]),
    actionRef("decline_trash", "decline_trash", "access.decline_trash"),
  ], ["target_context_unavailable"]),
  runnerFixture("ai047-runner-run-continuation", "Runner is in a run continuation window with continue, jack out and breaker actions.", ["runner_central_pressure", "runner_survival"], [
    actionRef("continue_run", "continue_run", "run.continue"),
    actionRef("jack_out", "jack_out", "run.jack_out"),
    actionRef("break_subroutine", "break_subroutine", "breaker.break_subroutine", [
      "ability_unresolved",
    ]),
  ], ["ability_unresolved"]),
  corpFixture("ai047-corp-economy-stabilize", "Corp has low credits and basic economy actions are legal.", ["corp_economy_stabilize"], [
    actionRef("gain_credit", "gain_credit", "economy.gain_credit"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  corpFixture("ai047-corp-remote-score-window", "Corp has a possible remote score line with target context still required.", ["corp_remote_score_window"], [
    actionRef("advance_card", "advance_card", "score.advance_card", [
      "target_context_unavailable",
    ]),
    actionRef("score_agenda", "score_agenda", "score.agenda", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-central-defense", "Corp can install or rez central protection.", ["corp_central_defense"], [
    actionRef("install_ice_hq", "install_card", "install.card", [
      "target_context_unavailable",
    ]),
    actionRef("rez_ice", "rez_ice", "corp_window.rez"),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-ice-tax-rez-window", "Corp is in a rez window and ICE tax diagnostics need target/ability evidence.", ["corp_ice_tax"], [
    actionRef("rez_ice", "rez_ice", "corp_window.rez"),
    actionRef("decline_rez", "decline_rez", "corp_window.decline_rez"),
  ]),
  corpFixture("ai047-corp-tag-trace-punish", "Corp has a visible tag or trace punish line but ability evidence may be unresolved.", ["corp_tag_trace_punish"], [
    actionRef("play_operation", "play_operation", "play.corp_operation", [
      "ability_unresolved",
    ]),
  ], ["ability_unresolved"]),
  corpFixture("ai047-corp-advance-score", "Corp compares advance and score branches without selecting an action.", ["corp_remote_score_window"], [
    actionRef("advance_card", "advance_card", "score.advance_card", [
      "target_context_unavailable",
    ]),
    actionRef("score_agenda", "score_agenda", "score.agenda", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-ambush-access-punish", "Corp ambush/access-punish context is only side-safe when hidden info stays blocked.", ["corp_tag_trace_punish"], [
    actionRef("trigger_ability", "trigger_ability", "card_ability.trigger", [
      "ability_unresolved",
      "hidden_info_blocked",
    ]),
  ], ["ability_unresolved", "hidden_info_blocked"], "hidden_info_blocked", false),
] as const satisfies readonly ShadowScoringFixtureScenario[];

export const DEFAULT_SHADOW_SCORING_INPUT_POLICY = {
  allowedScoringInputs: [
    "action.semanticActionType",
    "action.cardContextSignals",
    "action.actionTacticSignals",
    "action.strategySupport",
    "action.conditions",
    "action.risks",
    "action.constraints",
    "action.costProfile",
    "action.timingProfile",
    "action.targetContext.engine_provided_only",
    "action.boardContext",
    "action.hardGates",
    "TacticalGoal.evidence",
    "DeckDoctrineV2.readiness",
  ],
  forbiddenScoringInputs: [
    "full_game_state",
    "opponent_hidden_cards",
    "non_side_safe_targets",
    "non_engine_provided_target_options",
    "legacy_plan_role_as_truth",
    "freeform_guessed_scores",
  ],
} as const satisfies ShadowScoringInputPolicy;

export const DEFAULT_SHADOW_HARD_GATE_MATRIX = [
  hardGate("engine_legal_action", "all_candidates", "must_pass"),
  hardGate("hidden_info", "all_candidates", "must_pass"),
  hardGate("side_visibility", "all_candidates", "must_pass"),
  hardGate("runtime_no_effect", "all_candidates", "must_pass"),
  hardGate("target_context", "target_sensitive_goals", "required_when_applicable"),
  hardGate(
    "ability_resolution",
    "multi_ability_card_scoring",
    "required_when_applicable",
  ),
  hardGate("cost_known", "cost_sensitive_scoring", "required_when_applicable"),
  hardGate("timing_known", "timing_sensitive_scoring", "required_when_applicable"),
] as const satisfies readonly ShadowHardGateMatrixEntry[];

export const SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR = {
  typeName: "ShadowActionScoreDraft",
  fields: [
    "candidateId",
    "scenarioId",
    "scoreStatus",
    "goalMatches",
    "hardGateResults",
    "positiveEvidence",
    "negativeEvidence",
    "riskEvidence",
    "missingEvidence",
  ],
  forbiddenFields: ["liveScore", "runtimeRank", "selectedAction"],
} as const satisfies ShadowScoreDraftSchemaDescriptor;

export const DEFAULT_LEGACY_ACTION_REFERENCES = [
  legacyReference(
    "ai047-runner-economy-stabilize",
    "ai047-runner-economy-stabilize.gain_credit",
  ),
  legacyReference(
    "ai047-runner-access-decision",
    "ai047-runner-access-decision.trash_accessed_card",
  ),
  legacyReference(
    "ai047-runner-run-continuation",
    "ai047-runner-run-continuation.jack_out",
  ),
  legacyReference(
    "ai047-corp-economy-stabilize",
    "ai047-corp-economy-stabilize.gain_credit",
  ),
  legacyReference(
    "ai047-corp-remote-score-window",
    "ai047-corp-remote-score-window.score_agenda",
  ),
  legacyReference(
    "ai047-corp-ambush-access-punish",
    "ai047-corp-ambush-access-punish.trigger_ability",
  ),
] as const satisfies readonly LegacyActionReference[];

export function buildShadowScoringFixtureDesignReport(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[] =
    DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS,
): ShadowScoringFixtureDesignReport {
  const copiedFixtureCorpus = fixtureCorpus.map(copyFixtureScenario);

  return {
    schemaVersion: SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION,
    scope: "shadow_fixture_design_only",
    fixtureCorpus: copiedFixtureCorpus,
    inputPolicy: {
      allowedScoringInputs: [
        ...DEFAULT_SHADOW_SCORING_INPUT_POLICY.allowedScoringInputs,
      ],
      forbiddenScoringInputs: [
        ...DEFAULT_SHADOW_SCORING_INPUT_POLICY.forbiddenScoringInputs,
      ],
    },
    hardGateMatrix: DEFAULT_SHADOW_HARD_GATE_MATRIX.map((entry) => ({
      ...entry,
      evidence: [...entry.evidence],
    })),
    scoreDraftSchema: {
      typeName: SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.typeName,
      fields: [...SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.fields],
      forbiddenFields: [...SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.forbiddenFields],
    },
    blockedGapPolicy: {
      scoreStatus: "blocked_by_gap",
      topGaps: [
        "target_context_unavailable",
        "ability_unresolved",
        "card_semantics_unavailable",
      ],
      rule:
        "Required unknown or partial gates may appear in the report, but no draft score is available.",
    },
    recommendedAI048Scope: [
      "report-only shadow ordering",
      "goal alignment explanations",
      "hard gate failures",
      "unresolved gap buckets",
      "legacy action reference when already available",
    ],
    summary: summarizeFixtureDesign(copiedFixtureCorpus),
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

export function buildShadowActionRankingReport(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[] =
    DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS,
  candidateDrafts: readonly ShadowActionRankingCandidateDraft[] =
    buildDefaultShadowRankingCandidateDrafts(fixtureCorpus),
): ShadowActionRankingReport {
  const scenarioReports = fixtureCorpus.map((scenario) =>
    buildShadowRankingScenarioReport(scenario, candidateDrafts),
  );

  return {
    schemaVersion: SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION,
    scope: "report_only_shadow_ordering",
    rankingPolicy: "status_bucket_then_fixture_order",
    scenarioReports,
    summary: summarizeShadowActionRanking(scenarioReports),
    semanticExecutionAllowed: false,
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

export function buildLegacySemanticComparisonHarnessReport(
  rankingReport: ShadowActionRankingReport = buildShadowActionRankingReport(),
  legacyReferences: readonly LegacyActionReference[] =
    DEFAULT_LEGACY_ACTION_REFERENCES,
): LegacySemanticComparisonHarnessReport {
  const entries = rankingReport.scenarioReports.map((scenario) =>
    compareLegacyAndSemanticScenario(scenario, legacyReferences),
  );

  return {
    schemaVersion: LEGACY_SEMANTIC_COMPARISON_HARNESS_SCHEMA_VERSION,
    scope: "diagnostic_legacy_semantic_comparison_only",
    sourceRankingSchema: SHADOW_ACTION_RANKING_REPORT_SCHEMA_VERSION,
    entries,
    summary: summarizeLegacySemanticComparison(entries),
    semanticExecutionAllowed: false,
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

export function buildHardGateRollbackReadinessReviewReport(
  comparisonReport: LegacySemanticComparisonHarnessReport =
    buildLegacySemanticComparisonHarnessReport(),
): HardGateRollbackReadinessReviewReport {
  const broaderShadowReady =
    comparisonReport.summary.comparedScenarios > 0
      ? "ready_with_constraints"
      : "not_evaluated";

  return {
    schemaVersion: HARD_GATE_ROLLBACK_READINESS_REVIEW_SCHEMA_VERSION,
    scope: "hard_gate_rollback_readiness_review_only",
    broaderShadowSimulationReadiness: broaderShadowReady,
    productiveCutoverReadiness: "blocked",
    gates: readinessGates(comparisonReport),
    proposedFeatureFlags: proposedSemanticFeatureFlags(),
    rollbackRules: rollbackRules(),
    missingBeforeCutover: [
      "broader_shadow_simulation_results",
      "zero_hidden_info_violations_in_shadow",
      "zero_illegal_semantic_references",
      "resolved_or_explicitly_blocked_target_context_gaps",
      "resolved_or_explicitly_blocked_ability_gaps",
      "runtime_feature_flags_with_rollback",
      "public_debug_scrubber_review",
    ],
    recommendedNextStep: "broader_shadow_simulation",
    semanticExecutionAllowed: false,
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

function runnerFixture(
  scenarioId: string,
  boardSituationSummary: string,
  expectedRelevantGoals: TacticalGoalFamily[],
  availableLegalActions: ShadowFixtureLegalActionRef[],
  knownGaps: ActionProjectionIssue[] = [],
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy =
    "public_or_actor_private_only",
  semanticShadowAllowed = true,
): ShadowScoringFixtureScenario {
  return {
    scenarioId,
    side: "runner",
    boardSituationSummary,
    availableLegalActions,
    expectedRelevantGoals,
    knownGaps,
    hiddenInfoPolicy,
    semanticShadowAllowed,
  };
}

function corpFixture(
  scenarioId: string,
  boardSituationSummary: string,
  expectedRelevantGoals: TacticalGoalFamily[],
  availableLegalActions: ShadowFixtureLegalActionRef[],
  knownGaps: ActionProjectionIssue[] = [],
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy =
    "public_or_actor_private_only",
  semanticShadowAllowed = true,
): ShadowScoringFixtureScenario {
  return {
    scenarioId,
    side: "corp",
    boardSituationSummary,
    availableLegalActions,
    expectedRelevantGoals,
    knownGaps,
    hiddenInfoPolicy,
    semanticShadowAllowed,
  };
}

function actionRef(
  actionRefId: string,
  actionType: string,
  semanticActionType: string,
  knownGaps: ActionProjectionIssue[] = [],
): ShadowFixtureLegalActionRef {
  return {
    actionRef: actionRefId,
    actionType,
    semanticActionType,
    knownGaps,
  };
}

function legacyReference(
  scenarioId: string,
  legacyActionRef: string,
): LegacyActionReference {
  return {
    scenarioId,
    legacyActionRef,
    evidence: [`AI049 fixture legacy reference: ${legacyActionRef}`],
  };
}

function hardGate(
  gateId: ActionGateId,
  requiredFor: ShadowHardGateMatrixEntry["requiredFor"],
  passPolicy: ShadowHardGateMatrixEntry["passPolicy"],
): ShadowHardGateMatrixEntry {
  return {
    gateId,
    requiredFor,
    passPolicy,
    unknownPolicy:
      passPolicy === "must_pass"
        ? "score_status_blocked_by_gap"
        : "report_only_allowed",
    blockPolicy: "score_status_blocked_by_gate",
    evidence: [`AI047 hard gate matrix: ${gateId}`],
  };
}

function copyFixtureScenario(
  scenario: ShadowScoringFixtureScenario,
): ShadowScoringFixtureScenario {
  return {
    scenarioId: scenario.scenarioId,
    side: scenario.side,
    boardSituationSummary: scenario.boardSituationSummary,
    availableLegalActions: scenario.availableLegalActions.map((action) => ({
      actionRef: action.actionRef,
      actionType: action.actionType,
      semanticActionType: action.semanticActionType,
      knownGaps: [...action.knownGaps],
    })),
    expectedRelevantGoals: [...scenario.expectedRelevantGoals],
    knownGaps: [...scenario.knownGaps],
    hiddenInfoPolicy: scenario.hiddenInfoPolicy,
    ...(scenario.legacySelectedAction !== undefined
      ? { legacySelectedAction: scenario.legacySelectedAction }
      : {}),
    semanticShadowAllowed: scenario.semanticShadowAllowed,
  };
}

function buildDefaultShadowRankingCandidateDrafts(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[],
): ShadowActionRankingCandidateDraft[] {
  return fixtureCorpus.flatMap((scenario) =>
    scenario.availableLegalActions.map((action) => {
      const hiddenInfoBlocked =
        scenario.hiddenInfoPolicy === "hidden_info_blocked" ||
        action.knownGaps.includes("hidden_info_blocked");
      const unresolvedGaps = uniqueProjectionIssues(action.knownGaps);
      const scoreStatus: ShadowScoreDraftStatus = hiddenInfoBlocked
        ? "blocked_by_gate"
        : unresolvedGaps.length > 0
          ? "blocked_by_gap"
          : "score_draft_available";

      return {
        scenarioId: scenario.scenarioId,
        side: scenario.side,
        candidateId: `${scenario.scenarioId}.${action.actionRef}`,
        actionType: action.actionType,
        scoreStatus,
        goalMatches: [...scenario.expectedRelevantGoals],
        hardGateFailures: hiddenInfoBlocked ? ["hidden_info"] : [],
        unresolvedGaps,
        positiveEvidence:
          scoreStatus === "score_draft_available"
            ? [`AI048 report-only evidence for ${action.semanticActionType}`]
            : [],
        negativeEvidence: [],
        riskEvidence:
          scoreStatus === "blocked_by_gate"
            ? ["Hidden-info gate blocks report-only scoring draft."]
            : [],
        missingEvidence: unresolvedGaps.map((gap) => `Missing evidence: ${gap}`),
      };
    }),
  );
}

function buildShadowRankingScenarioReport(
  scenario: ShadowScoringFixtureScenario,
  candidateDrafts: readonly ShadowActionRankingCandidateDraft[],
): ShadowActionRankingScenarioReport {
  const drafts = candidateDrafts.filter(
    (candidate) => candidate.scenarioId === scenario.scenarioId,
  );
  const orderedCandidates = [...drafts]
    .sort(
      (left, right) =>
        orderWeightForStatus(left.scoreStatus) -
        orderWeightForStatus(right.scoreStatus),
    )
    .map((candidate, index) => rankingEntry(candidate, index));

  return {
    scenarioId: scenario.scenarioId,
    side: scenario.side,
    ...(scenario.legacySelectedAction !== undefined
      ? { legacyActionRef: scenario.legacySelectedAction }
      : {}),
    orderedCandidates,
    unresolvedGapCategories: uniqueProjectionIssues(
      orderedCandidates.flatMap((candidate) => candidate.unresolvedGaps),
    ),
    hardGateFailureCategories: uniqueGateIds(
      orderedCandidates.flatMap((candidate) => candidate.hardGateFailures),
    ),
  };
}

function compareLegacyAndSemanticScenario(
  scenario: ShadowActionRankingScenarioReport,
  legacyReferences: readonly LegacyActionReference[],
): LegacySemanticComparisonEntry {
  const legacyRef = legacyReferences.find(
    (reference) => reference.scenarioId === scenario.scenarioId,
  );
  if (legacyRef === undefined) {
    return {
      scenarioId: scenario.scenarioId,
      side: scenario.side,
      category: "not_compared",
      reasons: ["No legacy reference is documented for this fixture."],
      evidence: [],
    };
  }

  const semanticRef = scenario.orderedCandidates[0];
  if (semanticRef === undefined) {
    return {
      scenarioId: scenario.scenarioId,
      side: scenario.side,
      category: "insufficient_evidence",
      legacyActionRef: legacyRef.legacyActionRef,
      reasons: ["No semantic report-only candidate exists for comparison."],
      evidence: [...legacyRef.evidence],
    };
  }

  const legacyCandidate = scenario.orderedCandidates.find(
    (candidate) => candidate.candidateId === legacyRef.legacyActionRef,
  );
  const category = comparisonCategory(legacyRef, semanticRef, legacyCandidate);

  return {
    scenarioId: scenario.scenarioId,
    side: scenario.side,
    category,
    legacyActionRef: legacyRef.legacyActionRef,
    semanticReportOnlyRef: semanticRef.candidateId,
    semanticBucket: semanticRef.bucket,
    reasons: comparisonReasons(category, semanticRef, legacyCandidate),
    evidence: [
      ...legacyRef.evidence,
      ...semanticRef.evidence,
      ...(legacyCandidate?.evidence ?? []),
    ],
  };
}

function comparisonCategory(
  legacyRef: LegacyActionReference,
  semanticRef: ShadowActionRankingEntry,
  legacyCandidate: ShadowActionRankingEntry | undefined,
): LegacySemanticComparisonCategory {
  if (semanticRef.bucket !== "score_draft_available") {
    return "insufficient_evidence";
  }
  if (legacyRef.legacyActionRef === semanticRef.candidateId) {
    return "same_reference";
  }
  if (legacyCandidate === undefined) return "not_compared";
  if (legacyCandidate.bucket === "score_draft_available") return "safe_divergence";
  return "risky_divergence";
}

function comparisonReasons(
  category: LegacySemanticComparisonCategory,
  semanticRef: ShadowActionRankingEntry,
  legacyCandidate: ShadowActionRankingEntry | undefined,
): string[] {
  if (category === "same_reference") {
    return ["Legacy and semantic report-only references point to the same candidate."];
  }
  if (category === "safe_divergence") {
    return [
      "Legacy differs from semantic report-only reference, but both candidates are score-draft-available.",
    ];
  }
  if (category === "risky_divergence") {
    return [
      `Legacy differs and is not fully evidence-ready: ${legacyCandidate?.bucket ?? "missing"}.`,
    ];
  }
  if (category === "insufficient_evidence") {
    return [
      `Semantic report-only reference is not score-draft-ready: ${semanticRef.bucket}.`,
    ];
  }
  return ["Comparison is not available for this fixture."];
}

function summarizeLegacySemanticComparison(
  entries: readonly LegacySemanticComparisonEntry[],
): LegacySemanticComparisonSummary {
  return {
    scenarioCount: entries.length,
    comparedScenarios: entries.filter((entry) => entry.category !== "not_compared")
      .length,
    sameReference: entries.filter((entry) => entry.category === "same_reference")
      .length,
    safeDivergence: entries.filter((entry) => entry.category === "safe_divergence")
      .length,
    riskyDivergence: entries.filter(
      (entry) => entry.category === "risky_divergence",
    ).length,
    insufficientEvidence: entries.filter(
      (entry) => entry.category === "insufficient_evidence",
    ).length,
    notCompared: entries.filter((entry) => entry.category === "not_compared")
      .length,
  };
}

function readinessGates(
  comparisonReport: LegacySemanticComparisonHarnessReport,
): HardGateRollbackReadinessGate[] {
  return [
    {
      gateId: "shadow_fixture_corpus",
      state: "ready_with_constraints",
      evidence: ["AI047 fixture corpus covers runner and corp scenario families."],
    },
    {
      gateId: "report_only_shadow_ordering",
      state: "ready_with_constraints",
      evidence: ["AI048 report-only ordering exists without semantic execution."],
    },
    {
      gateId: "legacy_semantic_comparison",
      state:
        comparisonReport.summary.comparedScenarios > 0
          ? "ready_with_constraints"
          : "not_evaluated",
      evidence: [
        `Compared scenarios: ${comparisonReport.summary.comparedScenarios}`,
        `Risky divergences: ${comparisonReport.summary.riskyDivergence}`,
        `Insufficient evidence: ${comparisonReport.summary.insufficientEvidence}`,
      ],
    },
    {
      gateId: "hidden_info",
      state: "ready_with_constraints",
      evidence: ["Hidden-info cases stay blocked_by_gate in AI048/AI049."],
    },
    {
      gateId: "target_context",
      state: "blocked",
      evidence: ["target_context_unavailable remains a top gap."],
      removalCondition:
        "Broader shadow fixtures must keep target-sensitive candidates blocked unless targetContext is engine-provided and side-safe.",
    },
    {
      gateId: "ability_resolution",
      state: "blocked",
      evidence: ["ability_unresolved remains a top gap."],
      removalCondition:
        "Multi-ability card scoring must stay blocked until side-safe ability binding is present.",
    },
    {
      gateId: "card_semantics",
      state: "blocked",
      evidence: ["card_semantics_unavailable remains a top gap."],
      removalCondition:
        "CardSemanticProfiles must be explicit and side-safe before strategy evidence is treated as score-draft-ready.",
    },
    {
      gateId: "runtime_feature_flag",
      state: "blocked",
      evidence: ["No runtime selector or rollback flag is implemented in AI047-AI050."],
      removalCondition:
        "A later cutover slice needs feature flags default-off and explicit rollback behavior.",
    },
  ];
}

function proposedSemanticFeatureFlags(): ProposedSemanticFeatureFlag[] {
  return [
    featureFlag(
      "semanticAi.shadowReport",
      "write diagnostic shadow reports while legacy continues executing",
    ),
    featureFlag(
      "semanticAi.shadowRanking",
      "enable report-only semantic ordering in simulation reports",
    ),
    featureFlag(
      "semanticAi.compareLegacy",
      "compare legacy and semantic report-only references",
    ),
    featureFlag(
      "semanticAi.cutover.basicActions",
      "future default-off productive basic-action cutover candidate",
    ),
  ];
}

function featureFlag(
  flagId: string,
  intendedScope: string,
): ProposedSemanticFeatureFlag {
  return {
    flagId,
    intendedScope,
    defaultState: "off",
    rollbackRule: `Disable ${flagId} and fall back to legacy execution.`,
  };
}

function rollbackRules(): string[] {
  return [
    "Legacy decision remains the only executed action during shadow mode.",
    "Any hidden-info violation blocks semantic output and requires fixture review.",
    "Any illegal semantic reference blocks cutover and requires LegalAction trace review.",
    "Any unresolved required gate keeps the candidate in blocked_by_gap or blocked_by_gate.",
    "All future productive flags must default to off and be reversible without migration.",
  ];
}

function rankingEntry(
  candidate: ShadowActionRankingCandidateDraft,
  reportOnlyOrderIndex: number,
): ShadowActionRankingEntry {
  return {
    scenarioId: candidate.scenarioId,
    candidateId: candidate.candidateId,
    actionType: candidate.actionType,
    reportOnlyOrderIndex,
    bucket: bucketForScoreStatus(candidate.scoreStatus),
    scoreStatus: candidate.scoreStatus,
    goalMatches: [...candidate.goalMatches],
    hardGateFailures: [...candidate.hardGateFailures],
    unresolvedGaps: [...candidate.unresolvedGaps],
    reasons: reasonsForRankingCandidate(candidate),
    evidence: [
      ...candidate.positiveEvidence,
      ...candidate.negativeEvidence,
      ...candidate.riskEvidence,
      ...candidate.missingEvidence,
    ],
  };
}

function reasonsForRankingCandidate(
  candidate: ShadowActionRankingCandidateDraft,
): string[] {
  if (candidate.scoreStatus === "blocked_by_gate") {
    return candidate.hardGateFailures.map(
      (gateId) => `Hard gate blocks report-only score draft: ${gateId}`,
    );
  }
  if (candidate.scoreStatus === "blocked_by_gap") {
    return candidate.unresolvedGaps.map(
      (gap) => `Gap blocks report-only score draft: ${gap}`,
    );
  }
  if (candidate.scoreStatus === "not_scored") {
    return ["Candidate was not scored in this fixture design."];
  }
  return ["Candidate is eligible for report-only shadow ordering."];
}

function summarizeShadowActionRanking(
  scenarioReports: readonly ShadowActionRankingScenarioReport[],
): ShadowActionRankingSummary {
  const candidates = scenarioReports.flatMap(
    (scenario) => scenario.orderedCandidates,
  );

  return {
    scenarioCount: scenarioReports.length,
    candidateCount: candidates.length,
    scoreDraftAvailable: candidates.filter(
      (candidate) => candidate.scoreStatus === "score_draft_available",
    ).length,
    blockedByGap: candidates.filter(
      (candidate) => candidate.scoreStatus === "blocked_by_gap",
    ).length,
    blockedByGate: candidates.filter(
      (candidate) => candidate.scoreStatus === "blocked_by_gate",
    ).length,
    notScored: candidates.filter((candidate) => candidate.scoreStatus === "not_scored")
      .length,
  };
}

function orderWeightForStatus(status: ShadowScoreDraftStatus): number {
  if (status === "score_draft_available") return 0;
  if (status === "blocked_by_gap") return 1;
  if (status === "blocked_by_gate") return 2;
  return 3;
}

function bucketForScoreStatus(
  status: ShadowScoreDraftStatus,
): ShadowActionOrderingBucket {
  if (status === "score_draft_available") return "score_draft_available";
  if (status === "blocked_by_gap") return "blocked_by_gap";
  if (status === "blocked_by_gate") return "blocked_by_gate";
  return "not_scored";
}

function summarizeFixtureDesign(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[],
): ShadowScoringFixtureDesignSummary {
  return {
    fixtureCount: fixtureCorpus.length,
    runnerFixtureCount: fixtureCorpus.filter(
      (scenario) => scenario.side === "runner",
    ).length,
    corpFixtureCount: fixtureCorpus.filter((scenario) => scenario.side === "corp")
      .length,
    semanticShadowAllowedCount: fixtureCorpus.filter(
      (scenario) => scenario.semanticShadowAllowed,
    ).length,
    knownGapCategories: uniqueProjectionIssues(
      fixtureCorpus.flatMap((scenario) => scenario.knownGaps),
    ),
  };
}

function uniqueProjectionIssues(
  values: readonly ActionProjectionIssue[],
): ActionProjectionIssue[] {
  return [...new Set(values)];
}

function uniqueGateIds(values: readonly ActionGateId[]): ActionGateId[] {
  return [...new Set(values)];
}
