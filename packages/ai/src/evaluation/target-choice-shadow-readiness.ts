import type { TargetChoiceShadowReport } from "../decision/target-choice-shadow";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";
import type { TargetChoiceShadowCoverageCase } from "./target-choice-shadow-coverage";

export type TargetChoiceSelectedChoicesReadinessCategory =
  | "ready_for_shadow_only"
  | "ready_for_local_dry_run"
  | "blocked_engine_only"
  | "blocked_hidden_info"
  | "blocked_no_side_safe_options"
  | "blocked_scorecard_unclear";

export type TargetChoiceSelectedChoicesReadinessCase = {
  scenarioId: string;
  actionId: string;
  actionType: TargetChoiceShadowReport["actionType"];
  category: TargetChoiceSelectedChoicesReadinessCategory;
  optionCount: number;
  topOptionId?: string;
  evidence: string[];
};

export type TargetChoiceSelectedChoicesReadinessReport = {
  version: "target-choice-selectedchoices-readiness-v1";
  scope: "target_choice_selectedchoices_readiness_report_only";
  scenarioCount: number;
  actionReportCount: number;
  categoryCounts: Record<TargetChoiceSelectedChoicesReadinessCategory, number>;
  cases: TargetChoiceSelectedChoicesReadinessCase[];
  productiveUseAllowed: false;
  selectedChoicesCreated: false;
  selectedTargetsCreated: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildTargetChoiceSelectedChoicesReadinessReport(
  cases: readonly TargetChoiceShadowCoverageCase[],
): TargetChoiceSelectedChoicesReadinessReport {
  const readinessCases = cases.flatMap((coverageCase) =>
    coverageCase.reports.map((report) =>
      readinessCaseForReport(coverageCase.scenarioId, report),
    ),
  );
  const categoryCounts = emptyCategoryCounts();
  for (const readinessCase of readinessCases) {
    categoryCounts[readinessCase.category] += 1;
  }
  const report: TargetChoiceSelectedChoicesReadinessReport = {
    version: "target-choice-selectedchoices-readiness-v1",
    scope: "target_choice_selectedchoices_readiness_report_only",
    scenarioCount: cases.length,
    actionReportCount: readinessCases.length,
    categoryCounts,
    cases: readinessCases.sort(
      (left, right) =>
        left.scenarioId.localeCompare(right.scenarioId) ||
        left.actionId.localeCompare(right.actionId),
    ),
    productiveUseAllowed: false,
    selectedChoicesCreated: false,
    selectedTargetsCreated: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "target_choice_selectedchoices_readiness:report_only",
      `scenario_count:${cases.length}`,
      `action_report_count:${readinessCases.length}`,
      "selected_choices_created:false",
      "selected_targets_created:false",
    ],
  };
  assertSemanticObjectSideSafe(report, "TargetChoiceSelectedChoicesReadinessReport");
  return report;
}

function readinessCaseForReport(
  scenarioId: string,
  report: TargetChoiceShadowReport,
): TargetChoiceSelectedChoicesReadinessCase {
  const category = categoryForReport(report);
  const topOption = report.scorecard.topOption;
  return {
    scenarioId,
    actionId: report.actionId,
    actionType: report.actionType,
    category,
    optionCount: report.scorecard.optionCount,
    ...(topOption ? { topOptionId: topOption.optionId } : {}),
    evidence: [
      `scenario:${scenarioId}`,
      `action:${report.actionId}`,
      `category:${category}`,
      `coverage_status:${report.scorecard.coverageStatus}`,
      `option_count:${report.scorecard.optionCount}`,
      `engine_only_blocked:${report.scorecard.engineOnlyBlockedCount}`,
      `no_side_safe_options_blocked:${report.scorecard.noSideSafeOptionsBlockedCount}`,
      "productive_use_allowed:false",
    ],
  };
}

function categoryForReport(
  report: TargetChoiceShadowReport,
): TargetChoiceSelectedChoicesReadinessCategory {
  if (report.scorecard.engineOnlyBlockedCount > 0) return "blocked_engine_only";
  if (
    report.blockedRequirements.some((requirement) =>
      requirement.evidence.some((entry) => entry.includes("hidden_info")),
    )
  ) {
    return "blocked_hidden_info";
  }
  if (report.scorecard.noSideSafeOptionsBlockedCount > 0) {
    return "blocked_no_side_safe_options";
  }
  if (report.scorecard.coverageStatus === "covered") {
    const top = report.rankedOptions[0];
    const second = report.rankedOptions[1];
    if (top && (!second || top.score - second.score >= 20)) {
      return "ready_for_local_dry_run";
    }
    return "ready_for_shadow_only";
  }
  if (report.scorecard.coverageStatus === "partial") {
    return "ready_for_shadow_only";
  }
  return "blocked_scorecard_unclear";
}

function emptyCategoryCounts(): Record<
  TargetChoiceSelectedChoicesReadinessCategory,
  number
> {
  return {
    ready_for_shadow_only: 0,
    ready_for_local_dry_run: 0,
    blocked_engine_only: 0,
    blocked_hidden_info: 0,
    blocked_no_side_safe_options: 0,
    blocked_scorecard_unclear: 0,
  };
}
