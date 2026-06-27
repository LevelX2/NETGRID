import type {
  TargetChoiceShadowReport,
  TargetChoiceShadowScorecardV2,
} from "../decision/target-choice-shadow";
import { targetChoiceRecommendationForTargetFit } from "../decision/target-choice-shadow";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export type TargetChoiceShadowCoverageCase = {
  scenarioId: string;
  reports: readonly TargetChoiceShadowReport[];
  expectedCandidateCount?: number;
};

export type TargetChoiceShadowCoverageStatus =
  TargetChoiceShadowScorecardV2["coverageStatus"];

export type TargetChoiceShadowCandidateCoverageReport = {
  version: "target-choice-shadow-candidate-coverage-v1";
  scope: "target_choice_shadow_candidate_coverage_report";
  diagnosticOnly: true;
  scenarioCount: number;
  actionReportCount: number;
  expectedCandidateCount: number | undefined;
  coverageStatusCounts: Record<TargetChoiceShadowCoverageStatus, number>;
  optionTotals: {
    total: number;
    choice: number;
    target: number;
  };
  blockedRequirementTotals: {
    total: number;
    engineOnly: number;
    noSideSafeOptions: number;
  };
  contextSignalTotals: TargetChoiceShadowScorecardV2["contextSignalCounts"];
  targetFitRecommendationCount: number;
  scenariosWithoutReports: string[];
  scenariosWithOnlyEmptyReports: string[];
  scenariosWithBlockedRequirements: string[];
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildTargetChoiceShadowCandidateCoverageReport(
  cases: readonly TargetChoiceShadowCoverageCase[],
): TargetChoiceShadowCandidateCoverageReport {
  const reports = cases.flatMap((coverageCase) => coverageCase.reports);
  const coverageStatusCounts: Record<TargetChoiceShadowCoverageStatus, number> = {
    covered: 0,
    partial: 0,
    blocked: 0,
    empty: 0,
  };
  const optionTotals = {
    total: 0,
    choice: 0,
    target: 0,
  };
  const blockedRequirementTotals = {
    total: 0,
    engineOnly: 0,
    noSideSafeOptions: 0,
  };
  const contextSignalTotals = {
    contextScoredOptions: 0,
    preferredOptions: 0,
    avoidedOptions: 0,
    utilityLinkedOptions: 0,
    opportunityLinkedOptions: 0,
    threatLinkedOptions: 0,
  };
  const targetFitRecommendationCount = reports.filter((report) =>
    targetChoiceRecommendationForTargetFit(report),
  ).length;

  for (const report of reports) {
    const scorecard = report.scorecard;
    coverageStatusCounts[scorecard.coverageStatus] += 1;
    optionTotals.total += scorecard.optionCount;
    optionTotals.choice += scorecard.choiceOptionCount;
    optionTotals.target += scorecard.targetOptionCount;
    blockedRequirementTotals.total += scorecard.blockedRequirementCount;
    blockedRequirementTotals.engineOnly += scorecard.engineOnlyBlockedCount;
    blockedRequirementTotals.noSideSafeOptions +=
      scorecard.noSideSafeOptionsBlockedCount;
    contextSignalTotals.contextScoredOptions +=
      scorecard.contextSignalCounts.contextScoredOptions;
    contextSignalTotals.preferredOptions +=
      scorecard.contextSignalCounts.preferredOptions;
    contextSignalTotals.avoidedOptions +=
      scorecard.contextSignalCounts.avoidedOptions;
    contextSignalTotals.utilityLinkedOptions +=
      scorecard.contextSignalCounts.utilityLinkedOptions;
    contextSignalTotals.opportunityLinkedOptions +=
      scorecard.contextSignalCounts.opportunityLinkedOptions;
    contextSignalTotals.threatLinkedOptions +=
      scorecard.contextSignalCounts.threatLinkedOptions;
  }

  const expectedCandidateCounts = cases
    .map((coverageCase) => coverageCase.expectedCandidateCount)
    .filter((count): count is number => count !== undefined);
  const expectedCandidateCount =
    expectedCandidateCounts.length > 0
      ? expectedCandidateCounts.reduce((sum, count) => sum + count, 0)
      : undefined;
  const report: TargetChoiceShadowCandidateCoverageReport = {
    version: "target-choice-shadow-candidate-coverage-v1",
    scope: "target_choice_shadow_candidate_coverage_report",
    diagnosticOnly: true,
    scenarioCount: cases.length,
    actionReportCount: reports.length,
    expectedCandidateCount,
    coverageStatusCounts,
    optionTotals,
    blockedRequirementTotals,
    contextSignalTotals,
    targetFitRecommendationCount,
    scenariosWithoutReports: sortedScenarioIds(
      cases.filter((coverageCase) => coverageCase.reports.length === 0),
    ),
    scenariosWithOnlyEmptyReports: sortedScenarioIds(
      cases.filter(
        (coverageCase) =>
          coverageCase.reports.length > 0 &&
          coverageCase.reports.every(
            (caseReport) => caseReport.scorecard.coverageStatus === "empty",
          ),
      ),
    ),
    scenariosWithBlockedRequirements: sortedScenarioIds(
      cases.filter((coverageCase) =>
        coverageCase.reports.some(
          (caseReport) => caseReport.scorecard.blockedRequirementCount > 0,
        ),
      ),
    ),
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "target_choice_shadow_coverage:report_only",
      `scenario_count:${cases.length}`,
      `action_report_count:${reports.length}`,
      `covered_report_count:${coverageStatusCounts.covered}`,
      `blocked_report_count:${coverageStatusCounts.blocked}`,
      `target_fit_recommendation_count:${targetFitRecommendationCount}`,
    ],
  };
  assertSemanticObjectSideSafe(report, "TargetChoiceShadowCandidateCoverageReport");
  return report;
}

function sortedScenarioIds(
  cases: readonly TargetChoiceShadowCoverageCase[],
): string[] {
  return cases.map((coverageCase) => coverageCase.scenarioId).sort();
}
