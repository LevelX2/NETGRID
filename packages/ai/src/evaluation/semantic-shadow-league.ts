import type { LegalAction, Side } from "@netgrid/shared";
import {
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  pilotScopeAllowsAction,
  type AiPlayStrengthPilotScope,
} from "../decision/pilot-scope-registry";
import type { SemanticRankedAction } from "../decision/semantic-decision-trace";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import { classifyDecisionTraceMistakes } from "./decision-snapshot-suite";
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

export const PLAY_STRENGTH_SHADOW_LEAGUE_EXPECTATIONS = [
  expectation("runner_real_low_credits", ["gain_credit", "draw_card"]),
  expectation("runner_real_safe_hq_access", ["start_run"]),
  expectation("runner_real_safe_rd_access", ["start_run"]),
  expectation("runner_real_remote_score_threat", ["start_run"]),
  expectation("runner_real_damage_buffer_needed", ["draw_card"]),
  expectation("runner_real_tag_cleanup", ["remove_tag"]),
  expectation("corp_real_score_agenda_window", ["score_agenda"]),
  expectation("corp_real_advance_score_window", ["advance_card"]),
  expectation("corp_real_low_rez_reserve", ["gain_credit", "draw_card"]),
  expectation("corp_real_rez_value_window", ["rez_ice"]),
  expectation("corp_real_do_not_rez_when_broke", ["decline_rez"]),
  expectation("corp_real_basic_economy_draw", ["gain_credit", "draw_card"]),
] as const satisfies readonly SemanticShadowLeagueExpectation[];

export type SemanticShadowLeagueExpectation = {
  scenarioId: string;
  expectedTopActionTypes?: readonly string[];
  expectedTopActionIds?: readonly string[];
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
  agreementCompared: boolean;
  agreement?: boolean;
  observedMistakes: AiMistakeClass[];
  blockers: Record<string, number>;
  evidence: string[];
};

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
    pilotWouldOverrideCount: number;
    scopeBreakdown: Record<AiPlayStrengthPilotScope, SemanticShadowLeaguePilotScopeBreakdown>;
    rankedActionCount: number;
    rejectedActionCount: number;
    topScoreAverage: number | null;
    topScoreMin: number | null;
    topScoreMax: number | null;
    blockersByKind: Record<string, number>;
  };
  topDisagreementReasons: string[];
  redactionStatus: "passed";
  scenarios: SemanticShadowLeagueScenarioReport[];
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type SemanticShadowLeaguePilotScopeBreakdown = {
  eligibleCount: number;
  wouldOverrideCount: number;
  scenarioIds: string[];
};

export function buildSemanticShadowLeagueReport(
  samples: readonly RealEngineDecisionCorpusSample[],
  expectations: readonly SemanticShadowLeagueExpectation[] =
    PLAY_STRENGTH_SHADOW_LEAGUE_EXPECTATIONS,
): SemanticShadowLeagueReport {
  const expectationByScenarioId = new Map(
    expectations.map((expectation) => [expectation.scenarioId, expectation]),
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
  const agreementCompared =
    expectedTopActionTypes.length > 0 || expectedTopActionIds.length > 0;
  const agreement = agreementCompared
    ? topAgreesWithExpectation(top, topCandidate?.actionType, {
        expectedTopActionTypes,
        expectedTopActionIds,
      })
    : undefined;
  const mistakes = classifyDecisionTraceMistakes(sample.frame, sample.trace);
  const pilotScopes = eligiblePilotScopes(sample, top, topCandidate?.actionType);
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
    agreementCompared,
    ...(agreementCompared ? { agreement: agreement === true } : {}),
    observedMistakes: uniqueMistakeClasses(
      mistakes.map((mistake) => mistake.mistakeClass),
    ),
    blockers: countStrings(
      sample.trace.rejectedActions.flatMap((action) => action.blockers),
    ),
    evidence: [
      `scenario:${safe(sample.scenarioId)}`,
      `side:${sample.side}`,
      `ranked_action_count:${sample.trace.rankedActions.length}`,
      `rejected_action_count:${sample.trace.rejectedActions.length}`,
      `agreement_compared:${agreementCompared}`,
      ...(agreementCompared ? [`agreement:${Boolean(agreement)}`] : []),
      `pilot_scope_eligible:${pilotScopes.length > 0}`,
      `pilot_would_override:${pilotScopes.length > 0}`,
      ...pilotScopes.map((scope) => `pilot_scope:${scope}:eligible`),
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
  const topScores = scenarios
    .map((scenario) => scenario.topScore)
    .filter((score): score is number => score !== undefined);
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
    pilotEligibleCount: scenarios.filter((scenario) =>
      scenario.evidence.includes("pilot_scope_eligible:true"),
    ).length,
    pilotWouldOverrideCount: scenarios.filter((scenario) =>
      scenario.evidence.includes("pilot_would_override:true"),
    ).length,
    scopeBreakdown: pilotScopeBreakdown(scenarios),
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
    for (const scope of [
      BASIC_SETUP_PILOT_MODE,
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      CORP_SCORE_WINDOW_PILOT_MODE,
    ] as const) {
      if (!scenario.evidence.includes(`pilot_scope:${scope}:eligible`)) continue;
      result[scope].eligibleCount += 1;
      result[scope].wouldOverrideCount += 1;
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

function eligiblePilotScopes(
  sample: RealEngineDecisionCorpusSample,
  top: SemanticRankedAction | undefined,
  topActionType: string | undefined,
): AiPlayStrengthPilotScope[] {
  if (!top || !topActionType) return [];
  const action = syntheticLegalActionForTop(sample, top, topActionType);
  const scopes: readonly AiPlayStrengthPilotScope[] = [
    BASIC_SETUP_PILOT_MODE,
    RUNNER_SAFE_ACCESS_PILOT_MODE,
    CORP_SCORE_WINDOW_PILOT_MODE,
  ];
  return scopes.filter(
    (scope) =>
      pilotScopeAllowsAction({
        scope,
        frame: sample.frame,
        action,
        top,
      }).allowed,
  );
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

function expectation(
  scenarioId: string,
  expectedTopActionTypes: readonly string[],
): SemanticShadowLeagueExpectation {
  return {
    scenarioId,
    expectedTopActionTypes,
    evidence: [`expectation:${scenarioId}`],
  };
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
