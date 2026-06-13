import type {
  DeckDoctrineV2Diagnostic,
  DeckDoctrineV2StrategyDiagnostic,
} from "../deck-doctrine-strategy";
import { synthesizeDoctrineTacticalGoals } from "../decision/doctrine-goal-synthesis";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export type DoctrineGoalCoverageCase = {
  scenarioId: string;
  diagnostic?: DeckDoctrineV2Diagnostic;
};

export type DoctrineGoalCoverageReport = {
  version: "doctrine-goal-coverage-v1";
  scope: "doctrine_goal_coverage_report";
  diagnosticOnly: true;
  scenarioCount: number;
  diagnosticCount: number;
  sideCounts: Record<"runner" | "corp" | "unknown", number>;
  strategyCount: number;
  strategyWithAnchorCount: number;
  synthesizedGoalCount: number;
  goalFamilyCounts: Record<string, number>;
  uncoveredAnchoredStrategies: Array<{
    scenarioId: string;
    side: "runner" | "corp" | "unknown";
    strategyId: string;
    status: DeckDoctrineV2StrategyDiagnostic["status"];
    supportGaps: string[];
  }>;
  scenariosWithoutDiagnostics: string[];
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildDoctrineGoalCoverageReport(
  cases: readonly DoctrineGoalCoverageCase[],
): DoctrineGoalCoverageReport {
  const sideCounts = {
    runner: 0,
    corp: 0,
    unknown: 0,
  };
  const goalFamilyCounts: Record<string, number> = {};
  const uncoveredAnchoredStrategies: DoctrineGoalCoverageReport["uncoveredAnchoredStrategies"] =
    [];
  let diagnosticCount = 0;
  let strategyCount = 0;
  let strategyWithAnchorCount = 0;
  let synthesizedGoalCount = 0;

  for (const coverageCase of cases) {
    const diagnostic = coverageCase.diagnostic;
    if (!diagnostic) continue;
    diagnosticCount += 1;
    sideCounts[diagnostic.side] += 1;
    const goals = synthesizeDoctrineTacticalGoals(diagnostic);
    synthesizedGoalCount += goals.length;
    for (const goal of goals) {
      goalFamilyCounts[goal.family] = (goalFamilyCounts[goal.family] ?? 0) + 1;
    }
    strategyCount += diagnostic.strategyDiagnostics.length;
    for (const strategy of diagnostic.strategyDiagnostics) {
      if (!strategyHasAnchor(strategy)) continue;
      strategyWithAnchorCount += 1;
      if (strategyCoveredByGoals(strategy, goals)) continue;
      uncoveredAnchoredStrategies.push({
        scenarioId: coverageCase.scenarioId,
        side: diagnostic.side,
        strategyId: strategy.strategyId,
        status: strategy.status,
        supportGaps: [...strategy.supportGaps],
      });
    }
  }

  const report: DoctrineGoalCoverageReport = {
    version: "doctrine-goal-coverage-v1",
    scope: "doctrine_goal_coverage_report",
    diagnosticOnly: true,
    scenarioCount: cases.length,
    diagnosticCount,
    sideCounts,
    strategyCount,
    strategyWithAnchorCount,
    synthesizedGoalCount,
    goalFamilyCounts,
    uncoveredAnchoredStrategies: uncoveredAnchoredStrategies.sort(
      (left, right) =>
        left.scenarioId.localeCompare(right.scenarioId) ||
        left.strategyId.localeCompare(right.strategyId),
    ),
    scenariosWithoutDiagnostics: cases
      .filter((coverageCase) => !coverageCase.diagnostic)
      .map((coverageCase) => coverageCase.scenarioId)
      .sort(),
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "doctrine_goal_coverage:report_only",
      `scenario_count:${cases.length}`,
      `diagnostic_count:${diagnosticCount}`,
      `synthesized_goal_count:${synthesizedGoalCount}`,
    ],
  };
  assertSemanticObjectSideSafe(report, "DoctrineGoalCoverageReport");
  return report;
}

function strategyHasAnchor(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return strategy.anchorEvidenceCount > 0 || strategy.anchorScore > 0;
}

function strategyCoveredByGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  goals: readonly TacticalGoalLike[],
): boolean {
  return goals.some((goal) =>
    goal.evidence?.some((entry) => entry === `doctrine_v2:${strategy.strategyId}`),
  );
}
