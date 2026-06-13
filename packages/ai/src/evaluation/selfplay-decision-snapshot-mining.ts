import type { Side } from "@netgrid/shared";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import {
  detectAiSelfplaySuspiciousDecisions,
  extractAiSelfplayDecisionPoints,
  type AiSelfplayDecisionPoint,
  type AiSelfplayDecisionPointActionAlternative,
  type AiSelfplayTraceMiningDetectorId,
  type AiSelfplayTraceMiningDetectorOptions,
  type AiSelfplayTraceMiningResult,
} from "../simulation/selfplay-trace-mining";
import type { AiMistakeClass } from "./mistake-taxonomy";

export const SELFPLAY_DECISION_SNAPSHOT_MINING_SCHEMA_VERSION =
  "selfplay-decision-snapshot-mining-v1" as const;

export type SelfplayDecisionSnapshotMiningSummary =
  AiSelfplayTraceMiningResult["summaries"][number];

export type SelfplayDecisionSnapshotCandidateStatus =
  | "candidate_snapshot"
  | "blocked_missing_redacted_action_alternatives";

export type SelfplayDecisionSnapshotLegalActionCandidate = {
  actionId: string;
  actionType: string;
  rank: number;
  selected: boolean;
  excluded?: boolean;
  priority?: number;
  label?: string;
  source?: string;
  evidence: string[];
};

export type SelfplayDecisionSnapshotCandidate = {
  kind: "selfplay_decision_snapshot_candidate";
  snapshotId: string;
  status: SelfplayDecisionSnapshotCandidateStatus;
  matchId: string;
  seed: string;
  summaryIndex: number;
  actionIndex: number;
  side: Side;
  stateVersion: number;
  selectedActionId: string;
  selectedActionType: string;
  detectorIds: AiSelfplayTraceMiningDetectorId[];
  mistakeClasses: AiMistakeClass[];
  severity: "critical" | "high" | "medium" | "low";
  candidateSnapshot: {
    snapshotId: string;
    side: Side;
    description: string;
    legalActionCandidates: SelfplayDecisionSnapshotLegalActionCandidate[];
    expectedProperties: {
      mustChooseFromLegalActions: true;
      forbiddenMistakes: AiMistakeClass[];
    };
  };
  replaySafeReference: AiSelfplayDecisionPoint["replaySafeReference"];
  executableDecisionSnapshotAvailable: false;
  diagnosticOnly: true;
  noRuntimeEffect: true;
  evidence: string[];
};

export type SelfplayDecisionSnapshotCluster = {
  clusterId: string;
  candidateCount: number;
  mistakeClasses: AiMistakeClass[];
  selectedActionTypes: string[];
  detectorIds: AiSelfplayTraceMiningDetectorId[];
  severityCounts: Record<SelfplayDecisionSnapshotCandidate["severity"], number>;
  candidateSnapshotIds: string[];
  evidence: string[];
};

