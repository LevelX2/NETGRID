import { createHash } from "node:crypto";
import {
  assertSemanticObjectSideSafe,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import type {
  ReplayDecisionCase,
  ReplayDecisionCaseExtractionReport,
} from "./replay-decision-case-extraction";
import type { AiMistakeClass } from "./mistake-taxonomy";

export const REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION =
  "replay-decision-case-clustering-v1" as const;

export type ReplayDecisionCandidateStatus =
  | "candidate_needs_same_state_repro"
  | "blocked_shadow_only"
  | "blocked_trace_quality";

export type ReplayDecisionCandidate = {
  kind: "replay_decision_candidate";
  candidateId: string;
  caseId: string;
  status: ReplayDecisionCandidateStatus;
  clusterKey: string;
  side: ReplayDecisionCase["decision"]["side"];
  selectedActionType: string;
  selectedPlanKind: string;
  challengerActionType?: string;
  challengerPlanKind?: string;
  scoreGap?: number;
  mistakeClasses: AiMistakeClass[];
  evidence: string[];
};

export type ReplayDecisionCandidateCluster = {
  clusterId: string;
  status: "candidate_cluster_needs_repro";
  clusterKey: string;
  candidateCount: number;
  side: ReplayDecisionCase["decision"]["side"];
  selectedActionTypes: string[];
  challengerActionTypes: string[];
  mistakeClasses: AiMistakeClass[];
  averageScoreGap: number;
  maxScoreGap: number;
  sampleCandidateIds: string[];
  evidence: string[];
};

export type ReplayDecisionCandidateClusterReport = {
  schemaVersion: typeof REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION;
  scope: "local_replay_decision_candidate_clustering";
  sourceCaseReportVersion: ReplayDecisionCaseExtractionReport["schemaVersion"];
  aggregate: {
    sourceCases: number;
    discoveryCases: number;
    holdoutCasesIgnored: number;
    candidates: number;
    blockedShadowOnly: number;
    blockedTraceQuality: number;
    clusters: number;
  };
  selectedClusterForRepro?: string;
  clusters: ReplayDecisionCandidateCluster[];
  candidates: ReplayDecisionCandidate[];
  redactionStatus: "passed";
  noRuntimeEffect: true;
  productiveUseAllowed: false;
  evidence: string[];
};

export function buildReplayDecisionCandidateClusterReport(
  report: ReplayDecisionCaseExtractionReport,
): ReplayDecisionCandidateClusterReport {
  const sourceCases = report.cases;
  const candidates = sourceCases
    .filter((entry) => entry.split === "discovery")
    .map(candidateFromCase)
    .filter((entry): entry is ReplayDecisionCandidate => entry !== undefined);
  const clusters = clusterCandidates(
    candidates.filter((entry) => entry.status === "candidate_needs_same_state_repro"),
  );
  const output: ReplayDecisionCandidateClusterReport = {
    schemaVersion: REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION,
    scope: "local_replay_decision_candidate_clustering",
    sourceCaseReportVersion: report.schemaVersion,
    aggregate: {
      sourceCases: sourceCases.length,
      discoveryCases: sourceCases.filter((entry) => entry.split === "discovery")
        .length,
      holdoutCasesIgnored: sourceCases.filter((entry) => entry.split === "holdout")
        .length,
      candidates: candidates.filter(
        (entry) => entry.status === "candidate_needs_same_state_repro",
      ).length,
      blockedShadowOnly: candidates.filter(
        (entry) => entry.status === "blocked_shadow_only",
      ).length,
      blockedTraceQuality: candidates.filter(
        (entry) => entry.status === "blocked_trace_quality",
      ).length,
      clusters: clusters.length,
    },
    ...(clusters[0] ? { selectedClusterForRepro: clusters[0].clusterId } : {}),
    clusters,
    candidates,
    redactionStatus: "passed",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    evidence: [
      "replay_decision_candidate_clustering:discovery_only",
      "holdout_ignored:true",
      "shadow_ranking_not_confirmed_without_repro:true",
      `source_case_count:${sourceCases.length}`,
      `candidate_count:${candidates.length}`,
      `cluster_count:${clusters.length}`,
    ],
  };
  assertSemanticObjectSideSafe(output, "ReplayDecisionCandidateClusterReport");
  return output;
}

function candidateFromCase(
  decisionCase: ReplayDecisionCase,
): ReplayDecisionCandidate | undefined {
  if (decisionCase.decision.selectedActionType === "none") {
    return blockedCandidate(decisionCase, "blocked_trace_quality", [
      "selected_action_type:none",
    ]);
  }
  const top = decisionCase.observables.rankedAlternatives[0];
  if (!top?.selectedActionType || top.selectedActionType === decisionCase.decision.selectedActionType) {
    return undefined;
  }
  const selectedAlternative = decisionCase.observables.rankedAlternatives.find(
    (entry) => entry.selectedActionType === decisionCase.decision.selectedActionType,
  );
  const selectedActionAlternative =
    decisionCase.observables.actionAlternatives.find((entry) => entry.selected);
  const challengerActionAlternative =
    decisionCase.observables.actionAlternatives.find(
      (entry) => !entry.selected && entry.actionType === top.selectedActionType,
    );
  const selectedScore = selectedAlternative?.score ?? decisionCase.decision.score;
  if (top.score === undefined || selectedScore === undefined) {
    return blockedCandidate(decisionCase, "blocked_shadow_only", [
      "score_gap_unavailable",
      `challenger_action_type:${top.selectedActionType}`,
    ]);
  }
  const scoreGap = Math.round((top.score - selectedScore) * 1000) / 1000;
  if (scoreGap < 1000 || top.score < 7000) {
    return blockedCandidate(decisionCase, "blocked_shadow_only", [
      `score_gap:${scoreGap}`,
      `challenger_action_type:${top.selectedActionType}`,
    ]);
  }
  const clusterKey = [
    decisionCase.decision.side,
    decisionCase.decision.selectedActionType,
    decisionCase.decision.planKind ?? "none",
    "to",
    top.selectedActionType,
    top.planKind ?? "none",
  ].join("|");
  return {
    kind: "replay_decision_candidate",
    candidateId: candidateId(decisionCase.caseId, clusterKey),
    caseId: decisionCase.caseId,
    status: "candidate_needs_same_state_repro",
    clusterKey,
    side: decisionCase.decision.side,
    selectedActionType: decisionCase.decision.selectedActionType,
    selectedPlanKind: decisionCase.decision.planKind ?? "none",
    challengerActionType: top.selectedActionType,
    ...(top.planKind ? { challengerPlanKind: top.planKind } : {}),
    scoreGap,
    mistakeClasses: mistakeClassesFor(decisionCase, top.selectedActionType),
    evidence: [
      "selected_from_discovery_case:true",
      "ranked_challenger_present:true",
      `selected_action_type:${decisionCase.decision.selectedActionType}`,
      `challenger_action_type:${top.selectedActionType}`,
      `score_gap:${scoreGap}`,
      ...whyNotEvidence("challenger_why_not", top.whyNot),
      ...whyNotEvidence(
        "selected_why_not",
        selectedAlternative?.whyNot ?? decisionCase.observables.whyNot,
      ),
      ...whyFactEvidence(
        "selected_action_why_chosen",
        selectedActionAlternative?.whyChosen ?? [],
      ),
      ...whyFactEvidence(
        "selected_action_why_not",
        selectedActionAlternative?.whyNot ?? [],
      ),
      ...whyFactEvidence(
        "challenger_action_why_chosen",
        challengerActionAlternative?.whyChosen ?? [],
      ),
      ...whyFactEvidence(
        "challenger_action_why_not",
        challengerActionAlternative?.whyNot ?? [],
      ),
      ...decisionCase.observables.warnings.map((warning) => `warning:${warning}`),
    ],
  };
}

function whyNotEvidence(prefix: string, whyNot: readonly string[]): string[] {
  return whyFactEvidence(prefix, whyNot);
}

function whyFactEvidence(prefix: string, facts: readonly string[]): string[] {
  return facts
    .slice(0, 6)
    .map((fact) => redactSemanticString(fact).trim())
    .filter((fact) => fact.length > 0)
    .map((fact) => `${prefix}:${fact.slice(0, 240)}`);
}

function blockedCandidate(
  decisionCase: ReplayDecisionCase,
  status: Exclude<ReplayDecisionCandidateStatus, "candidate_needs_same_state_repro">,
  evidence: string[],
): ReplayDecisionCandidate {
  const clusterKey = [
    decisionCase.decision.side,
    decisionCase.decision.selectedActionType,
    decisionCase.decision.planKind ?? "none",
    status,
  ].join("|");
  return {
    kind: "replay_decision_candidate",
    candidateId: candidateId(decisionCase.caseId, clusterKey),
    caseId: decisionCase.caseId,
    status,
    clusterKey,
    side: decisionCase.decision.side,
    selectedActionType: decisionCase.decision.selectedActionType,
    selectedPlanKind: decisionCase.decision.planKind ?? "none",
    mistakeClasses: [],
    evidence,
  };
}

function clusterCandidates(
  candidates: readonly ReplayDecisionCandidate[],
): ReplayDecisionCandidateCluster[] {
  const groups = new Map<string, ReplayDecisionCandidate[]>();
  for (const candidate of candidates) {
    const existing = groups.get(candidate.clusterKey) ?? [];
    existing.push(candidate);
    groups.set(candidate.clusterKey, existing);
  }
  return [...groups.entries()]
    .map(([clusterKey, entries]) => {
      const scoreGaps = entries
        .map((entry) => entry.scoreGap)
        .filter((entry): entry is number => entry !== undefined);
      const mistakeClasses = unique(entries.flatMap((entry) => entry.mistakeClasses));
      return {
        clusterId: `replay-cluster-${digest(clusterKey).slice(0, 12)}`,
        status: "candidate_cluster_needs_repro" as const,
        clusterKey,
        candidateCount: entries.length,
        side: entries[0]?.side ?? "runner",
        selectedActionTypes: unique(entries.map((entry) => entry.selectedActionType)),
        challengerActionTypes: unique(
          entries.flatMap((entry) =>
            entry.challengerActionType ? [entry.challengerActionType] : [],
          ),
        ),
        mistakeClasses,
        averageScoreGap: average(scoreGaps),
        maxScoreGap: Math.max(...scoreGaps, 0),
        sampleCandidateIds: entries.slice(0, 12).map((entry) => entry.candidateId),
        evidence: [
          "cluster_status:candidate_needs_same_state_repro",
          `candidate_count:${entries.length}`,
          `average_score_gap:${average(scoreGaps)}`,
          `max_score_gap:${Math.max(...scoreGaps, 0)}`,
          ...mistakeClasses.map((entry) => `mistake_class:${entry}`),
        ],
      };
    })
    .sort(
      (left, right) =>
        right.candidateCount - left.candidateCount ||
        right.averageScoreGap - left.averageScoreGap ||
        left.clusterId.localeCompare(right.clusterId),
    );
}

function mistakeClassesFor(
  decisionCase: ReplayDecisionCase,
  challengerActionType: string,
): AiMistakeClass[] {
  const mistakes: AiMistakeClass[] = ["plan_step_mismatch"];
  if (
    challengerActionType === "start_run" &&
    decisionCase.decision.selectedActionType !== "start_run"
  ) {
    mistakes.push("missed_safe_access");
  }
  if (decisionCase.decision.selectedActionType === "gain_credit") {
    mistakes.push("economy_starvation");
  }
  return unique(mistakes);
}

function candidateId(caseId: string, clusterKey: string): string {
  return `replay-candidate-${digest(`${caseId}:${clusterKey}`).slice(0, 16)}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000;
}
