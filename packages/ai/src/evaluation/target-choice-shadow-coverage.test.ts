import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildTargetChoiceShadowReport } from "../decision/target-choice-shadow";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import { buildTargetChoiceShadowCandidateCoverageReport } from "./target-choice-shadow-coverage";

describe("TargetChoiceShadow candidate coverage", () => {
  it("aggregates scorecard coverage without enabling target selection", () => {
    const covered = buildTargetChoiceShadowReport({
      action: action({
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
            allowedServers: ["hq", "remote_1"],
          },
        ],
      }),
      utilityFamilies: ["remote_contest"],
      opportunities: [
        {
          opportunity: "remote_contest_window",
          priority: "high",
          side: "runner",
          targetId: "remote_1",
          evidence: ["test:remote"],
        },
      ],
    });
    const blocked = buildTargetChoiceShadowReport({
      action: action({
        actionId: "hidden",
        targetRequirements: [
          {
            id: "secret_target",
            kind: "card",
            visibility: "engine_only",
          },
        ],
      }),
    });
    const report = buildTargetChoiceShadowCandidateCoverageReport([
      {
        scenarioId: "covered_case",
        reports: [covered],
        expectedCandidateCount: 1,
      },
      {
        scenarioId: "blocked_case",
        reports: [blocked],
        expectedCandidateCount: 1,
      },
      {
        scenarioId: "missing_case",
        reports: [],
        expectedCandidateCount: 1,
      },
    ]);

    expect(report).toMatchObject({
      version: "target-choice-shadow-candidate-coverage-v1",
      scope: "target_choice_shadow_candidate_coverage_report",
      diagnosticOnly: true,
      scenarioCount: 3,
      actionReportCount: 2,
      expectedCandidateCount: 3,
      coverageStatusCounts: {
        covered: 1,
        partial: 0,
        blocked: 1,
        empty: 0,
      },
      optionTotals: {
        total: 2,
        choice: 0,
        target: 2,
      },
      blockedRequirementTotals: {
        total: 1,
        engineOnly: 1,
        noSideSafeOptions: 0,
      },
      targetFitRecommendationCount: 1,
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
    expect(report.contextSignalTotals).toMatchObject({
      contextScoredOptions: 1,
      utilityLinkedOptions: 1,
      opportunityLinkedOptions: 1,
    });
    expect(report.evidence).toEqual(
      expect.arrayContaining(["target_fit_recommendation_count:1"]),
    );
    expect(report.scenariosWithoutReports).toEqual(["missing_case"]);
    expect(report.scenariosWithBlockedRequirements).toEqual(["blocked_case"]);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("reports target-choice coverage over real Engine target candidates", () => {
    const scenarios = buildRealEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);
    const report = buildTargetChoiceShadowCandidateCoverageReport(
      scenarios.map((scenario) => {
        const sample = samples.find(
          (candidate) => candidate.scenarioId === scenario.scenarioId,
        );
        if (!sample) {
          throw new Error(`Missing sample for ${scenario.scenarioId}`);
        }
        const targetRelevantActions = scenario.input.legalActions.filter(
          isTargetChoiceRelevantAction,
        );
        return {
          scenarioId: scenario.scenarioId,
          expectedCandidateCount: targetRelevantActions.length,
          reports: targetRelevantActions.map((legalAction) => {
            const candidate = sample.frame.actionCandidates.find(
              (candidate) => candidate.actionId === legalAction.actionId,
            );
            return buildTargetChoiceShadowReport({
              action: legalAction,
              ...(candidate ? { candidate } : {}),
            });
          }),
        };
      }),
    );

    expect(report.scenarioCount).toBe(scenarios.length);
    expect(report.expectedCandidateCount).toBe(report.actionReportCount);
    expect(report.actionReportCount).toBeGreaterThan(0);
    expect(report.coverageStatusCounts.covered).toBeGreaterThan(0);
    expect(report.optionTotals.target).toBeGreaterThan(0);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});

function action(options: {
  actionId?: string;
  side?: LegalAction["side"];
  type?: LegalAction["type"];
  targetRequirements?: LegalAction["targetRequirements"];
}): LegalAction {
  return {
    actionId: options.actionId ?? "run-server",
    side: options.side ?? "runner",
    type: options.type ?? "start_run",
    label: "Run server",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: options.targetRequirements ?? [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function isTargetChoiceRelevantAction(action: LegalAction): boolean {
  return (
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    typeof action.payload?.serverId === "string" ||
    typeof action.payload?.cardId === "string"
  );
}
