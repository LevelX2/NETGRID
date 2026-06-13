import type { LegalAction, Side } from "@netgrid/shared";
import {
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  pilotScopeAllowsAction,
  type AiPlayStrengthPilotScope,
  type PilotScopeDecision,
} from "../decision/pilot-scope-registry";
import {
  evaluateRemoteContestCandidate,
  type RemoteContestCandidateEvaluation,
} from "../decision/pilot/remote-contest-candidate";
import type { SemanticRankedAction } from "../decision/semantic-decision-trace";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import { classifyDecisionTraceMistakes } from "./decision-snapshot-suite";
import type { ShadowLeagueFollowupCandidate } from "./decision-snapshot";
import type { AiMistakeClass } from "./mistake-taxonomy";
import type { RealEngineDecisionCorpusSample } from "./real-engine-decision-corpus";

export const SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION =
  "semantic-shadow-league-v1" as const;

const AI_MISTAKE_CLASSES = [
  "illegal_action",
  "hidden_info_dependency",
  "economy_starvation",
  "unsafe_run",
  "missed_safe_access",
  "ignored_remote_threat",
  "missed_score_window",
  "bad_rez_spend",
  "bad_install_redundancy",
  "ignored_damage_risk",
  "plan_step_mismatch",
  "target_choice_unavailable",
] as const satisfies readonly AiMistakeClass[];

export type SemanticShadowLeagueExpectation = {
  scenarioId: string;
  expectedTopActionTypes?: readonly string[];
  expectedTopActionIds?: readonly string[];
  pilotEligibleScopes?: readonly AiPlayStrengthPilotScope[];
  forbiddenMistakes?: readonly AiMistakeClass[];
  notes?: readonly string[];
  evidence?: readonly string[];
};

export type SemanticShadowLeagueScenarioReport = {
  scenarioId: string;
  side: Side;
  legalActionCount: number;
  candidateCount: number;
  rankedActionCount: number;
  rejectedActionCount: number;
  topActionId?: string;
  topActionType?: string;
  topSemanticActionType?: string;
  topScore?: number;
  topGoalId?: string;
  expectedTopActionTypes?: string[];
  expectedTopActionIds?: string[];
  expectedPilotEligibleScopes?: AiPlayStrengthPilotScope[];
  forbiddenMistakes?: AiMistakeClass[];
  forbiddenMistakeViolations?: AiMistakeClass[];
  expectationNotes?: string[];
  agreementCompared: boolean;
  agreement?: boolean;
  observedMistakes: AiMistakeClass[];
  blockers: Record<string, number>;
  pilotEligibility: SemanticShadowLeaguePilotEligibility;
  remoteContestPilotCandidate?: SemanticShadowLeagueRemoteContestPilotCandidate;
  evidence: string[];
};

export type SemanticShadowLeaguePilotEligibility = {
  eligible: boolean;
  scopeCandidateCount: number;
  scopeAllowedCount: number;
  wouldOverride: boolean;
  actualOverride: false;
  scopes: AiPlayStrengthPilotScope[];
  scoreGap: number | null;
  blockedByReason: Record<string, number>;
  reportOnly: true;
  productiveUseAllowed: false;
  evidence: string[];
};

export type SemanticShadowLeagueRemoteContestPilotCandidate =
  RemoteContestCandidateEvaluation;

