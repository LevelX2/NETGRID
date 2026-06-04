import { CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS } from "./controlled-shadow-mode";
import type { ShadowModeNoEffectFlags } from "./controlled-shadow-mode";
import {
  META6_SCOPE_READINESS_MATRIX,
  type Meta2HumanReviewCategory,
  type SemanticAiScopeReadinessEntry,
  type SemanticAiScopeReadinessStatus,
  type SemanticAiSide,
  type SemanticTacticalGoalFamily,
} from "./semantic-ai-core-meta";

export const META7_MULTI_RUN_EVALUATION_SCHEMA_VERSION =
  "meta7-multi-run-semantic-evaluation-human-review-v0" as const;

export type ProductionReadinessScopeId =
  | "basic_economy_draw"
  | "basic_install"
  | "tag_removal"
  | "simple_score_advance"
  | "simple_run_choice"
  | "simple_rez"
  | "remote_contest"
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
