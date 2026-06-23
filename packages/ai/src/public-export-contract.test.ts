import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as ai from "./index";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("AI public export contract", () => {
  it("keeps established runtime, benchmark and legacy facades exported", () => {
    const publicKeys = Object.keys(ai);
    const expectedExports = [
      "chooseAiAction",
      "chooseCorpAction",
      "chooseRunnerAction",
      "chooseCorpBaselineAction",
      "chooseRunnerBaselineAction",
      "buildAiDecisionInput",
      "buildAiDecisionInputDto",
      "assertAiInputIsSideSafe",
      "runAiSelfplayTraceMining",
      "detectAiSelfplaySuspiciousDecisions",
      "formatAiSelfplayTraceMiningReport",
      "runMatchProgressionBenchmark",
      "runMatchProgressionBenchmarkSuite",
      "formatMatchProgressionBenchmarkReport",
      "formatMatchProgressionBenchmarkSuiteReport",
      "runDoctrineQualityBenchmark",
      "formatDoctrineQualityBenchmarkReport",
      "evaluateDoctrineQualityGate",
      "summarizeActionSemanticCandidateCoverage",
      "formatActionSemanticCandidateCoverageReport",
      "buildDeckStrategyProfile",
      "reconstructBeliefState",
    ];

    for (const exportName of expectedExports) {
      expect(publicKeys).toContain(exportName);
      expect(typeof ai[exportName as keyof typeof ai]).toBe("function");
    }
  });

  it("keeps new play-strength diagnostics and evaluation helpers internal by default", () => {
    const publicKeys = Object.keys(ai);
    const internalExports = [
      "buildSemanticRuntimeDebugPlanContext",
      "semanticRuntimeDebugRankedAlternatives",
      "buildSemanticShadowLeagueDeltaReport",
      "buildSelfplayDecisionSnapshotMiningReport",
      "buildSemanticShadowLeagueReport",
      "buildTargetChoiceShadowCandidateCoverageReport",
      "buildDoctrineGoalCoverageReport",
      "buildLocalDefaultPilotPolicy",
      "evaluateRemoteContestCandidate",
      "buildTargetChoiceShadowReport",
      "buildTargetChoiceSelectedChoicesReadinessReport",
      "buildDoctrineGoalActionFitReport",
      "buildSelfplayDecisionSnapshotPromotionQueue",
      "buildSelfplayPromotedRealEngineCorpusScenarios",
      "recommendedLocalDefaultScopes",
      "buildRuntimeScoreBreakdown",
      "aggregateDoctrineMetricSums",
      "projectKnownRemoteTrashCommitment",
      "projectAccessDecision",
      "projectAccessWindowChoice",
      "rankKnownRemoteAccessTargets",
      "buildRealEngineAccessCorpus",
      "detectRepeatedNoPayoffAccessLoop",
      "buildProteusRandomModelReadinessReport",
      "formatSemanticShadowLeagueDeltaDashboard",
      "formatSelfplayPromotionActivityCandidates",
    ];

    for (const exportName of internalExports) {
      expect(publicKeys).not.toContain(exportName);
    }
  });

  it("does not export evaluation test helpers or diagnostic-only modules through index", () => {
    const source = readFileSync(
      path.join(repoRoot, "packages/ai/src/index.ts"),
      "utf8",
    );
    const forbiddenPublicModules = [
      "./diagnostics/semantic-runtime-debug",
      "./diagnostics/coverage-selection-debug",
      "./diagnostics/semantic-runtime-action-alternatives",
      "./diagnostics/semantic-runtime-ranked-alternatives",
      "./diagnostics/semantic-runtime-decision-debug",
      "./evaluation/semantic-shadow-league-delta",
      "./evaluation/selfplay-decision-snapshot-mining",
      "./evaluation/semantic-shadow-league",
      "./evaluation/target-choice-shadow-coverage",
      "./evaluation/target-choice-shadow-readiness",
      "./evaluation/proteus-random-model-readiness",
      "./evaluation/doctrine-goal-action-fit",
      "./evaluation/doctrine-goal-coverage",
      "./decision/known-remote-access-commitment",
      "./decision/access-decision-projection",
      "./access/access-window-choice",
      "./access/access-target-ranking",
      "./access/access-outcome-memory",
      "./access/remote-access-fingerprint",
      "./evaluation/real-engine-access-corpus",
      "./evaluation/access-loop-detection",
      "./decision/pilot/local-default-pilot-policy",
      "./decision/pilot/remote-contest-candidate",
      "./decision/target-choice-shadow",
      "./runtime/semantic-runtime-score-components",
      "./runtime/semantic-runtime-score-breakdown",
      "./runtime/runner-goal-fit-score",
      "./runtime/legacy-decision-provider",
      "./runtime/reactive-action",
      "./simulation/simulation-metric-aggregation",
      "./reports/shadow-league-report-formatters",
      "./reports/selfplay-promotion-activity-formatters",
    ];

    for (const modulePath of forbiddenPublicModules) {
      expect(source).not.toMatch(
        new RegExp(`export\\s+(?:type\\s+)?(?:\\{|\\*)[\\s\\S]*?from\\s+["']${escapeRegExp(modulePath)}["']`),
      );
    }
    expect(source).not.toMatch(/export\s+(?:type\s+)?(?:\{|\*)[\s\S]*?\.test["']/);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