export type SemanticShadowLeagueReport = {
  schemaVersion: typeof SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION;
  scope: "semantic_shadow_league_report_only";
  scenarioCount: number;
  sideCounts: Record<Side, number>;
  metrics: {
    agreementComparedCount: number;
    agreementCount: number;
    agreementRate: number | null;
    mistakeCount: number;
    mistakesByClass: Record<AiMistakeClass, number>;
    pilotEligibleCount: number;
    scopeCandidateCount: number;
    scopeAllowedCount: number;
    pilotWouldOverrideCount: number;
    pilotActualOverrideCount: number;
    blockedByReason: Record<string, number>;
    averageScoreGap: number | null;
    pilotEligibilityRate: number | null;
    pilotEligibilityBySide: Record<Side, SemanticShadowLeaguePilotEligibilityBySide>;
    scopeBreakdown: Record<AiPlayStrengthPilotScope, SemanticShadowLeaguePilotScopeBreakdown>;
    remoteContestPilotCandidateCount: number;
    remoteContestPilotCandidateScenarioIds: string[];
    rankedActionCount: number;
    rejectedActionCount: number;
    topScoreAverage: number | null;
    topScoreMin: number | null;
    topScoreMax: number | null;
    blockersByKind: Record<string, number>;
    pilotCutoverReadiness: SemanticShadowLeaguePilotCutoverReadinessMatrix;
  };
  topDisagreementReasons: string[];
  followupCandidates: ShadowLeagueFollowupCandidate[];
  redactionStatus: "passed";
  scenarios: SemanticShadowLeagueScenarioReport[];
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type SemanticShadowLeaguePilotEligibilityBySide = {
  scenarioCount: number;
  eligibleCount: number;
  wouldOverrideCount: number;
  eligibleRate: number | null;
};

export type SemanticShadowLeaguePilotScopeBreakdown = {
  eligibleCount: number;
  wouldOverrideCount: number;
  scenarioIds: string[];
};

export type SemanticShadowLeagueReadinessScope =
  | AiPlayStrengthPilotScope
  | "remote_contest_report_only"
  | "target_choice_shadow_only";

export type SemanticShadowLeaguePilotCutoverReadiness = {
  scope: SemanticShadowLeagueReadinessScope;
  candidate: number;
  allowed: number;
  wouldOverride: number;
  actualOverride: number;
  safeToEnableLocally: boolean;
  recommendedForDefaultOffPilot: boolean;
  blockedByInsufficientCorpus: boolean;
  blockedByTargetChoice: boolean;
  blockedByDoctrineConflict: boolean;
  blockedByRisk: boolean;
  recommendation: "report_only" | "keep_env_gated" | "default_off_candidate";
  evidence: string[];
};

export type SemanticShadowLeaguePilotCutoverReadinessMatrix = {
  scopes: Record<
    SemanticShadowLeagueReadinessScope,
    SemanticShadowLeaguePilotCutoverReadiness
  >;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type SemanticShadowLeagueLocalDefaultDryRunScope =
  AiPlayStrengthPilotScope;

export type SemanticShadowLeagueLocalDefaultDryRunReport = {
  scope: SemanticShadowLeagueLocalDefaultDryRunScope;
  scenarioCount: number;
  eligible: number;
  wouldOverride: number;
  badOverrideRisk: number;
  blockedReasons: Record<string, number>;
  knownNoGoCases: string[];
  recommendation:
    | "local_default_dry_run_candidate"
    | "keep_env_gated"
    | "do_not_default";
  centralOnlyCases?: number;
  riskBlockedCases?: number;
  evidenceOnlyBlockedCases?: number;
  structuredAlignmentCases?: number;
  falsePositiveCandidates?: number;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildSemanticShadowLeagueReport(
  samples: readonly RealEngineDecisionCorpusSample[],
  expectations?: readonly SemanticShadowLeagueExpectation[],
): SemanticShadowLeagueReport {
  const effectiveExpectations =
    expectations ?? playStrengthShadowLeagueExpectationsFromSamples(samples);
  const expectationByScenarioId = new Map(
    effectiveExpectations.map((expectation) => [
      expectation.scenarioId,
      expectation,
    ]),
  );
  const scenarios = samples.map((sample) =>
    buildScenarioReport(sample, expectationByScenarioId.get(sample.scenarioId)),
  );
  const report: SemanticShadowLeagueReport = {
    schemaVersion: SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION,
    scope: "semantic_shadow_league_report_only",
    scenarioCount: samples.length,
    sideCounts: {
      runner: scenarios.filter((scenario) => scenario.side === "runner").length,
      corp: scenarios.filter((scenario) => scenario.side === "corp").length,
    },
    metrics: buildLeagueMetrics(scenarios),
    topDisagreementReasons: topDisagreementReasons(scenarios),
    followupCandidates: buildFollowupCandidates(scenarios),
    redactionStatus: "passed",
    scenarios,
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "semantic_shadow_league:report_only",
      `scenario_count:${samples.length}`,
      "runtime_consumer:none",
    ],
  };
  assertLeagueReportSideSafe(report);
  return report;
}

export function playStrengthShadowLeagueExpectationsFromSamples(
  samples: readonly RealEngineDecisionCorpusSample[],
): SemanticShadowLeagueExpectation[] {
  return samples.flatMap((sample) =>
    sample.leagueExpectation
      ? [
          {
            scenarioId: sample.scenarioId,
            ...sample.leagueExpectation,
          },
        ]
      : [],
  );
}

export function buildLocalDefaultPilotDryRunReport(
  report: SemanticShadowLeagueReport,
  scope: SemanticShadowLeagueLocalDefaultDryRunScope,
): SemanticShadowLeagueLocalDefaultDryRunReport {
  const scopedScenarios = report.scenarios.filter((scenario) =>
    scenario.pilotEligibility.scopes.includes(scope),
  );
  const wouldOverrideScenarios = scopedScenarios.filter(
    (scenario) => scenario.pilotEligibility.wouldOverride,
  );
  const blockedReasons = countStrings(
    report.scenarios.flatMap((scenario) =>
      Object.entries(scenario.pilotEligibility.blockedByReason).flatMap(
        ([reason, count]) =>
          reason.startsWith(scope)
            ? Array.from({ length: count }, () => reason)
            : [],
      ),
    ),
  );
  const riskMistakes: readonly AiMistakeClass[] = [
    "unsafe_run",
    "ignored_damage_risk",
    "ignored_remote_threat",
    "missed_score_window",
    "target_choice_unavailable",
  ];
  const badOverrideRiskScenarios = wouldOverrideScenarios.filter((scenario) =>
    scenario.observedMistakes.some((mistake) => riskMistakes.includes(mistake)),
  );
  const readiness = report.metrics.pilotCutoverReadiness.scopes[scope];
  const recommendation =
    scope === CORP_SCORE_WINDOW_PILOT_MODE
      ? "keep_env_gated"
      : badOverrideRiskScenarios.length === 0 &&
          readiness.recommendation === "default_off_candidate"
        ? "local_default_dry_run_candidate"
        : "do_not_default";
  const base: SemanticShadowLeagueLocalDefaultDryRunReport = {
    scope,
    scenarioCount: report.scenarioCount,
    eligible: scopedScenarios.length,
    wouldOverride: wouldOverrideScenarios.length,
    badOverrideRisk: badOverrideRiskScenarios.length,
    blockedReasons,
    knownNoGoCases: badOverrideRiskScenarios
      .map((scenario) => scenario.scenarioId)
      .sort(),
    recommendation,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      `local_default_dry_run_scope:${scope}`,
      `scenario_count:${report.scenarioCount}`,
      `eligible:${scopedScenarios.length}`,
      `would_override:${wouldOverrideScenarios.length}`,
      `bad_override_risk:${badOverrideRiskScenarios.length}`,
      `recommendation:${recommendation}`,
      "productive_use_allowed:false",
      "runtime_consumer:none",
    ],
  };
  if (scope !== RUNNER_SAFE_ACCESS_PILOT_MODE) return base;
  const runnerScenarios = report.scenarios.filter(
    (scenario) => scenario.side === "runner",
  );
  const centralOnlyCases = scopedScenarios.filter(
    (scenario) =>
      scenario.topActionType === "start_run" &&
      !String(scenario.topActionId ?? "").includes("remote"),
  ).length;
  const riskBlockedCases = runnerScenarios.filter((scenario) =>
    Object.keys(scenario.pilotEligibility.blockedByReason).some((reason) =>
      reason.includes("risk"),
    ),
  ).length;
  const evidenceOnlyBlockedCases = runnerScenarios.filter((scenario) =>
    Object.keys(scenario.pilotEligibility.blockedByReason).some((reason) =>
      reason.includes("structured_alignment_required"),
    ),
  ).length;
  const structuredAlignmentCases = scopedScenarios.length;
  return {
    ...base,
    centralOnlyCases,
    riskBlockedCases,
    evidenceOnlyBlockedCases,
    structuredAlignmentCases,
    falsePositiveCandidates: badOverrideRiskScenarios.length,
    evidence: [
      ...base.evidence,
      `central_only_cases:${centralOnlyCases}`,
      `risk_blocked_cases:${riskBlockedCases}`,
      `evidence_only_blocked_cases:${evidenceOnlyBlockedCases}`,
      `structured_alignment_cases:${structuredAlignmentCases}`,
      `false_positive_candidates:${badOverrideRiskScenarios.length}`,
    ],
  };
}

function buildScenarioReport(
  sample: RealEngineDecisionCorpusSample,
  expectation: SemanticShadowLeagueExpectation | undefined,
): SemanticShadowLeagueScenarioReport {
  const top = sample.trace.rankedActions[0];
  const topCandidate = top
    ? sample.frame.actionCandidates.find((candidate) => candidate.actionId === top.actionId)
    : undefined;
  const expectedTopActionTypes = sanitizeList(expectation?.expectedTopActionTypes);
  const expectedTopActionIds = sanitizeList(expectation?.expectedTopActionIds);
  const expectedPilotEligibleScopes = sanitizePilotScopes(
    expectation?.pilotEligibleScopes,
  );
  const forbiddenMistakes = uniqueMistakeClasses(
    expectation?.forbiddenMistakes ?? [],
  );
  const agreementCompared =
    expectedTopActionTypes.length > 0 || expectedTopActionIds.length > 0;
  const agreement = agreementCompared
    ? topAgreesWithExpectation(top, topCandidate?.actionType, {
        expectedTopActionTypes,
        expectedTopActionIds,
      })
    : undefined;
  const mistakes = classifyDecisionTraceMistakes(sample.frame, sample.trace);
  const forbiddenMistakeViolations = uniqueMistakeClasses(
    mistakes
      .map((mistake) => mistake.mistakeClass)
      .filter((mistake) => forbiddenMistakes.includes(mistake)),
  );
  const pilotEligibility = buildPilotEligibility(
    pilotScopeDecisions(sample, top, topCandidate?.actionType),
    scoreGapForTop(sample.trace.rankedActions),
  );
  const expectationNotes = sanitizeList(expectation?.notes);
  const remoteContestPilotCandidate = remoteContestPilotCandidateFor(
    sample,
    top,
    topCandidate?.actionType,
    pilotEligibility.scoreGap,
  );
  const report: SemanticShadowLeagueScenarioReport = {
    scenarioId: safe(sample.scenarioId),
    side: sample.side,
    legalActionCount: sample.legalActionCount,
    candidateCount: sample.candidateCount,
    rankedActionCount: sample.trace.rankedActions.length,
    rejectedActionCount: sample.trace.rejectedActions.length,
    ...(top ? { topActionId: safe(top.actionId), topScore: top.score } : {}),
    ...(topCandidate?.actionType ? { topActionType: safe(topCandidate.actionType) } : {}),
    ...(topCandidate?.semanticActionType
      ? { topSemanticActionType: safe(topCandidate.semanticActionType) }
      : {}),
    ...(top?.primaryGoalId ? { topGoalId: safe(top.primaryGoalId) } : {}),
    ...(expectedTopActionTypes.length > 0 ? { expectedTopActionTypes } : {}),
    ...(expectedTopActionIds.length > 0 ? { expectedTopActionIds } : {}),
    ...(expectedPilotEligibleScopes.length > 0
      ? { expectedPilotEligibleScopes }
      : {}),
    ...(forbiddenMistakes.length > 0 ? { forbiddenMistakes } : {}),
    ...(forbiddenMistakeViolations.length > 0
      ? { forbiddenMistakeViolations }
      : {}),
    ...(expectationNotes.length > 0 ? { expectationNotes } : {}),
    agreementCompared,
    ...(agreementCompared ? { agreement: agreement === true } : {}),
    observedMistakes: uniqueMistakeClasses(
      mistakes.map((mistake) => mistake.mistakeClass),
    ),
    blockers: countStrings(
      sample.trace.rejectedActions.flatMap((action) => action.blockers),
    ),
    pilotEligibility,
    ...(remoteContestPilotCandidate ? { remoteContestPilotCandidate } : {}),
    evidence: [
      `scenario:${safe(sample.scenarioId)}`,
      `side:${sample.side}`,
      `ranked_action_count:${sample.trace.rankedActions.length}`,
      `rejected_action_count:${sample.trace.rejectedActions.length}`,
      `agreement_compared:${agreementCompared}`,
      ...(agreementCompared ? [`agreement:${Boolean(agreement)}`] : []),
      ...(expectation
        ? [
            "expectation_source:real_engine_corpus_metadata",
            `forbidden_mistake_violation_count:${forbiddenMistakeViolations.length}`,
          ]
        : []),
      ...pilotEligibility.evidence,
      ...(remoteContestPilotCandidate
        ? ["remote_contest_pilot_candidate:report_only"]
        : []),
      ...(expectation?.evidence ?? []).map(safe),
    ],
  };
  return report;
}

function buildLeagueMetrics(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): SemanticShadowLeagueReport["metrics"] {
  const compared = scenarios.filter((scenario) => scenario.agreementCompared);
  const agreementCount = compared.filter((scenario) => scenario.agreement).length;
  const pilotEligibleCount = scenarios.filter(
    (scenario) => scenario.pilotEligibility.eligible,
  ).length;
  const scopeCandidateCount = scenarios.reduce(
    (sum, scenario) => sum + scenario.pilotEligibility.scopeCandidateCount,
    0,
  );
  const scopeAllowedCount = scenarios.reduce(
    (sum, scenario) => sum + scenario.pilotEligibility.scopeAllowedCount,
    0,
  );
  const pilotWouldOverrideCount = scenarios.filter(
    (scenario) => scenario.pilotEligibility.wouldOverride,
  ).length;
  const pilotActualOverrideCount = scenarios.filter(
    (scenario) => scenario.pilotEligibility.actualOverride,
  ).length;
  const topScores = scenarios
    .map((scenario) => scenario.topScore)
    .filter((score): score is number => score !== undefined);
  const scoreGaps = scenarios
    .map((scenario) => scenario.pilotEligibility.scoreGap)
    .filter((scoreGap): scoreGap is number => scoreGap !== null);
  return {
    agreementComparedCount: compared.length,
    agreementCount,
    agreementRate:
      compared.length > 0 ? roundMetric(agreementCount / compared.length) : null,
    mistakeCount: scenarios.reduce(
      (sum, scenario) => sum + scenario.observedMistakes.length,
      0,
    ),
    mistakesByClass: countMistakes(
      scenarios.flatMap((scenario) => scenario.observedMistakes),
    ),
    pilotEligibleCount,
    scopeCandidateCount,
    scopeAllowedCount,
    pilotWouldOverrideCount,
    pilotActualOverrideCount,
    blockedByReason: countStrings(
      scenarios.flatMap((scenario) =>
        Object.entries(scenario.pilotEligibility.blockedByReason).flatMap(
          ([reason, count]) => Array.from({ length: count }, () => reason),
        ),
      ),
    ),
    averageScoreGap:
      scoreGaps.length > 0
        ? roundMetric(scoreGaps.reduce((sum, scoreGap) => sum + scoreGap, 0) / scoreGaps.length)
        : null,
    pilotEligibilityRate:
      scenarios.length > 0 ? roundMetric(pilotEligibleCount / scenarios.length) : null,
    pilotEligibilityBySide: pilotEligibilityBySide(scenarios),
    scopeBreakdown: pilotScopeBreakdown(scenarios),
    remoteContestPilotCandidateCount: scenarios.filter(
      (scenario) => scenario.remoteContestPilotCandidate !== undefined,
    ).length,
    remoteContestPilotCandidateScenarioIds: scenarios
      .filter((scenario) => scenario.remoteContestPilotCandidate !== undefined)
      .map((scenario) => scenario.scenarioId)
      .sort(),
    rankedActionCount: scenarios.reduce(
      (sum, scenario) => sum + scenario.rankedActionCount,
      0,
    ),
    rejectedActionCount: scenarios.reduce(
      (sum, scenario) => sum + scenario.rejectedActionCount,
      0,
    ),
    topScoreAverage:
      topScores.length > 0
        ? roundMetric(topScores.reduce((sum, score) => sum + score, 0) / topScores.length)
        : null,
    topScoreMin: topScores.length > 0 ? Math.min(...topScores) : null,
    topScoreMax: topScores.length > 0 ? Math.max(...topScores) : null,
    blockersByKind: countStrings(
      scenarios.flatMap((scenario) =>
        Object.entries(scenario.blockers).flatMap(([blocker, count]) =>
          Array.from({ length: count }, () => blocker),
        ),
      ),
    ),
    pilotCutoverReadiness: pilotCutoverReadinessMatrix(scenarios),
  };
}

function pilotCutoverReadinessMatrix(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): SemanticShadowLeaguePilotCutoverReadinessMatrix {
  const breakdown = pilotScopeBreakdown(scenarios);
  const targetChoiceGapCount = scenarios.filter((scenario) =>
    scenario.observedMistakes.includes("target_choice_unavailable"),
  ).length;
  const doctrineConflictCount = scenarios.filter((scenario) =>
    scenario.observedMistakes.includes("plan_step_mismatch"),
  ).length;
  const riskCount = scenarios.filter((scenario) =>
    scenario.observedMistakes.some(
      (mistake) =>
        mistake === "unsafe_run" ||
        mistake === "ignored_damage_risk" ||
        mistake === "ignored_remote_threat",
    ),
  ).length;
  const remoteContestCandidateCount = scenarios.filter(
    (scenario) => scenario.remoteContestPilotCandidate !== undefined,
  ).length;
  return {
    scopes: {
      [BASIC_SETUP_PILOT_MODE]: readinessForPilotScope({
        scope: BASIC_SETUP_PILOT_MODE,
        candidate: scenarios.length,
        breakdown: breakdown[BASIC_SETUP_PILOT_MODE],
        blockedByTargetChoice: false,
        blockedByDoctrineConflict: doctrineConflictCount > 0,
        blockedByRisk: false,
      }),
      [RUNNER_SAFE_ACCESS_PILOT_MODE]: readinessForPilotScope({
        scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
        candidate: scenarios.length,
        breakdown: breakdown[RUNNER_SAFE_ACCESS_PILOT_MODE],
        blockedByTargetChoice: false,
        blockedByDoctrineConflict: false,
        blockedByRisk: riskCount > 0,
      }),
      [CORP_SCORE_WINDOW_PILOT_MODE]: readinessForPilotScope({
        scope: CORP_SCORE_WINDOW_PILOT_MODE,
        candidate: scenarios.length,
        breakdown: breakdown[CORP_SCORE_WINDOW_PILOT_MODE],
        blockedByTargetChoice: false,
        blockedByDoctrineConflict: doctrineConflictCount > 0,
        blockedByRisk: false,
      }),
      remote_contest_report_only: readinessForShadowOnlyScope({
        scope: "remote_contest_report_only",
        candidate: remoteContestCandidateCount,
        allowed: remoteContestCandidateCount,
        blockedByTargetChoice: true,
        blockedByDoctrineConflict: false,
        blockedByRisk: riskCount > 0,
      }),
      target_choice_shadow_only: readinessForShadowOnlyScope({
        scope: "target_choice_shadow_only",
        candidate: targetChoiceGapCount,
        allowed: 0,
        blockedByTargetChoice: true,
        blockedByDoctrineConflict: false,
        blockedByRisk: false,
      }),
    },
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "pilot_cutover_readiness:report_only",
      "runtime_consumer:none",
      "productive_use_allowed:false",
    ],
  };
}

