import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
  type ReplayDecisionCaseExtractionReport,
} from "./replay-decision-case-extraction";
import {
  REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION,
  type ReplayDecisionCandidateClusterReport,
} from "./replay-decision-case-clustering";
import {
  buildReplayAcceptanceHarnessReport,
  renderReplayAcceptanceHarnessMarkdown,
} from "./replay-acceptance-harness";

describe("ReplayAcceptanceHarness", () => {
  it("keeps historical holdout recurrence separate from real current-AI acceptance", () => {
    const report = buildReplayAcceptanceHarnessReport(
      extractionReport(),
      clusterReport(),
      {
        runId: "unit-test",
        fixedPattern: {
          selectedActionType: "draw_card",
          selectedPlanKind: "runner.obtain_breaker_coverage",
          challengerActionType: "start_run",
          challengerPlanKind: "simple_hq_or_rnd_pressure",
        },
      },
    );

    expect(report.status).toBe("implemented_but_acceptance_incomplete");
    expect(report.aggregate.historicalFixedPatternHoldoutCases).toBe(1);
    expect(report.gates.holdoutIgnoredDuringClustering).toBe(true);
    expect(report.gates.currentAiHoldoutEvaluated).toBe(false);
    expect(report.gates.portableReproAvailable).toBe(false);
    expect(report.conclusions).toContain(
      "Die aktuelle KI wurde noch nicht auf denselben Holdout-DecisionPoints ausgefuehrt.",
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
    expect(renderReplayAcceptanceHarnessMarkdown(report)).toContain(
      "Abnahme unvollstaendig",
    );
  });

  it("blocks acceptance when safety gates fail", () => {
    const extraction = extractionReport();
    extraction.redactionStatus = "failed" as "passed";

    const report = buildReplayAcceptanceHarnessReport(
      extraction,
      clusterReport(),
      { runId: "unsafe" },
    );

    expect(report.status).toBe("blocked");
  });
});

function extractionReport(): ReplayDecisionCaseExtractionReport {
  return {
    schemaVersion: REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
    scope: "local_replay_decision_case_extraction",
    source: { label: "unit-test", traceRows: 2 },
    aggregate: {
      cases: 2,
      discoveryCases: 1,
      holdoutCases: 1,
      bySide: {},
      byMode: {},
      byStatus: {},
      bySelectedActionType: {},
      byPlanKind: {},
    },
    cases: [
      caseEntry("case-1", "discovery"),
      caseEntry("case-2", "holdout"),
    ],
    redactionStatus: "passed",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    evidence: [],
  };
}

function clusterReport(): ReplayDecisionCandidateClusterReport {
  return {
    schemaVersion: REPLAY_DECISION_CASE_CLUSTERING_SCHEMA_VERSION,
    scope: "local_replay_decision_candidate_clustering",
    sourceCaseReportVersion: REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
    aggregate: {
      sourceCases: 2,
      discoveryCases: 1,
      holdoutCasesIgnored: 1,
      candidates: 1,
      blockedShadowOnly: 0,
      blockedTraceQuality: 0,
      clusters: 1,
    },
    selectedClusterForRepro: "replay-cluster-test",
    clusters: [],
    candidates: [],
    redactionStatus: "passed",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    evidence: [],
  };
}

function caseEntry(
  caseId: string,
  split: "discovery" | "holdout",
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
      stateVersion: 13,
      matchVersion: 1,
      turn: 4,
      decisionIndex: 2,
      traceDigest: "digest",
    },
    decision: {
      side: "runner",
      selectedActionType: "draw_card",
      planKind: "runner.obtain_breaker_coverage",
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
      rankedAlternatives: [
        {
          rank: 1,
          selectedActionType: "start_run",
          planKind: "simple_hq_or_rnd_pressure",
          score: 7645,
          visibleReasons: [],
          warnings: [],
          whyNot: [],
        },
      ],
      actionAlternatives: [],
    },
    reproducibility: {
      stateVersion: 13,
      eventId: `event-${caseId}`,
      decisionIndex: 2,
      requiresLocalRuntimeState: true,
      legalActionReconstructionRequired: true,
    },
    noRuntimeEffect: true,
    productiveUseAllowed: false,
  };
}