export type SelfplayDecisionSnapshotMiningReport = {
  schemaVersion: typeof SELFPLAY_DECISION_SNAPSHOT_MINING_SCHEMA_VERSION;
  scope: "selfplay_decision_snapshot_mining_report_only";
  sourceSummaryCount: number;
  sourceDecisionPointCount: number;
  findingCount: number;
  candidateCount: number;
  blockedCandidateCount: number;
  clusterCount: number;
  candidatesByMistakeClass: Record<AiMistakeClass, number>;
  clusters: SelfplayDecisionSnapshotCluster[];
  candidates: SelfplayDecisionSnapshotCandidate[];
  redactionStatus: "passed";
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type BuildSelfplayDecisionSnapshotMiningReportOptions =
  AiSelfplayTraceMiningDetectorOptions & {
    maxCandidates?: number;
  };

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

const DETECTOR_MISTAKE_CLASS_MAP: Record<
  AiSelfplayTraceMiningDetectorId,
  readonly AiMistakeClass[]
> = {
  illegal_action: ["illegal_action"],
  replay_failure: ["plan_step_mismatch"],
  hidden_info_marker: ["hidden_info_dependency"],
  no_legal_action_failure: ["illegal_action"],
  action_limit_reached: ["plan_step_mismatch"],
  repeated_no_progress_run: ["unsafe_run", "plan_step_mismatch"],
  repeated_known_no_payoff_remote: ["unsafe_run", "ignored_remote_threat"],
  repeated_low_value_archives: ["missed_safe_access", "plan_step_mismatch"],
  recovery_low_value_loop: ["plan_step_mismatch"],
  bank_over_target_without_funding_need: ["economy_starvation"],
  risky_self_damage_action: ["unsafe_run", "ignored_damage_risk"],
  blink_low_hand_buffer_run: ["unsafe_run", "ignored_damage_risk"],
  duplicate_low_delta_install: ["bad_install_redundancy"],
  overdraw_without_urgency: ["plan_step_mismatch"],
  plan_step_action_mismatch: ["plan_step_mismatch"],
  semantic_override_suspicious: ["plan_step_mismatch"],
  corp_never_scores_long_game: ["missed_score_window"],
  runner_never_accesses_long_game: ["missed_safe_access"],
};

export function buildSelfplayDecisionSnapshotMiningReport(
  summaries: readonly SelfplayDecisionSnapshotMiningSummary[],
  options: BuildSelfplayDecisionSnapshotMiningReportOptions = {},
): SelfplayDecisionSnapshotMiningReport {
  const findings = detectAiSelfplaySuspiciousDecisions([...summaries], options);
  const points = extractAiSelfplayDecisionPoints(summaries);
  const pointByKey = new Map(points.map((point) => [pointKey(point), point]));
  const candidates = findings
    .slice(0, options.maxCandidates ?? findings.length)
    .flatMap((finding) => {
      const point = pointByKey.get(
        [
          finding.summaryIndex,
          finding.actionIndex,
          finding.side,
          finding.stateVersion,
          finding.selectedActionId,
        ].join(":"),
      );
      if (!point) return [];
      return [candidateFromFinding(point, finding)];
    });
  const report: SelfplayDecisionSnapshotMiningReport = {
    schemaVersion: SELFPLAY_DECISION_SNAPSHOT_MINING_SCHEMA_VERSION,
    scope: "selfplay_decision_snapshot_mining_report_only",
    sourceSummaryCount: summaries.length,
    sourceDecisionPointCount: points.length,
    findingCount: findings.length,
    candidateCount: candidates.length,
    blockedCandidateCount: candidates.filter((candidate) =>
      candidate.status.startsWith("blocked_"),
    ).length,
    clusterCount: clusterCandidates(candidates).length,
    candidatesByMistakeClass: countCandidateMistakeClasses(candidates),
    clusters: clusterCandidates(candidates),
    candidates,
    redactionStatus: "passed",
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "selfplay_decision_snapshot_mining:report_only",
      `source_summary_count:${summaries.length}`,
      `source_decision_point_count:${points.length}`,
      `finding_count:${findings.length}`,
      `candidate_count:${candidates.length}`,
      `cluster_count:${clusterCandidates(candidates).length}`,
      "runtime_consumer:none",
      "productive_use_allowed:false",
    ],
  };
  assertSelfplayDecisionSnapshotMiningReportSideSafe(report);
  return report;
}

function clusterCandidates(
  candidates: readonly SelfplayDecisionSnapshotCandidate[],
): SelfplayDecisionSnapshotCluster[] {
  const byId = new Map<string, SelfplayDecisionSnapshotCandidate[]>();
  for (const candidate of candidates) {
    const key = [
      candidate.mistakeClasses.join("+") || "unclassified",
      candidate.selectedActionType,
    ].join(":");
    byId.set(key, [...(byId.get(key) ?? []), candidate]);
  }
  return [...byId.entries()]
    .map(([clusterId, clusterCandidates]) => {
      const detectorIds = sortedUnique(
        clusterCandidates.flatMap((candidate) => candidate.detectorIds),
      ) as AiSelfplayTraceMiningDetectorId[];
      const selectedActionTypes = sortedUnique(
        clusterCandidates.map((candidate) => candidate.selectedActionType),
      );
      const mistakeClasses = sortedUnique(
        clusterCandidates.flatMap((candidate) => candidate.mistakeClasses),
      ) as AiMistakeClass[];
      return {
        clusterId: safe(clusterId),
        candidateCount: clusterCandidates.length,
        mistakeClasses,
        selectedActionTypes,
        detectorIds,
        severityCounts: severityCounts(clusterCandidates),
        candidateSnapshotIds: clusterCandidates
          .map((candidate) => candidate.snapshotId)
          .sort(),
        evidence: [
          "selfplay_snapshot_cluster:report_only",
          `cluster_candidate_count:${clusterCandidates.length}`,
          `cluster_detector_count:${detectorIds.length}`,
        ],
      };
    })
    .sort(
      (left, right) =>
        right.candidateCount - left.candidateCount ||
        left.clusterId.localeCompare(right.clusterId),
    );
}

function severityCounts(
  candidates: readonly SelfplayDecisionSnapshotCandidate[],
): Record<SelfplayDecisionSnapshotCandidate["severity"], number> {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const candidate of candidates) counts[candidate.severity] += 1;
  return counts;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.map(safe))].sort();
}