function readinessForPilotScope(params: {
  scope: AiPlayStrengthPilotScope;
  candidate: number;
  breakdown: SemanticShadowLeaguePilotScopeBreakdown;
  blockedByTargetChoice: boolean;
  blockedByDoctrineConflict: boolean;
  blockedByRisk: boolean;
}): SemanticShadowLeaguePilotCutoverReadiness {
  const blockedByInsufficientCorpus = params.breakdown.eligibleCount < 5;
  const safeToEnableLocally =
    params.breakdown.eligibleCount > 0 &&
    !blockedByInsufficientCorpus &&
    !params.blockedByTargetChoice &&
    !params.blockedByDoctrineConflict &&
    !params.blockedByRisk;
  const recommendedForDefaultOffPilot =
    safeToEnableLocally && params.breakdown.wouldOverrideCount > 0;
  return {
    scope: params.scope,
    candidate: params.candidate,
    allowed: params.breakdown.eligibleCount,
    wouldOverride: params.breakdown.wouldOverrideCount,
    actualOverride: 0,
    safeToEnableLocally,
    recommendedForDefaultOffPilot,
    blockedByInsufficientCorpus,
    blockedByTargetChoice: params.blockedByTargetChoice,
    blockedByDoctrineConflict: params.blockedByDoctrineConflict,
    blockedByRisk: params.blockedByRisk,
    recommendation: recommendedForDefaultOffPilot
      ? "default_off_candidate"
      : "keep_env_gated",
    evidence: [
      `pilot_readiness_scope:${params.scope}`,
      `candidate:${params.candidate}`,
      `allowed:${params.breakdown.eligibleCount}`,
      `would_override:${params.breakdown.wouldOverrideCount}`,
      "actual_override:0",
      `safe_to_enable_locally:${safeToEnableLocally}`,
      `recommended_for_default_off_pilot:${recommendedForDefaultOffPilot}`,
      `blocked_by_insufficient_corpus:${blockedByInsufficientCorpus}`,
      `blocked_by_target_choice:${params.blockedByTargetChoice}`,
      `blocked_by_doctrine_conflict:${params.blockedByDoctrineConflict}`,
      `blocked_by_risk:${params.blockedByRisk}`,
    ],
  };
}

