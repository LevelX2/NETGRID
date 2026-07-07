import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS,
  countSelfplayFindingsByDetector,
  countSelfplayFindingsBySeverity,
  detectAiSelfplaySuspiciousDecisions,
  isSelfplayTraceRedactionSafe,
  sortedUniqueSelfplayDetectors,
  summarizeSelfplayActionLimitClusters,
  summarizeSelfplayActionLimitSubclusters,
  type AiSelfplayTraceMiningConfig,
  type AiSelfplayTraceMiningResult,
} from "./selfplay-trace-mining";
import {
  retainActionAlternativesForFindingWindows,
  stripSelfplayActionAlternatives,
} from "./selfplay-trace-facts";
import {
  countPassiveActionWithScoreLineAvailable,
  countUnsafeScoreChosen,
} from "./score-window-counts";
import { SOAK_SEEDS_143 } from "./soak-seed-data";

export type AiSelfplayTraceMiningRunnerDependencies = {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
  summarizeMatchProgressionMetrics: (
    summaries: AiSimulationSummary[],
  ) => AiMatchProgressionMetrics;
};

export function createAiSelfplayTraceMiningRunner(
  dependencies: AiSelfplayTraceMiningRunnerDependencies,
): {
  runAiSelfplayTraceMining: (
    config?: AiSelfplayTraceMiningConfig,
  ) => AiSelfplayTraceMiningResult;
} {
  function runAiSelfplayTraceMining(
    config: AiSelfplayTraceMiningConfig = {},
  ): AiSelfplayTraceMiningResult {
    const seeds =
      config.seeds && config.seeds.length > 0
        ? config.seeds
        : SOAK_SEEDS_143.tuningSeeds.slice(0, 5);
    const maxActions = config.maxActions ?? 100;
    const runnerControllerMode =
      config.runnerControllerMode ?? "current_candidate";
    const corpControllerMode =
      config.corpControllerMode ?? "current_candidate";
    const summaries = seeds.map((seed) =>
      dependencies.simulateAiGame({
        seed,
        maxActions,
        ...(config.agendaPointsToWin !== undefined
          ? { agendaPointsToWin: config.agendaPointsToWin }
          : {}),
        ...(config.runnerDifficulty
          ? { runnerDifficulty: config.runnerDifficulty }
          : {}),
        ...(config.corpDifficulty
          ? { corpDifficulty: config.corpDifficulty }
          : {}),
        ...(config.runnerProfileId
          ? { runnerProfileId: config.runnerProfileId }
          : {}),
        ...(config.corpProfileId
          ? { corpProfileId: config.corpProfileId }
          : {}),
        ...(config.runnerDeck
          ? { runnerDeck: config.runnerDeck }
          : {
              runnerDeckId:
                config.runnerDeckId ?? SOAK_SEEDS_143.league.runnerDeckId,
            }),
        ...(config.corpDeck
          ? { corpDeck: config.corpDeck }
          : {
              corpDeckId:
                config.corpDeckId ?? SOAK_SEEDS_143.league.corpDeckId,
            }),
        ...(config.runnerDeckMetadata
          ? { runnerDeckMetadata: config.runnerDeckMetadata }
          : {}),
        ...(config.corpDeckMetadata
          ? { corpDeckMetadata: config.corpDeckMetadata }
          : {}),
        runnerControllerMode,
        corpControllerMode,
        ...(config.simulationRngSeed
          ? { simulationRngSeed: `${config.simulationRngSeed}:${seed}` }
          : {}),
        ...(config.beliefWorld ? { beliefWorld: config.beliefWorld } : {}),
        ...(config.includeActionAlternativesForFindings === true
          ? { includeActionAlternativesForFindings: true }
          : {}),
        ...(config.opportunitySnapshotRequests
          ? { opportunitySnapshotRequests: config.opportunitySnapshotRequests }
          : {}),
        ...(config.maxAlternativesPerFinding !== undefined
          ? { maxAlternativesPerFinding: config.maxAlternativesPerFinding }
          : {}),
      }),
    );
    const effectiveDetectorIds =
      config.detectorIds ??
      (maxActions > 120
        ? DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS.filter(
            (detector) => detector !== "action_limit_reached",
          )
        : DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS);
    const findings = detectAiSelfplaySuspiciousDecisions(summaries, {
      detectorIds: effectiveDetectorIds,
      longGameActionThreshold:
        config.longGameActionThreshold ?? Math.max(20, Math.floor(maxActions * 0.75)),
    });
    if (config.includeActionAlternativesForFindings === true) {
      retainActionAlternativesForFindingWindows(
        summaries,
        findings,
        config.maxAlternativesPerFinding ?? 5,
        config.opportunitySnapshotRequests ?? [],
      );
    } else {
      stripSelfplayActionAlternatives(summaries);
    }
    const topFindings = findings.slice(0, config.maxFindings ?? 20);
    const enabledDetectors =
      effectiveDetectorIds.length > 0
        ? sortedUniqueSelfplayDetectors(effectiveDetectorIds)
        : DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS;
    const progression =
      dependencies.summarizeMatchProgressionMetrics(summaries);
    const allRedactionSafe = isSelfplayTraceRedactionSafe({
      findings,
      topFindings,
    });
    const aggregate = {
      games: summaries.length,
      decisions: summaries.reduce((sum, summary) => sum + summary.actions, 0),
      findings: findings.length,
      findingsBySeverity: countSelfplayFindingsBySeverity(findings),
      findingsByDetector: countSelfplayFindingsByDetector(findings),
      illegalActions: summaries.reduce(
        (sum, summary) => sum + summary.metrics.illegalActions,
        0,
      ),
      replayFailures: summaries.filter((summary) => !summary.replayOk).length,
      actionLimitReached: summaries.filter(
        (summary) =>
          summary.winner === "action_limit_reached" &&
          summary.actions >= maxActions &&
          summary.errors.length === 0,
      ).length,
      allRedactionSafe,
      redactionSafe: allRedactionSafe,
      averageGameLength: progression.averageActions,
      corpAgendaScores: progression.corpScores,
      runnerAgendaSteals: progression.runnerSteals,
      corpFlatlines: summaries.filter(
        (summary) =>
          summary.winner === "corp" && summary.gameEndReason === "flatline",
      ).length,
      scoreWindowMissed: progression.missedScoreWindows,
      unsafeScoreChosen: countUnsafeScoreChosen(summaries),
      passiveActionWithScoreLineAvailable:
        countPassiveActionWithScoreLineAvailable(summaries),
      actionLimitClusters: summarizeSelfplayActionLimitClusters(summaries),
      actionLimitSubclusters:
        summarizeSelfplayActionLimitSubclusters(summaries),
    };
    return {
      version: "ai-selfplay-trace-mining-v1",
      diagnosticOnly: true,
      noTraining: true,
      noAutofix: true,
      config: {
        seeds,
        maxActions,
        runnerDeckId:
          config.runnerDeck?.id ??
          config.runnerDeckId ??
          SOAK_SEEDS_143.league.runnerDeckId,
        corpDeckId:
          config.corpDeck?.id ??
          config.corpDeckId ??
          SOAK_SEEDS_143.league.corpDeckId,
        runnerControllerMode,
        corpControllerMode,
        enabledDetectors,
        includeActionAlternativesForFindings:
          config.includeActionAlternativesForFindings === true,
        maxAlternativesPerFinding: config.maxAlternativesPerFinding ?? 5,
      },
      summaries,
      findings,
      topFindings,
      aggregate,
    };
  }

  return { runAiSelfplayTraceMining };
}