function candidateFromFinding(
  point: AiSelfplayDecisionPoint,
  finding: ReturnType<typeof detectAiSelfplaySuspiciousDecisions>[number],
): SelfplayDecisionSnapshotCandidate {
  const mistakeClasses = mistakeClassesForDetectors(finding.detectorIds);
  const snapshotId = safe(
    `selfplay_${point.seed}_${point.stateVersion}_${finding.detectorIds.join("_")}`,
  );
  const legalActionCandidates = point.actionAlternatives.map(
    legalActionCandidateFromAlternative,
  );
  return {
    kind: "selfplay_decision_snapshot_candidate",
    snapshotId,
    status:
      legalActionCandidates.length > 0
        ? "candidate_snapshot"
        : "blocked_missing_redacted_action_alternatives",
    matchId: safe(point.matchId),
    seed: safe(point.seed),
    summaryIndex: point.summaryIndex,
    actionIndex: point.actionIndex,
    side: point.side,
    stateVersion: point.stateVersion,
    selectedActionId: safe(point.selectedActionId),
    selectedActionType: safe(point.selectedActionType),
    detectorIds: finding.detectorIds.map(safeDetectorId),
    mistakeClasses,
    severity: finding.severity,
    candidateSnapshot: {
      snapshotId,
      side: point.side,
      description: safe(finding.shortReason),
      legalActionCandidates,
      expectedProperties: {
        mustChooseFromLegalActions: true,
        forbiddenMistakes: mistakeClasses,
      },
    },
    replaySafeReference: {
      seed: safe(point.replaySafeReference.seed),
      stateVersion: point.replaySafeReference.stateVersion,
      fromActionIndex: point.replaySafeReference.fromActionIndex,
      toActionIndex: point.replaySafeReference.toActionIndex,
    },
    executableDecisionSnapshotAvailable: false,
    diagnosticOnly: true,
    noRuntimeEffect: true,
    evidence: [
      `detectors:${finding.detectorIds.map(safe).join(",")}`,
      `mistake_classes:${mistakeClasses.join(",")}`,
      `action_alternative_count:${legalActionCandidates.length}`,
      "candidate_snapshot:not_executable_without_redacted_input_builder",
      "runtime_consumer:none",
      "productive_use_allowed:false",
      ...point.facts.map(safe),
      ...finding.relevantDebugFacts.map(safe),
    ],
  };
}

function legalActionCandidateFromAlternative(
  alternative: AiSelfplayDecisionPointActionAlternative,
): SelfplayDecisionSnapshotLegalActionCandidate {
  return {
    actionId: safe(alternative.actionId),
    actionType: safe(alternative.actionType),
    rank: alternative.rank,
    selected: alternative.selected,
    ...(alternative.excluded !== undefined
      ? { excluded: alternative.excluded }
      : {}),
    ...(alternative.priority !== undefined
      ? { priority: alternative.priority }
      : {}),
    ...(alternative.label ? { label: safe(alternative.label) } : {}),
    ...(alternative.source ? { source: safe(alternative.source) } : {}),
    evidence: [
      `alternative_rank:${alternative.rank}`,
      `alternative_selected:${alternative.selected}`,
      ...alternative.whyChosen.map((fact) => `why_chosen:${safe(fact)}`),
      ...alternative.whyNot.map((fact) => `why_not:${safe(fact)}`),
    ],
  };
}

function pointKey(point: AiSelfplayDecisionPoint): string {
  return [
    point.summaryIndex,
    point.actionIndex,
    point.side,
    point.stateVersion,
    point.selectedActionId,
  ].join(":");
}

function mistakeClassesForDetectors(
  detectorIds: readonly AiSelfplayTraceMiningDetectorId[],
): AiMistakeClass[] {
  return [
    ...new Set(
      detectorIds.flatMap((detectorId) => DETECTOR_MISTAKE_CLASS_MAP[detectorId]),
    ),
  ].sort();
}

function countCandidateMistakeClasses(
  candidates: readonly SelfplayDecisionSnapshotCandidate[],
): Record<AiMistakeClass, number> {
  const counts = Object.fromEntries(
    AI_MISTAKE_CLASSES.map((mistakeClass) => [mistakeClass, 0]),
  ) as Record<AiMistakeClass, number>;
  for (const candidate of candidates) {
    for (const mistakeClass of candidate.mistakeClasses) {
      counts[mistakeClass] += 1;
    }
  }
  return counts;
}

function safeDetectorId(
  detectorId: AiSelfplayTraceMiningDetectorId,
): AiSelfplayTraceMiningDetectorId {
  return safe(detectorId) as AiSelfplayTraceMiningDetectorId;
}

function safe(value: string): string {
  return redactSemanticString(value);
}

function assertSelfplayDecisionSnapshotMiningReportSideSafe(
  report: SelfplayDecisionSnapshotMiningReport,
): void {
  const forbiddenPath = findForbiddenSemanticPath(
    report,
    "SelfplayDecisionSnapshotMiningReport",
  );
  if (!forbiddenPath) return;
  throw new Error(
    `Selfplay decision snapshot mining report contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}