function readinessForShadowOnlyScope(params: {
  scope: "remote_contest_report_only" | "target_choice_shadow_only";
  candidate: number;
  allowed: number;
  blockedByTargetChoice: boolean;
  blockedByDoctrineConflict: boolean;
  blockedByRisk: boolean;
}): SemanticShadowLeaguePilotCutoverReadiness {
  return {
    scope: params.scope,
    candidate: params.candidate,
    allowed: params.allowed,
    wouldOverride: 0,
    actualOverride: 0,
    safeToEnableLocally: false,
    recommendedForDefaultOffPilot: false,
    blockedByInsufficientCorpus: params.candidate < 5,
    blockedByTargetChoice: params.blockedByTargetChoice,
    blockedByDoctrineConflict: params.blockedByDoctrineConflict,
    blockedByRisk: params.blockedByRisk,
    recommendation: "report_only",
    evidence: [
      `pilot_readiness_scope:${params.scope}`,
      `candidate:${params.candidate}`,
      `allowed:${params.allowed}`,
      "would_override:0",
      "actual_override:0",
      "safe_to_enable_locally:false",
      "recommended_for_default_off_pilot:false",
      `blocked_by_insufficient_corpus:${params.candidate < 5}`,
      `blocked_by_target_choice:${params.blockedByTargetChoice}`,
      `blocked_by_doctrine_conflict:${params.blockedByDoctrineConflict}`,
      `blocked_by_risk:${params.blockedByRisk}`,
    ],
  };
}

