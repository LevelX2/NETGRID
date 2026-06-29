import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
  type ReplayDecisionCaseExtractionReport,
} from "./replay-decision-case-extraction";
import {
  buildReplayDecisionCandidateClusterReport,
  REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION,
} from "./replay-decision-case-clustering";

describe("ReplayDecisionCaseClustering", () => {
  it("clusters high-gap discovery challengers without confirming them as fixes", () => {
    const report = buildReplayDecisionCandidateClusterReport(sourceReport());

    expect(report.schemaVersion).toBe(
      REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION,
    );
    expect(report.aggregate.sourceCases).toBe(4);
    expect(report.aggregate.discoveryCases).toBe(3);
    expect(report.aggregate.holdoutCasesIgnored).toBe(1);
    expect(report.aggregate.candidates).toBe(2);
    expect(report.aggregate.blockedTraceQuality).toBe(1);
    expect(report.clusters).toHaveLength(1);
    expect(report.clusters[0]).toMatchObject({
      status: "candidate_cluster_needs_repro",
      candidateCount: 2,
      selectedActionTypes: ["draw_card"],
      challengerActionTypes: ["start_run"],
      mistakeClasses: ["missed_safe_access", "plan_step_mismatch"],
    });
    expect(report.selectedClusterForRepro).toBe(report.clusters[0]?.clusterId);
    expect(report.candidates.every((entry) => entry.status !== undefined)).toBe(
      true,
    );
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});

function sourceReport(): ReplayDecisionCaseExtractionReport {
  return {
    schemaVersion: REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
    scope: "local_replay_decision_case_extraction",
    source: { label: "unit-test", traceRows: 4 },
    aggregate: {
      cases: 4,
      discoveryCases: 3,
      holdoutCases: 1,
      bySide: {},
      byMode: {},
      byStatus: {},
      bySelectedActionType: {},
      byPlanKind: {},
    },
    cases: [
      caseEntry("case-1", "discovery", "draw_card", [
        { rank: 1, selectedActionType: "start_run", planKind: "simple_run_choice", score: 8125, visibleReasons: [], warnings: [], whyNot: [] },
        { rank: 2, selectedActionType: "draw_card", planKind: "runner.obtain_breaker_coverage", score: 5325, visibleReasons: [], warnings: [], whyNot: [] },
      ]),
      caseEntry("case-2", "discovery", "draw_card", [
        { rank: 1, selectedActionType: "start_run", planKind: "simple_run_choice", score: 7655, visibleReasons: [], warnings: [], whyNot: [] },
        { rank: 2, selectedActionType: "draw_card", planKind: "runner.obtain_breaker_coverage", score: 5325, visibleReasons: [], warnings: [], whyNot: [] },
      ]),
      caseEntry("case-3", "holdout", "draw_card", [
        { rank: 1, selectedActionType: "start_run", score: 9999, visibleReasons: [], warnings: [], whyNot: [] },
      ]),
      caseEntry("case-4", "discovery", "none", []),
    ],
    redactionStatus: "passed",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    evidence: [],
  };
}

function caseEntry(
  caseId: string,
  split: "discovery" | "holdout",
  selectedActionType: string,
  rankedAlternatives: ReplayDecisionCaseExtractionReport["cases"][number]["observables"]["rankedAlternatives"],
): ReplayDecisionCaseExtractionReport["cases"][number] {
  return {
    kind: "replay_decision_case",
    caseId,
    split,
    source: {
      matchId: `match-${caseId}`,
      traceId: `trace-${caseId}`,
      eventId: `event-${caseId}`,
      mode: "human_corp_vs_runner_ai",
      status: "finished",
      stateVersion: 1,
      matchVersion: 1,
      turn: 1,
      decisionIndex: 1,
      traceDigest: "digest",
    },
    decision: {
      side: "runner",
      selectedActionType,
      planKind:
        selectedActionType === "draw_card"
          ? "runner.obtain_breaker_coverage"
          : "none",
      ...(selectedActionType === "draw_card" ? { score: 5325 } : {}),
    },
    observables: {
      facts: [],
      hypotheses: [],
      invalidations: [],
      uncertainty: [],
      beliefUncertainty: [],
      visibleReasons: [],
      warnings: [],
      whyNot: [],
      scoreBreakdown: [],
      rankedAlternatives,
      actionAlternatives: [],
    },
    reproducibility: {
      stateVersion: 1,
      eventId: `event-${caseId}`,
      decisionIndex: 1,
      requiresLocalRuntimeState: true,
      legalActionReconstructionRequired: true,
    },
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
}