function remoteContestPilotCandidateFor(
  sample: RealEngineDecisionCorpusSample,
  top: SemanticRankedAction | undefined,
  topActionType: string | undefined,
  scoreGap: number | null,
): SemanticShadowLeagueRemoteContestPilotCandidate | undefined {
  const result = evaluateRemoteContestCandidate({
    frame: sample.frame,
    top,
    topActionType,
    scoreGap,
  });
  if (!result) return undefined;
  return {
    ...result,
    actionId: safe(result.actionId),
    ...(result.targetServerId
      ? { targetServerId: safe(result.targetServerId) }
      : {}),
    ...(result.targetKind ? { targetKind: safe(result.targetKind) } : {}),
    ...(result.recommendation
      ? { recommendation: safe(result.recommendation) }
      : {}),
    ...(result.pathPassability
      ? { pathPassability: safe(result.pathPassability) }
      : {}),
    ...(result.blockedReason ? { blockedReason: safe(result.blockedReason) } : {}),
    evidence: result.evidence.map(safe),
  };
}

function buildPilotEligibility(
  decisions: readonly PilotScopeDecision[],
  scoreGap: number | null,
): SemanticShadowLeaguePilotEligibility {
  const allowedDecisions = decisions.filter((decision) => decision.allowed);
  const scopes = allowedDecisions.map((decision) => decision.scope);
  const eligible = scopes.length > 0;
  const wouldOverride = eligible && scoreGap !== null && scoreGap > 0;
  const blockedByReason = countStrings(
    decisions
      .filter((decision) => !decision.allowed)
      .map((decision) => decision.reason),
  );
  return {
    eligible,
    scopeCandidateCount: decisions.length,
    scopeAllowedCount: scopes.length,
    wouldOverride,
    actualOverride: false,
    scopes: [...scopes].sort(),
    scoreGap,
    blockedByReason,
    reportOnly: true,
    productiveUseAllowed: false,
    evidence: [
      `pilot_scope_eligible:${eligible}`,
      `pilot_scope_candidate_count:${decisions.length}`,
      `pilot_scope_allowed_count:${scopes.length}`,
      `pilot_would_override:${wouldOverride}`,
      "pilot_actual_override:false",
      `score_gap:${scoreGap ?? "none"}`,
      "pilot_eligibility:report_only",
      "productive_use_allowed:false",
      ...scopes.map((scope) => `pilot_scope:${scope}:eligible`),
      ...Object.entries(blockedByReason).map(
        ([reason, count]) => `pilot_scope_blocked:${reason}:${count}`,
      ),
    ],
  };
}

function pilotScopeBreakdown(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): Record<AiPlayStrengthPilotScope, SemanticShadowLeaguePilotScopeBreakdown> {
  const result: Record<
    AiPlayStrengthPilotScope,
    SemanticShadowLeaguePilotScopeBreakdown
  > = {
    [BASIC_SETUP_PILOT_MODE]: emptyPilotScopeBreakdown(),
    [RUNNER_SAFE_ACCESS_PILOT_MODE]: emptyPilotScopeBreakdown(),
    [CORP_SCORE_WINDOW_PILOT_MODE]: emptyPilotScopeBreakdown(),
  };

  for (const scenario of scenarios) {
    for (const scope of scenario.pilotEligibility.scopes) {
      result[scope].eligibleCount += 1;
      if (scenario.pilotEligibility.wouldOverride) {
        result[scope].wouldOverrideCount += 1;
      }
      result[scope].scenarioIds.push(scenario.scenarioId);
    }
  }

  return result;
}

function emptyPilotScopeBreakdown(): SemanticShadowLeaguePilotScopeBreakdown {
  return {
    eligibleCount: 0,
    wouldOverrideCount: 0,
    scenarioIds: [],
  };
}

function pilotEligibilityBySide(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): Record<Side, SemanticShadowLeaguePilotEligibilityBySide> {
  return {
    runner: pilotEligibilityForSide(scenarios, "runner"),
    corp: pilotEligibilityForSide(scenarios, "corp"),
  };
}

function pilotEligibilityForSide(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
  side: Side,
): SemanticShadowLeaguePilotEligibilityBySide {
  const sideScenarios = scenarios.filter((scenario) => scenario.side === side);
  const eligibleCount = sideScenarios.filter(
    (scenario) => scenario.pilotEligibility.eligible,
  ).length;
  const wouldOverrideCount = sideScenarios.filter(
    (scenario) => scenario.pilotEligibility.wouldOverride,
  ).length;
  return {
    scenarioCount: sideScenarios.length,
    eligibleCount,
    wouldOverrideCount,
    eligibleRate:
      sideScenarios.length > 0
        ? roundMetric(eligibleCount / sideScenarios.length)
        : null,
  };
}

function topAgreesWithExpectation(
  top: SemanticRankedAction | undefined,
  topActionType: string | undefined,
  expectation: {
    expectedTopActionTypes: readonly string[];
    expectedTopActionIds: readonly string[];
  },
): boolean {
  if (!top) return false;
  return (
    expectation.expectedTopActionIds.includes(top.actionId) ||
    (topActionType !== undefined &&
      expectation.expectedTopActionTypes.includes(topActionType))
  );
}

function pilotScopeDecisions(
  sample: RealEngineDecisionCorpusSample,
  top: SemanticRankedAction | undefined,
  topActionType: string | undefined,
): PilotScopeDecision[] {
  if (!top || !topActionType) return [];
  const action = syntheticLegalActionForTop(sample, top, topActionType);
  const scopes: readonly AiPlayStrengthPilotScope[] = [
    BASIC_SETUP_PILOT_MODE,
    RUNNER_SAFE_ACCESS_PILOT_MODE,
    CORP_SCORE_WINDOW_PILOT_MODE,
  ];
  return scopes.map((scope) =>
    pilotScopeAllowsAction({
      scope,
      frame: sample.frame,
      action,
      top,
    }),
  );
}

function scoreGapForTop(
  rankedActions: readonly SemanticRankedAction[],
): number | null {
  const [top, next] = rankedActions;
  if (!top || !next) return null;
  return roundMetric(top.score - next.score);
}

function syntheticLegalActionForTop(
  sample: RealEngineDecisionCorpusSample,
  top: SemanticRankedAction,
  actionType: string,
): LegalAction {
  const candidate = sample.frame.actionCandidates.find(
    (candidate) => candidate.actionId === top.actionId,
  );
  const serverId =
    candidate?.targetContext?.selectedTargets[0]?.targetId ??
    candidate?.targetContext?.availableTargets?.[0]?.targetId;
  return {
    actionId: top.actionId,
    side: sample.side,
    type: actionType as LegalAction["type"],
    label: actionType,
    source: "basic_action",
    timingPoint:
      sample.side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: sample.frame.stateVersion,
    ...(serverId ? { payload: { serverId } } : {}),
  };
}

function topDisagreementReasons(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): string[] {
  return scenarios
    .filter((scenario) => scenario.agreementCompared && !scenario.agreement)
    .map((scenario) =>
      safe(
        `${scenario.scenarioId}:expected=${[
          ...(scenario.expectedTopActionTypes ?? []),
          ...(scenario.expectedTopActionIds ?? []),
        ].join("|")}:observed=${scenario.topActionType ?? scenario.topActionId ?? "none"}`,
      ),
    )
    .sort();
}

function buildFollowupCandidates(
  scenarios: readonly SemanticShadowLeagueScenarioReport[],
): ShadowLeagueFollowupCandidate[] {
  return scenarios
    .flatMap((scenario) => followupCandidatesForScenario(scenario))
    .sort(
      (left, right) =>
        left.scenarioId.localeCompare(right.scenarioId) ||
        left.issueClass.localeCompare(right.issueClass),
    );
}

function followupCandidatesForScenario(
  scenario: SemanticShadowLeagueScenarioReport,
): ShadowLeagueFollowupCandidate[] {
  const candidates: ShadowLeagueFollowupCandidate[] = [];
  if (scenario.agreementCompared && scenario.agreement === false) {
    candidates.push(followupCandidate(scenario, "expectation_mismatch"));
  }
  if ((scenario.forbiddenMistakeViolations?.length ?? 0) > 0) {
    candidates.push(followupCandidate(scenario, "forbidden_mistake"));
  }
  const expectedScopes = scenario.expectedPilotEligibleScopes ?? [];
  if (
    expectedScopes.length > 0 &&
    expectedScopes.some((scope) => !scenario.pilotEligibility.scopes.includes(scope))
  ) {
    candidates.push(followupCandidate(scenario, "pilot_blocked"));
  }
  if (scenario.observedMistakes.includes("target_choice_unavailable")) {
    candidates.push(followupCandidate(scenario, "target_choice_gap"));
  }
  if (scenario.observedMistakes.includes("plan_step_mismatch")) {
    candidates.push(followupCandidate(scenario, "doctrine_goal_conflict"));
  }
  return candidates;
}

function followupCandidate(
  scenario: SemanticShadowLeagueScenarioReport,
  issueClass: ShadowLeagueFollowupCandidate["issueClass"],
): ShadowLeagueFollowupCandidate {
  return {
    scenarioId: scenario.scenarioId,
    issueClass,
    suggestedPackage: suggestedPackageForIssue(issueClass),
    evidence: [
      `scenario:${scenario.scenarioId}`,
      `issue_class:${issueClass}`,
      ...(scenario.topActionType ? [`top_action_type:${scenario.topActionType}`] : []),
      ...(scenario.topGoalId ? [`top_goal:${scenario.topGoalId}`] : []),
      ...scenario.observedMistakes.map((mistake) => `observed_mistake:${mistake}`),
    ].map(safe),
  };
}

function suggestedPackageForIssue(
  issueClass: ShadowLeagueFollowupCandidate["issueClass"],
): string {
  switch (issueClass) {
    case "expectation_mismatch":
      return "shadow-league-expectation-review";
    case "forbidden_mistake":
      return "forbidden-mistake-regression";
    case "pilot_blocked":
      return "pilot-scope-readiness-gap";
    case "target_choice_gap":
      return "target-choice-shadow-coverage";
    case "doctrine_goal_conflict":
      return "doctrine-goal-coverage";
  }
}

function countMistakes(
  mistakes: readonly AiMistakeClass[],
): Record<AiMistakeClass, number> {
  const counts = Object.fromEntries(
    AI_MISTAKE_CLASSES.map((mistakeClass) => [mistakeClass, 0]),
  ) as Record<AiMistakeClass, number>;
  for (const mistake of mistakes) {
    counts[mistake] += 1;
  }
  return counts;
}

function countStrings(values: readonly string[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    const safeValue = safe(value);
    counts.set(safeValue, (counts.get(safeValue) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function uniqueMistakeClasses(
  mistakes: readonly AiMistakeClass[],
): AiMistakeClass[] {
  return [...new Set(mistakes)].sort();
}

function sanitizeList(values: readonly string[] | undefined): string[] {
  return [...(values ?? [])].map(safe).sort();
}

function sanitizePilotScopes(
  values: readonly AiPlayStrengthPilotScope[] | undefined,
): AiPlayStrengthPilotScope[] {
  return [...(values ?? [])]
    .map((value) => safe(value) as AiPlayStrengthPilotScope)
    .sort();
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function safe(value: string): string {
  return redactSemanticString(value);
}

function assertLeagueReportSideSafe(report: SemanticShadowLeagueReport): void {
  const forbiddenPath = findForbiddenSemanticPath(
    report,
    "SemanticShadowLeagueReport",
  );
  if (!forbiddenPath) return;
  throw new Error(
    `Semantic shadow league report contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}
