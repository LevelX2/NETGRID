import { minNumberOrZero as minDefined } from "../runtime/collection";
import { roundNumber as round } from "../runtime/number-rounding";
import { isRemoteServerTarget } from "../runtime/server-target";
import { summarizeActionLimitEndgameMetrics } from "./action-limit-endgame-metrics";
import { summarizeAdvancedRemoteThreatMetrics } from "./advanced-remote-threat-metrics";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizeBreakerOntologyMetrics } from "./breaker-ontology-metrics";
import { summarizeCentralCloseoutRepeatMetrics } from "./central-closeout-repeat-metrics";
import { summarizeCorpEffectiveRemoteSafetyMetrics } from "./corp-effective-remote-safety-metrics";
import { summarizeCorpEconomyBeforeScoreMetrics } from "./corp-economy-before-score-metrics";
import { summarizeCorpIcePortfolioMetrics } from "./corp-ice-portfolio-metrics";
import { corpScoreTerminalFollowupMetrics } from "./corp-score-terminal-followup-metrics";
import { summarizeCorpUnsafeRemoteScoreConversionMetrics } from "./corp-unsafe-remote-score-conversion-metrics";
import { isMeaningfulBoardProgress } from "./meaningful-board-progress";
import {
  averageFinalAdvanceNumber,
  averageFirstProgressionTurn,
  averageRunnerContestRisk,
  averageTurnsFromFirstAdvanceToScore,
  countFinalAdvancesResolvedBySameTurnCorpScore,
  countFinalAdvancesStolenBeforeCorpScore,
  countRunnerDrawThenDiscardSameTurn,
} from "./match-progression-average-metrics";
import { summarizePlanConversionMetrics } from "./plan-conversion-metrics";
import {
  averageTurnsFromFinalAdvanceToScoreOrSteal,
  countCorpMultiIceInstallOrderFutureEffectDead,
  countCorpMultiIceInstallOrderOptimized,
  isCorpRemoteAdvancementProgress,
  progressionEntriesWithRunTargets,
} from "./progression-action-sequence";
import { summarizeRemoteRoleOntologyMetrics } from "./remote-role-ontology-metrics";
import { summarizeRunnerRepeatRemoteNoTrashMetrics } from "./runner-repeat-remote-no-trash-metrics";
import {
  countRunnerCoverageConversions,
  countRunnerEconomySetupMetric,
  countRunnerPressureWithinOwnActions,
  countRunnerSearchRecoveryNoInstallFollowup,
} from "./runner-setup-metric-counts";
import { summarizeRunnerSetupAttributionMetrics } from "./runner-setup-attribution-types";
import { averageNumber, medianNumber } from "./simulation-metric-aggregation";
import { summarizeStrategicLineMetrics } from "./strategic-line-metrics";
import { summarizeTagPunishWindowMetrics } from "./tag-punish-window-metrics";

export function summarizeMatchProgressionMetrics(
  summaries: AiSimulationSummary[],
): AiMatchProgressionMetrics {
  const games = summaries.length;
  const actionSequence = summaries.flatMap((summary) =>
    progressionEntriesWithRunTargets(summary.actionSequence),
  );
  const runnerRuns = actionSequence.filter(
    (entry) => entry.side === "runner" && entry.actionType === "start_run",
  );
  const successfulRunActionTypeSet = new Set([
    "access_card",
    "steal_agenda",
    "trash_accessed_card",
    "decline_trash",
  ]);
  const successfulRunActions = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      successfulRunActionTypeSet.has(entry.actionType),
  );
  const remoteTrashActions = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "trash_accessed_card" &&
      isRemoteServerTarget(entry.targetServerId),
  ).length;
  const remoteRootInstalls = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "install_card" &&
      isRemoteServerTarget(entry.targetServerId) &&
      entry.installPlacement !== "ice",
  ).length;
  const remoteIceInstalls = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "install_card" &&
      isRemoteServerTarget(entry.targetServerId) &&
      entry.installPlacement === "ice",
  ).length;
  const remoteAdvances = actionSequence.filter((entry) =>
    isCorpRemoteAdvancementProgress(entry),
  ).length;
  const scoreActionsAvailable = actionSequence.filter(
    (entry) => entry.side === "corp" && (entry.scoreActionsAvailable ?? 0) > 0,
  ).length;
  const missedScoreWindows = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      (entry.scoreActionsAvailable ?? 0) > 0 &&
      entry.actionType !== "score_agenda",
  ).length;
  const advancedAgendaSteals = actionSequence.filter(
    (entry) => entry.advancedAgendaStolen === true,
  ).length;
  const advancedAgendaStealsFromRemote = actionSequence.filter(
    (entry) => entry.advancedAgendaStealSource === "remote",
  ).length;
  const advancedAgendaStealsFromCentral = actionSequence.filter(
    (entry) => entry.advancedAgendaStealSource === "central",
  ).length;
  const finalAdvanceEntries = actionSequence.filter(
    (entry) => entry.finalAdvance === true,
  );
  const finalAdvanceActions = finalAdvanceEntries.length;
  const unsafeFinalAdvanceActions = finalAdvanceEntries.filter(
    (entry) => entry.unsafeFinalAdvance === true,
  ).length;
  const protectedFinalAdvanceActions = finalAdvanceEntries.filter(
    (entry) => entry.protectedFinalAdvance === true,
  ).length;
  const protectBeforeAdvanceActions = actionSequence.filter(
    (entry) => entry.protectBeforeAdvance === true,
  ).length;
  const advanceThenScoreSameTurn =
    countFinalAdvancesResolvedBySameTurnCorpScore(summaries);
  const advanceThenRunnerStealBeforeNextCorpScore =
    countFinalAdvancesStolenBeforeCorpScore(summaries);
  const remoteProtectionScoreAtFinalAdvance = averageFinalAdvanceNumber(
    finalAdvanceEntries,
    "remoteProtectionScore",
  );
  const runnerContestRiskAtFinalAdvance =
    averageRunnerContestRisk(finalAdvanceEntries);
  const remoteAgendaAdvancementActions = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("agenda") ||
        entry.targetCardType === "agenda"),
  ).length;
  const advancementActionsOnAgendas = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("agenda") ||
        entry.targetCardType === "agenda"),
  ).length;
  const advancementActionsOnAssets = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("asset") ||
        entry.targetCardType === "asset"),
  ).length;
  const advancementActionsOnUpgrades = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      (entry.advancementTargetTypes?.includes("upgrade") ||
        entry.targetCardType === "upgrade"),
  ).length;
  const advancementActionsOnUnknown = actionSequence.filter(
    (entry) =>
      isCorpRemoteAdvancementProgress(entry) &&
      !entry.advancementTargetTypes?.some((type) => type !== "unknown") &&
      entry.targetCardType !== "agenda" &&
      entry.targetCardType !== "asset" &&
      entry.targetCardType !== "upgrade",
  ).length;
  const rezIceDuringRun = actionSequence.filter(
    (entry) =>
      entry.side === "corp" &&
      entry.actionType === "rez_ice" &&
      typeof entry.timingPoint === "string" &&
      entry.timingPoint.startsWith("run."),
  ).length;
  const runnerSteals = actionSequence.filter(
    (entry) => entry.side === "runner" && entry.actionType === "steal_agenda",
  ).length;
  const centralAgendaStealEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "steal_agenda" &&
      (entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives"),
  );
  const centralAgendaSteals = centralAgendaStealEntries.length;
  const corpScores = actionSequence.filter(
    (entry) => entry.side === "corp" && entry.actionType === "score_agenda",
  ).length;
  const remoteBuildActions =
    remoteRootInstalls + remoteIceInstalls + rezIceDuringRun;
  const pressureTargets = runnerRuns.map(
    (entry) => entry.targetServerId ?? "unknown",
  );
  const totalActions = actionSequence.length || 1;
  const pressureTargetSwitches = pressureTargets.reduce(
    (switches, target, index) => {
      if (index === 0) return switches;
      return target !== pressureTargets[index - 1] ? switches + 1 : switches;
    },
    0,
  );
  const turnsToFirstCorpScore = averageFirstProgressionTurn(
    summaries,
    (entry) => entry.side === "corp" && entry.actionType === "score_agenda",
  );
  const turnsToFirstAgendaSteal = averageFirstProgressionTurn(
    summaries,
    (entry) => entry.side === "runner" && entry.actionType === "steal_agenda",
  );
  const turnsFromFirstAdvanceToScore =
    averageTurnsFromFirstAdvanceToScore(summaries);
  const runnerDecisionActions = actionSequence.filter(
    (entry) => entry.side === "runner",
  );
  const runnerDrawActions = actionSequence.filter(
    (entry) => entry.runnerDrawAction === true,
  ).length;
  const runnerRemoteTrashOpportunities = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashOpportunity === true,
  ).length;
  const runnerRemoteTrashTaken = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashTaken === true,
  ).length;
  const successfulRemoteAccesses = successfulRunActions.filter((entry) =>
    isRemoteServerTarget(entry.targetServerId),
  ).length;
  const remoteAccessesWithTrashableCards = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithTrashableCard === true,
  ).length;
  const remoteAccessesWithRelevantTrashableCards = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithRelevantTrashableCard === true,
  ).length;
  const affordableRelevantRemoteTrashOpportunities = actionSequence.filter(
    (entry) => entry.runnerAffordableRelevantRemoteTrashOpportunity === true,
  ).length;
  const relevantRemoteTrashTaken = actionSequence.filter(
    (entry) => entry.runnerRelevantRemoteTrashTaken === true,
  ).length;
  const skippedAffordableRelevantRemoteTrash = actionSequence.filter(
    (entry) => entry.runnerSkippedAffordableRelevantRemoteTrash === true,
  ).length;
  const repeatRemoteNoTrashMetrics =
    summarizeRunnerRepeatRemoteNoTrashMetrics(summaries);
  const runnerRemoteTrashDecisionWindows = actionSequence.filter(
    (entry) => entry.runnerRemoteAccessWithTrashableCard === true,
  ).length;
  const runnerRemoteTrashLegalActions = actionSequence.reduce(
    (sum, entry) => sum + (entry.runnerRemoteTrashLegalActionCount ?? 0),
    0,
  );
  const runnerRemoteTrashSkipped = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteAccessWithTrashableCard === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedAffordableRelevant =
    skippedAffordableRelevantRemoteTrash;
  const runnerRemoteTrashSkippedAssetEconomy = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteTrashAssetEconomy === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedFinitePoolEconomy = actionSequence.filter(
    (entry) =>
      entry.runnerRemoteTrashFinitePoolEconomy === true &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedWithCorpValueRemaining = actionSequence.filter(
    (entry) =>
      (entry.runnerRemoteTrashCorpValueRemaining ?? 0) > 0 &&
      entry.runnerRemoteTrashTaken !== true,
  ).length;
  const runnerRemoteTrashSkippedDueToReserve = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashFixGateBlockedByReserve === true,
  ).length;
  const runnerRemoteTrashSkippedDueToLowCredits = actionSequence.filter(
    (entry) => entry.runnerRemoteTrashFixGateBlockedByLowCredits === true,
  ).length;
  const runnerRemoteTrashSkippedDueToUnknownHigherPriority =
    actionSequence.filter(
      (entry) =>
        entry.runnerRemoteTrashFixGateEligible === true &&
        entry.runnerRemoteTrashFixGateBlockedByReserve !== true &&
        entry.runnerRemoteTrashFixGateBlockedByLowCredits !== true &&
        entry.runnerRemoteTrashFixGateBlockedByHigherThreat !== true &&
        entry.runnerRemoteTrashTaken !== true,
    ).length;
  const remoteRunOpportunitiesAgainstAdvancedRemote = actionSequence.filter(
    (entry) => entry.runnerRemoteRunOpportunityAgainstAdvancedRemote === true,
  ).length;
  const remoteRunsAgainstAdvancedRemote = actionSequence.filter(
    (entry) => entry.runnerRemoteRunAgainstAdvancedRemote === true,
  ).length;
  const skippedAdvancedRemoteContest = actionSequence.filter(
    (entry) => entry.runnerSkippedAdvancedRemoteContest === true,
  ).length;
  const centralRunWhileRemoteScoreThreatVisible = actionSequence.filter(
    (entry) => entry.runnerCentralRunWhileRemoteScoreThreatVisible === true,
  ).length;
  const remoteContestCreditReserveAfterRun = averageNumber(
    actionSequence
      .map((entry) => entry.runnerRemoteContestCreditReserveAfterRun)
      .filter((value): value is number => typeof value === "number"),
  );
  const advancedRemoteThreatMetrics =
    summarizeAdvancedRemoteThreatMetrics(summaries);
  const centralCloseoutRepeatMetrics =
    summarizeCentralCloseoutRepeatMetrics(summaries);
  const planConversionMetrics = summarizePlanConversionMetrics(summaries);
  const strategicLineMetrics = summarizeStrategicLineMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
  const corpEffectiveRemoteSafetyMetrics =
    summarizeCorpEffectiveRemoteSafetyMetrics(summaries);
  const corpScoreConversionMetrics =
    summarizeCorpUnsafeRemoteScoreConversionMetrics(summaries);
  const corpIcePortfolioMetrics = summarizeCorpIcePortfolioMetrics(summaries);
  const actionLimitEndgameMetrics = summarizeActionLimitEndgameMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
  const tagPunishWindowMetrics = summarizeTagPunishWindowMetrics(summaries);
  const breakerOntologyMetrics = summarizeBreakerOntologyMetrics(summaries);
  const remoteRoleOntologyMetrics =
    summarizeRemoteRoleOntologyMetrics(summaries);
  const runnerSetupAttributionMetrics = summarizeRunnerSetupAttributionMetrics(
    summaries,
    isMeaningfulBoardProgress,
  );
  const runnerHandUseOpportunityWindows = actionSequence.filter(
    (entry) => entry.runnerHandUseOpportunity === true,
  ).length;
  const runnerHandUseActionsTaken = actionSequence.filter(
    (entry) => entry.runnerHandUseActionTaken === true,
  ).length;
  const runnerCreditEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" && typeof entry.runnerCreditsBefore === "number",
  );
  const runnerEndTurnCreditEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "end_turn" &&
      typeof entry.runnerCreditsAfter === "number",
  );
  const runnerCreditReserveTargets = runnerCreditEntries
    .map((entry) => entry.runnerReserveTarget)
    .filter((value): value is number => typeof value === "number");
  const runnerCreditDeltas = runnerCreditEntries
    .map((entry) => entry.runnerCreditDelta)
    .filter((value): value is number => typeof value === "number");
  const runnerKnownPathRunEntries = runnerRuns.filter(
    (entry) => typeof entry.runKnownPathCostAtStart === "number",
  );
  const corpFutureRunIceEntries = actionSequence.filter(
    (entry) => entry.corpFutureRunIceInstalled === true,
  );
  const corpScoreTerminalEntries = actionSequence.filter(
    (entry) => entry.corpScoreTerminalWindow === true,
  );
  const corpEconomyBeforeScoreMetrics =
    summarizeCorpEconomyBeforeScoreMetrics(summaries);
  const hqMemoryEntries = actionSequence.filter(
    (entry) =>
      entry.side === "runner" && typeof entry.hqKnownCards === "number",
  );
  return {
    games,
    actionLimitRate: round(
      summaries.filter((summary) => summary.winner === "action_limit_reached")
        .length / Math.max(games, 1),
    ),
    averageActions: round(
      summaries.reduce((sum, summary) => sum + summary.actions, 0) /
        Math.max(games, 1),
    ),
    averageTurns: round(
      summaries.reduce((sum, summary) => sum + summary.turns, 0) /
        Math.max(games, 1),
    ),
    runnerAgendaPoints: summaries.reduce(
      (sum, summary) => sum + summary.finalAgendaPoints.runner,
      0,
    ),
    corpAgendaPoints: summaries.reduce(
      (sum, summary) => sum + summary.finalAgendaPoints.corp,
      0,
    ),
    runnerSteals,
    corpScores,
    scoreActionsAvailable,
    scoreActionsTaken: corpScores,
    missedScoreWindows,
    scoreActionTakeRate:
      scoreActionsAvailable > 0 ? round(corpScores / scoreActionsAvailable) : 0,
    scoreOrStealActions: runnerSteals + corpScores,
    scoreOrStealActionsPerMatch: round(
      (runnerSteals + corpScores) / Math.max(games, 1),
    ),
    ...planConversionMetrics,
    ...strategicLineMetrics,
    ...corpEffectiveRemoteSafetyMetrics,
    ...corpScoreConversionMetrics,
    ...corpIcePortfolioMetrics,
    ...actionLimitEndgameMetrics,
    ...tagPunishWindowMetrics,
    ...breakerOntologyMetrics,
    ...remoteRoleOntologyMetrics,
    ...runnerSetupAttributionMetrics,
    ...corpEconomyBeforeScoreMetrics,
    corpScoreTerminalWindow: corpScoreTerminalEntries.length,
    corpScoreTerminalWindowScoreLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowScoreLegal === true,
    ).length,
    corpScoreTerminalWindowAdvanceToScoreLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowAdvanceToScoreLegal === true,
    ).length,
    corpScoreTerminalWindowAgendaInstallLegal: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowAgendaInstallLegal === true,
    ).length,
    corpScoreTerminalWindowProtectedRemoteReady:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreTerminalWindowProtectedRemoteReady === true,
      ).length,
    corpScoreTerminalWindowRemoteContestLow: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowRemoteContestLow === true,
    ).length,
    corpScoreTerminalWindowCreditsSufficient: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalWindowCreditsSufficient === true,
    ).length,
    corpScoreTerminalWindowRunnerAccessThreatHigh:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreTerminalWindowRunnerAccessThreatHigh === true,
      ).length,
    corpScoreTerminalScoreTaken: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalScoreTaken === true,
    ).length,
    corpScoreTerminalAdvanceTaken: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalAdvanceTaken === true,
    ).length,
    corpScoreTerminalAgendaInstalled: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalAgendaInstalled === true,
    ).length,
    corpScoreTerminalSkipped: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkipped === true,
    ).length,
    corpScoreTerminalSkippedForProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForProtection === true,
    ).length,
    corpScoreTerminalSkippedForEconomy: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForEconomy === true,
    ).length,
    corpScoreTerminalSkippedForDraw: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForDraw === true,
    ).length,
    corpScoreTerminalSkippedForInstallIce: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForInstallIce === true,
    ).length,
    corpScoreTerminalSkippedForInstallAssetOrUpgrade:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreTerminalSkippedForInstallAssetOrUpgrade === true,
      ).length,
    corpScoreTerminalSkippedForHqProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForHqProtection === true,
    ).length,
    corpScoreTerminalSkippedForRndProtection: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForRndProtection === true,
    ).length,
    corpScoreTerminalSkippedForRemotePortfolio: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreTerminalSkippedForRemotePortfolio === true,
    ).length,
    corpScoreTerminalSkippedForUnknownHigherPriority:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreTerminalSkippedForUnknownHigherPriority === true,
      ).length,
    ...corpScoreTerminalFollowupMetrics(actionSequence),
    corpScoreConversionFixGateEligible: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateEligible === true,
    ).length,
    corpScoreConversionFixGateBlockedByCheapContest:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateBlockedByCheapContest === true,
      ).length,
    corpScoreConversionFixGateBlockedByCredits: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateBlockedByCredits === true,
    ).length,
    corpScoreConversionFixGateBlockedByRunnerContest:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateBlockedByRunnerContest === true,
      ).length,
    corpScoreConversionFixGateBlockedByHqThreat:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreConversionFixGateBlockedByHqThreat === true,
      ).length,
    corpScoreConversionFixGateSuspiciousProtectionLoop:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousProtectionLoop === true,
      ).length,
    corpScoreConversionFixGateSuspiciousEconomyLoop:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousEconomyLoop === true,
      ).length,
    corpScoreConversionFixGateSuspiciousDraw: corpScoreTerminalEntries.filter(
      (entry) => entry.corpScoreConversionFixGateSuspiciousDraw === true,
    ).length,
    corpScoreConversionFixGateSuspiciousRemotePortfolio:
      corpScoreTerminalEntries.filter(
        (entry) =>
          entry.corpScoreConversionFixGateSuspiciousRemotePortfolio === true,
      ).length,
    corpScoreConversionFixGateSuspiciousUnknown:
      corpScoreTerminalEntries.filter(
        (entry) => entry.corpScoreConversionFixGateSuspiciousUnknown === true,
      ).length,
    corpFutureRunIceInstallOpportunities: actionSequence.filter(
      (entry) => entry.corpFutureRunIceInstallOpportunity === true,
    ).length,
    corpFutureRunIceInstalled: corpFutureRunIceEntries.length,
    corpFutureRunIceInstalledAsInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsInnermost === true,
    ).length,
    corpFutureRunIceInstalledAsOutermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsOutermost === true,
    ).length,
    corpFutureRunIceInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithLaterIce === true,
    ).length,
    corpFutureRunIceInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledWithoutLaterIce === true,
    ).length,
    corpFutureRunIceInstalledOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledFirstOnEmptyServer: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledFirstOnEmptyServer === true,
    ).length,
    corpFutureRunIceInstalledAfterInnerIceExists:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpFutureRunIceInstalledAfterInnerIceExists === true,
      ).length,
    corpFutureRunIceInstalledAsDeadEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsDeadEffect === true,
    ).length,
    corpFutureRunIceInstalledAsLiveEffect: corpFutureRunIceEntries.filter(
      (entry) => entry.corpFutureRunIceInstalledAsLiveEffect === true,
    ).length,
    corpNextIceEffectInstalledLast: corpFutureRunIceEntries.filter(
      (entry) => entry.corpNextIceEffectInstalledLast === true,
    ).length,
    corpIceOrderFutureEffectDead: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectDead === true,
    ).length,
    corpIceOrderFutureEffectLive: corpFutureRunIceEntries.filter(
      (entry) => entry.corpIceOrderFutureEffectLive === true,
    ).length,
    corpMultiIceInstallOrderFutureEffectDead:
      countCorpMultiIceInstallOrderFutureEffectDead(actionSequence),
    corpMultiIceInstallOrderOptimized:
      countCorpMultiIceInstallOrderOptimized(actionSequence),
    corpBallAndChainInstalledInnermost: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledInnermost === true,
    ).length,
    corpBallAndChainInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithoutLaterIce === true,
    ).length,
    corpBallAndChainInstalledWithLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpBallAndChainInstalledWithLaterIce === true,
    ).length,
    corpCanisInstalledWithoutLaterIce: corpFutureRunIceEntries.filter(
      (entry) => entry.corpCanisInstalledWithoutLaterIce === true,
    ).length,
    corpBolterOrDataDartsInstalledWithoutNextIce:
      corpFutureRunIceEntries.filter(
        (entry) => entry.corpBolterOrDataDartsInstalledWithoutNextIce === true,
      ).length,
    advancedAgendaSteals,
    advancedAgendaStealsFromRemote,
    advancedAgendaStealsFromCentral,
    finalAdvanceActions,
    unsafeFinalAdvanceActions,
    protectedFinalAdvanceActions,
    protectBeforeAdvanceActions,
    advanceThenScoreSameTurn,
    advanceThenRunnerStealBeforeNextCorpScore,
    remoteProtectionScoreAtFinalAdvance,
    runnerContestRiskAtFinalAdvance,
    centralPressureRuns: runnerRuns.filter(
      (entry) =>
        entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives",
    ).length,
    hqPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "hq")
      .length,
    rdPressureRuns: runnerRuns.filter((entry) => entry.targetServerId === "rd")
      .length,
    archivesPressureRuns: runnerRuns.filter(
      (entry) => entry.targetServerId === "archives",
    ).length,
    remotePressureRuns: runnerRuns.filter((entry) =>
      isRemoteServerTarget(entry.targetServerId),
    ).length,
    successfulCentralRuns: successfulRunActions.filter(
      (entry) =>
        entry.targetServerId === "hq" ||
        entry.targetServerId === "rd" ||
        entry.targetServerId === "archives",
    ).length,
    centralAgendaSteals,
    hqAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "hq",
    ).length,
    rndAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "rd",
    ).length,
    archivesAgendaSteals: centralAgendaStealEntries.filter(
      (entry) => entry.targetServerId === "archives",
    ).length,
    centralStealsPerRun:
      runnerRuns.filter(
        (entry) =>
          entry.targetServerId === "hq" ||
          entry.targetServerId === "rd" ||
          entry.targetServerId === "archives",
      ).length > 0
        ? round(
            centralAgendaSteals /
              runnerRuns.filter(
                (entry) =>
                  entry.targetServerId === "hq" ||
                  entry.targetServerId === "rd" ||
                  entry.targetServerId === "archives",
              ).length,
          )
        : 0,
    centralRunsWithMultiaccess: runnerRuns.filter(
      (entry) => entry.runnerCentralRunWithMultiaccess === true,
    ).length,
    centralRunsWithInterfaceInstalled: runnerRuns.filter(
      (entry) => entry.runnerCentralRunWithInterfaceInstalled === true,
    ).length,
    hqRunsWithHqInterface: runnerRuns.filter(
      (entry) => entry.runnerHqRunWithHqInterface === true,
    ).length,
    rndRunsWithRndInterface: runnerRuns.filter(
      (entry) => entry.runnerRndRunWithRndInterface === true,
    ).length,
    centralRunEventsPlayed: actionSequence.filter(
      (entry) => entry.runnerCentralRunEventPlayed === true,
    ).length,
    centralRunEventsWithGoodTarget: actionSequence.filter(
      (entry) => entry.runnerCentralRunEventWithGoodTarget === true,
    ).length,
    repeatedLowValueCentralRuns: runnerRuns.filter(
      (entry) => entry.runnerRepeatedLowValueCentralRun === true,
    ).length,
    centralRunStreakWithoutValue: Math.max(
      0,
      ...runnerRuns.map(
        (entry) => entry.runnerCentralRunStreakWithoutValue ?? 0,
      ),
    ),
    centralRunStartedWithInsufficientPostRunReserve: runnerRuns.filter(
      (entry) =>
        entry.runnerCentralRunStartedWithInsufficientPostRunReserve === true,
    ).length,
    hqKnownCards: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownCards ?? 0),
    ),
    hqUnknownCards: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqUnknownCards ?? 0),
    ),
    hqKnownFraction: round(
      averageNumber(
        hqMemoryEntries
          .map((entry) => entry.hqKnownFraction)
          .filter((value): value is number => typeof value === "number"),
      ),
    ),
    hqFullyKnown: hqMemoryEntries.filter((entry) => entry.hqFullyKnown === true)
      .length,
    hqKnownAgendaCount: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownAgendaCount ?? 0),
    ),
    hqKnownNonAgendaCount: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownNonAgendaCount ?? 0),
    ),
    hqKnownAgendaPoints: Math.max(
      0,
      ...hqMemoryEntries.map((entry) => entry.hqKnownAgendaPoints ?? 0),
    ),
    hqMemoryInvalidatedByDraw: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByDraw === true,
    ).length,
    hqMemoryInvalidatedByInstall: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByInstall === true,
    ).length,
    hqMemoryInvalidatedByPlay: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByPlay === true,
    ).length,
    hqMemoryInvalidatedByDiscard: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByDiscard === true,
    ).length,
    hqMemoryInvalidatedByShuffleOrReorder: hqMemoryEntries.filter(
      (entry) => entry.hqMemoryInvalidatedByShuffleOrReorder === true,
    ).length,
    hqRunValueFromKnownCards: Math.max(
      0,
      ...runnerRuns.map((entry) => entry.hqRunValueFromKnownCards ?? 0),
    ),
    hqRunValueFromUnknownCards: Math.max(
      0,
      ...runnerRuns.map((entry) => entry.hqRunValueFromUnknownCards ?? 0),
    ),
    hqRunSuppressedBecauseFullyKnownNoAgenda: runnerRuns.filter(
      (entry) => entry.hqRunSuppressedBecauseFullyKnownNoAgenda === true,
    ).length,
    hqRunBoostedBecauseKnownAgenda: runnerRuns.filter(
      (entry) => entry.hqRunBoostedBecauseKnownAgenda === true,
    ).length,
    hqRunBoostedBecauseUnknownCardsRemain: runnerRuns.filter(
      (entry) => entry.hqRunBoostedBecauseUnknownCardsRemain === true,
    ).length,
    hqRunRepeatedWithoutNewHqInfo: runnerRuns.filter(
      (entry) => entry.hqRunRepeatedWithoutNewHqInfo === true,
    ).length,
    knownRndTopCard: actionSequence.filter(
      (entry) => entry.knownRndTopCard === true,
    ).length,
    knownRndTopMovedToHq: actionSequence.filter(
      (entry) => entry.knownRndTopMovedToHq === true,
    ).length,
    knownRndTopInvalidated: actionSequence.filter(
      (entry) => entry.knownRndTopInvalidated === true,
    ).length,
    hqKnownFromRndDraw: hqMemoryEntries.filter(
      (entry) => entry.hqKnownFromRndDraw === true,
    ).length,
    hqRunBoostedByRndToHqAgenda: runnerRuns.filter(
      (entry) => entry.hqRunBoostedByRndToHqAgenda === true,
    ).length,
    hqRunSuppressedByRndToHqNonAgenda: runnerRuns.filter(
      (entry) => entry.hqRunSuppressedByRndToHqNonAgenda === true,
    ).length,
    rndAccesses: actionSequence.filter(
      (entry) =>
        entry.side === "runner" &&
        entry.actionType === "access_card" &&
        entry.targetServerId === "rd",
    ).length,
    rndAccessRemovedTopCard: actionSequence.filter(
      (entry) => entry.rndAccessRemovedTopCard === true,
    ).length,
    rndAccessStoleAgenda: actionSequence.filter(
      (entry) => entry.rndAccessStoleAgenda === true,
    ).length,
    rndAccessTrashedCard: actionSequence.filter(
      (entry) => entry.rndAccessTrashedCard === true,
    ).length,
    rndAccessLeftTopCardUnchanged: actionSequence.filter(
      (entry) => entry.rndAccessLeftTopCardUnchanged === true,
    ).length,
    rndTopFreshenedByRunnerAccess: actionSequence.filter(
      (entry) => entry.rndTopFreshenedByRunnerAccess === true,
    ).length,
    rndKnownTopAdvancedAfterAccess: actionSequence.filter(
      (entry) => entry.rndKnownTopAdvancedAfterAccess === true,
    ).length,
    rndKnownTopSequenceAdvanced: actionSequence.filter(
      (entry) => entry.rndKnownTopSequenceAdvanced === true,
    ).length,
    rndRepeatRunAfterTopRemoved: runnerRuns.filter(
      (entry) => entry.rndRepeatRunAfterTopRemoved === true,
    ).length,
    rndRepeatRunAfterTopUnchanged: runnerRuns.filter(
      (entry) => entry.rndRepeatRunAfterTopUnchanged === true,
    ).length,
    rndRepeatRunBoostedByFreshTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunBoostedByFreshTop === true,
    ).length,
    rndRepeatRunSuppressedBecauseKnownStaleTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunSuppressedBecauseKnownStaleTop === true,
    ).length,
    rndRepeatRunBoostedByKnownAgendaTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunBoostedByKnownAgendaTop === true,
    ).length,
    rndRepeatRunSuppressedBecauseKnownNonAgendaTop: runnerRuns.filter(
      (entry) => entry.rndRepeatRunSuppressedBecauseKnownNonAgendaTop === true,
    ).length,
    rndFreshTopPressureOpportunity: actionSequence.filter(
      (entry) => entry.rndFreshTopPressureOpportunity === true,
    ).length,
    rndFreshTopPressureTaken: runnerRuns.filter(
      (entry) => entry.rndFreshTopPressureTaken === true,
    ).length,
    rndFreshTopPressureSkipped: actionSequence.filter(
      (entry) => entry.rndFreshTopPressureSkipped === true,
    ).length,
    rndStaleTopRepeatMistake: runnerRuns.filter(
      (entry) => entry.rndStaleTopRepeatMistake === true,
    ).length,
    rndAccessNoValueRepeatStale: runnerRuns.filter(
      (entry) => entry.rndAccessNoValueRepeatStale === true,
    ).length,
    rndCloseoutOpportunityAfterTopRemoved: actionSequence.filter(
      (entry) => entry.rndCloseoutOpportunityAfterTopRemoved === true,
    ).length,
    knownRemoteCards: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteCards ?? 0),
    ),
    knownRemoteAgendas: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteAgendas ?? 0),
    ),
    knownRemoteTrashableCards: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownRemoteTrashableCards ?? 0),
    ),
    remoteMemoryRetainedAfterAccess: actionSequence.filter(
      (entry) => entry.remoteMemoryRetainedAfterAccess === true,
    ).length,
    remoteMemoryInvalidatedByInstallOrMove: actionSequence.filter(
      (entry) => entry.remoteMemoryInvalidatedByInstallOrMove === true,
    ).length,
    remoteRunBoostedByKnownRemoteAgenda: runnerRuns.filter(
      (entry) => entry.remoteRunBoostedByKnownRemoteAgenda === true,
    ).length,
    remoteRunSuppressedByKnownLowValueRemote: runnerRuns.filter(
      (entry) => entry.remoteRunSuppressedByKnownLowValueRemote === true,
    ).length,
    remoteTrashBoostedByKnownRemoteTrashable: runnerRuns.filter(
      (entry) => entry.remoteTrashBoostedByKnownRemoteTrashable === true,
    ).length,
    knownUnrezzedIceFromExpose: Math.max(
      0,
      ...actionSequence.map((entry) => entry.knownUnrezzedIceFromExpose ?? 0),
    ),
    knownUnrezzedIceRetained: actionSequence.filter(
      (entry) => entry.knownUnrezzedIceRetained === true,
    ).length,
    knownUnrezzedIceInvalidated: actionSequence.filter(
      (entry) => entry.knownUnrezzedIceInvalidated === true,
    ).length,
    runCostAdjustedByKnownUnrezzedIce: Math.max(
      0,
      ...runnerRuns.map(
        (entry) => entry.runCostAdjustedByKnownUnrezzedIce ?? 0,
      ),
    ),
    jackOutInfluencedByKnownUnrezzedIce: actionSequence.filter(
      (entry) => entry.jackOutInfluencedByKnownUnrezzedIce === true,
    ).length,
    rigPlanInfluencedByKnownUnrezzedIce: actionSequence.filter(
      (entry) => entry.rigPlanInfluencedByKnownUnrezzedIce === true,
    ).length,
    runnerMissingBreakerCoverageByType: Math.max(
      0,
      ...actionSequence.map(
        (entry) => entry.runnerMissingBreakerCoverageByType ?? 0,
      ),
    ),
    runnerVisibleIceBlockingByType: Math.max(
      0,
      ...actionSequence.map(
        (entry) => entry.runnerVisibleIceBlockingByType ?? 0,
      ),
    ),
    runnerKnownIceBlockingByType: Math.max(
      0,
      ...actionSequence.map((entry) => entry.runnerKnownIceBlockingByType ?? 0),
    ),
    runnerPathBlockedByMissingCoverage: actionSequence.filter(
      (entry) => entry.runnerPathBlockedByMissingCoverage === true,
    ).length,
    runnerInstallableBreakerForBlockedPath: actionSequence.filter(
      (entry) => entry.runnerInstallableBreakerForBlockedPath === true,
    ).length,
    runnerSearchCardAvailableForMissingBreaker: actionSequence.filter(
      (entry) => entry.runnerSearchCardAvailableForMissingBreaker === true,
    ).length,
    runnerSearchCardUsedForMissingBreaker: actionSequence.filter(
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
    ).length,
    runnerSearchCardAvailableButUnused: actionSequence.filter(
      (entry) => entry.runnerSearchCardAvailableButUnused === true,
    ).length,
    runnerTutorConvertedToBreakerInstall: actionSequence.filter(
      (entry) => entry.runnerTutorConvertedToBreakerInstall === true,
    ).length,
    runnerTutorConvertedToUsefulRun: countRunnerCoverageConversions(
      actionSequence,
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
      isMeaningfulBoardProgress,
    ),
    runnerBreakerInstallConvertedToUsefulRun: countRunnerCoverageConversions(
      actionSequence,
      (entry) => entry.runnerCoverageImproved === true,
      isMeaningfulBoardProgress,
    ),
    runnerCoverageImproved: actionSequence.filter(
      (entry) => entry.runnerCoverageImproved === true,
    ).length,
    runnerCoverageReadyButNoPressure: actionSequence.filter(
      (entry) => entry.runnerCoverageReadyButNoPressure === true,
    ).length,
    runnerSetupContinuedAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerSetupContinuedAfterCoverageReady === true,
    ).length,
    runnerPressureReadyWindows: actionSequence.filter(
      (entry) => entry.runnerPressureReadyWindow === true,
    ).length,
    runnerPressureReadyTrue: actionSequence.filter(
      (entry) => entry.runnerPressureReadyTrue === true,
    ).length,
    runnerPressureReadyFalsePositive: actionSequence.filter(
      (entry) => entry.runnerPressureReadyFalsePositive === true,
    ).length,
    runnerPressureReadyByTargetHq: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetHq === true,
    ).length,
    runnerPressureReadyByTargetRnd: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetRnd === true,
    ).length,
    runnerPressureReadyByTargetArchives: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetArchives === true,
    ).length,
    runnerPressureReadyByTargetRemote: actionSequence.filter(
      (entry) => entry.runnerPressureReadyByTargetRemote === true,
    ).length,
    runnerSetupContinuedAfterPressureReady: actionSequence.filter(
      (entry) => entry.runnerSetupContinuedAfterPressureReady === true,
    ).length,
    runnerPressureTakenAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerPressureTakenAfterCoverageReady === true,
    ).length,
    runnerPressureSkippedAfterCoverageReady: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedAfterCoverageReady === true,
    ).length,
    runnerPressureSkippedInsufficientCredits: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "insufficient_credits",
    ).length,
    runnerPressureSkippedMissingPostRunReserve: actionSequence.filter(
      (entry) =>
        entry.runnerPressureSkippedReason === "missing_post_run_reserve",
    ).length,
    runnerPressureSkippedStaleCentral: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "stale_central",
    ).length,
    runnerPressureSkippedRemoteTooDangerous: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "remote_too_dangerous",
    ).length,
    runnerPressureSkippedNoValuableTarget: actionSequence.filter(
      (entry) => entry.runnerPressureSkippedReason === "no_valuable_target",
    ).length,
    runnerPressureSkippedBetterImmediateAction: actionSequence.filter(
      (entry) =>
        entry.runnerPressureSkippedReason === "better_immediate_action",
    ).length,
    runnerCoverageImprovedThenPressureWithin1:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        1,
      ),
    runnerCoverageImprovedThenPressureWithin2:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        2,
      ),
    runnerCoverageImprovedThenPressureWithin3:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerCoverageImproved === true,
        3,
      ),
    runnerEconomyReserveReachedThenPressureWithin2:
      countRunnerPressureWithinOwnActions(
        actionSequence,
        (entry) => entry.runnerEconomyActionTaken === true,
        2,
      ),
    runnerSearchTutorThenPressureWithin3: countRunnerPressureWithinOwnActions(
      actionSequence,
      (entry) => entry.runnerSearchCardUsedForMissingBreaker === true,
      3,
    ),
    runnerSetupLoopAfterPressureReady: actionSequence.filter(
      (entry) => entry.runnerSetupLoopAfterPressureReady === true,
    ).length,
    runnerPhaseExitBlockedByCost: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByCost === true,
    ).length,
    runnerPhaseExitBlockedByCoverage: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByCoverage === true,
    ).length,
    runnerPhaseExitBlockedByTargetValue: actionSequence.filter(
      (entry) => entry.runnerPhaseExitBlockedByTargetValue === true,
    ).length,
    runnerProbeRevealedIceThenSearchedBreaker: actionSequence.filter(
      (entry) => entry.runnerProbeRevealedIceThenSearchedBreaker === true,
    ).length,
    runnerProbeRevealedIceButDidNotReact: actionSequence.filter(
      (entry) => entry.runnerProbeRevealedIceButDidNotReact === true,
    ).length,
    runnerSetupBreakerSearchStalled: actionSequence.filter(
      (entry) => entry.runnerSetupBreakerSearchStalled === true,
    ).length,
    runnerSetupEconomyStalled: actionSequence.filter(
      (entry) => entry.runnerSetupEconomyStalled === true,
    ).length,
    runnerPhaseExitToPressure: actionSequence.filter(
      (entry) => entry.runnerPhaseExitToPressure === true,
    ).length,
    ...centralCloseoutRepeatMetrics,
    interfaceInstallOpportunities: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstallOpportunity === true,
    ).length,
    interfaceInstallsTaken: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstallTaken === true,
    ).length,
    interfaceInstalledButUnusedTurns: actionSequence.filter(
      (entry) => entry.runnerInterfaceInstalledButUnusedTurn === true,
    ).length,
    successfulRemoteRuns: successfulRunActions.filter((entry) =>
      isRemoteServerTarget(entry.targetServerId),
    ).length,
    successfulRemoteAccesses,
    remoteTrashActions,
    remoteAccessesWithTrashableCards,
    remoteAccessesWithRelevantTrashableCards,
    affordableRelevantRemoteTrashOpportunities,
    relevantRemoteTrashTaken,
    relevantRemoteTrashTakeRate:
      affordableRelevantRemoteTrashOpportunities > 0
        ? round(
            relevantRemoteTrashTaken /
              affordableRelevantRemoteTrashOpportunities,
          )
        : 0,
    skippedAffordableRelevantRemoteTrash,
    remoteTrashTargetsAssetNode: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "asset_node",
    ).length,
    remoteTrashTargetsUpgrade: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "upgrade",
    ).length,
    remoteTrashTargetsIce: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "ice",
    ).length,
    remoteTrashTargetsUnknown: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashTargetType === "unknown",
    ).length,
    remoteTrashRoleEconomy: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "economy",
    ).length,
    remoteTrashRoleScoringProtection: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "scoring_protection",
    ).length,
    remoteTrashRoleRunTax: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "run_tax",
    ).length,
    remoteTrashRoleRemoteCapacity: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "remote_capacity",
    ).length,
    remoteTrashRoleTagPunish: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "tag_punish",
    ).length,
    remoteTrashRoleAmbush: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "ambush",
    ).length,
    remoteTrashRoleLowValue: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashRole === "low_value",
    ).length,
    remoteTrashDeclined: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashDeclined === true,
    ).length,
    remoteTrashCostTotal: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerRemoteTrashCost ?? 0),
      0,
    ),
    expensiveRemoteTrashOpportunities: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashOpportunity === true,
    ).length,
    expensiveRemoteTrashTaken: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashTaken === true,
    ).length,
    expensiveRemoteTrashDeclined: actionSequence.filter(
      (entry) => entry.runnerExpensiveRemoteTrashDeclined === true,
    ).length,
    highImpactRemoteTrashTaken: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashTaken === true,
    ).length,
    highImpactRemoteTrashDeferredByBudget: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashDeferredByBudget === true,
    ).length,
    highImpactRemoteTrashSkippedNoThreat: actionSequence.filter(
      (entry) => entry.runnerHighImpactRemoteTrashSkippedNoThreat === true,
    ).length,
    lowValueRemoteTrashSkipped: actionSequence.filter(
      (entry) => entry.runnerLowValueRemoteTrashSkipped === true,
    ).length,
    remoteTrashSpentEarlyGame: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashSpentEarlyGame === true,
    ).length,
    runnerCreditsAfterRemoteTrash: minDefined(
      actionSequence
        .map((entry) => entry.runnerCreditsAfterRemoteTrash)
        .filter((value): value is number => typeof value === "number"),
    ),
    remoteTrashDroppedBelowReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashDroppedBelowReserve === true,
    ).length,
    remoteTrashPreservedReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashPreservedReserve === true,
    ).length,
    remoteTrashProtectedScoreThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashProtectedScoreThreat === true,
    ).length,
    remoteTrashWithoutImmediateThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashWithoutImmediateThreat === true,
    ).length,
    remoteTrashCostBucket0To1: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "0_1",
    ).length,
    remoteTrashCostBucket2To3: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "2_3",
    ).length,
    remoteTrashCostBucket4To5: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "4_5",
    ).length,
    remoteTrashCostBucket6Plus: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashCostBucket === "6_plus",
    ).length,
    dedicatedTrashCreditsUsed: actionSequence.reduce(
      (sum, entry) => sum + (entry.dedicatedTrashCreditsUsed ?? 0),
      0,
    ),
    generalCreditsSpentOnTrash: actionSequence.reduce(
      (sum, entry) => sum + (entry.generalCreditsSpentOnTrash ?? 0),
      0,
    ),
    trashDecisionLeftRunnerUnableToContest: actionSequence.filter(
      (entry) => entry.trashDecisionLeftRunnerUnableToContest === true,
    ).length,
    remoteRunOpportunitiesAgainstAdvancedRemote,
    remoteRunsAgainstAdvancedRemote,
    skippedAdvancedRemoteContest,
    centralRunWhileRemoteScoreThreatVisible,
    remoteContestCreditReserveAfterRun,
    uniqueAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.uniqueAdvancedRemoteThreats,
    contestableAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.contestableAdvancedRemoteThreats,
    advancedRemoteThreatsContested:
      advancedRemoteThreatMetrics.advancedRemoteThreatsContested,
    advancedRemoteThreatContestRate:
      advancedRemoteThreatMetrics.advancedRemoteThreatContestRate,
    skippedContestableAdvancedRemoteThreats:
      advancedRemoteThreatMetrics.skippedContestableAdvancedRemoteThreats,
    centralRunInsteadOfContestableAdvancedRemote:
      advancedRemoteThreatMetrics.centralRunInsteadOfContestableAdvancedRemote,
    centralRunInsteadWasJustified:
      advancedRemoteThreatMetrics.centralRunInsteadWasJustified,
    centralRunBurnedRemoteContestReserve:
      advancedRemoteThreatMetrics.centralRunBurnedRemoteContestReserve,
    remoteContestBlockedByCredits:
      advancedRemoteThreatMetrics.remoteContestBlockedByCredits,
    remoteContestBlockedByPostRunReserve:
      advancedRemoteThreatMetrics.remoteContestBlockedByPostRunReserve,
    remoteContestBlockedByBreakerCoverage:
      advancedRemoteThreatMetrics.remoteContestBlockedByBreakerCoverage,
    remoteContestBlockedByKnownIceCost:
      advancedRemoteThreatMetrics.remoteContestBlockedByKnownIceCost,
    remoteContestDeclinedAsBaitOrLowValue:
      advancedRemoteThreatMetrics.remoteContestDeclinedAsBaitOrLowValue,
    repeatedCentralRunsWhileSameRemoteThreat:
      advancedRemoteThreatMetrics.repeatedCentralRunsWhileSameRemoteThreat,
    remoteRunStartedWithInsufficientPostRunReserve:
      advancedRemoteThreatMetrics.remoteRunStartedWithInsufficientPostRunReserve,
    remoteRunStartedWithSufficientPostRunReserve:
      advancedRemoteThreatMetrics.remoteRunStartedWithSufficientPostRunReserve,
    turnsFromRemoteThreatCreatedToContest:
      advancedRemoteThreatMetrics.turnsFromRemoteThreatCreatedToContest,
    turnsFromRemoteThreatCreatedToScoreOrSteal:
      advancedRemoteThreatMetrics.turnsFromRemoteThreatCreatedToScoreOrSteal,
    remoteContestActions:
      runnerRuns.filter((entry) => isRemoteServerTarget(entry.targetServerId))
        .length + remoteTrashActions,
    pressureTargetSwitches,
    distinctPressureTargets: new Set(pressureTargets).size,
    remoteInstalls: remoteRootInstalls + remoteIceInstalls,
    remoteRootInstalls,
    remoteIceInstalls,
    remoteAdvances,
    advancedAgendaInstalledInRemote: remoteAgendaAdvancementActions,
    advancementActionsOnAgendas,
    advancementActionsOnAssets,
    advancementActionsOnUpgrades,
    advancementActionsOnUnknown,
    remoteBuildActions,
    remoteAdvanceActions: remoteAdvances,
    scoreWindowActions: corpScores,
    scoringRemoteDevelopmentActions:
      remoteRootInstalls + remoteIceInstalls + remoteAdvances + rezIceDuringRun,
    rezIceDuringRun,
    scoreWindows: corpScores,
    turnsToFirstCorpScore,
    turnsToFirstAgendaSteal,
    turnsFromFirstAdvanceToScore,
    turnsFromFinalAdvanceToScoreOrSteal:
      averageTurnsFromFinalAdvanceToScoreOrSteal(summaries),
    runnerDrawActions,
    runnerDrawActionShare: round(
      runnerDrawActions / Math.max(runnerDecisionActions.length, 1),
    ),
    clickDrawActions: actionSequence.filter(
      (entry) => entry.runnerClickDrawAction === true,
    ).length,
    cardEffectDrawActions: actionSequence.filter(
      (entry) => entry.runnerCardEffectDrawAction === true,
    ).length,
    drawWhileHoldingPlayableEconomy: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingPlayableEconomy === true,
    ).length,
    drawWhileHoldingInstallableBreaker: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingInstallableBreaker === true,
    ).length,
    drawWhileHoldingRunnablePressureCard: actionSequence.filter(
      (entry) => entry.runnerDrawWhileHoldingRunnablePressureCard === true,
    ).length,
    drawWhileRemoteTrashAvailable: actionSequence.filter(
      (entry) => entry.runnerDrawWhileRemoteTrashAvailable === true,
    ).length,
    drawThenDiscardSameTurn: countRunnerDrawThenDiscardSameTurn(summaries),
    discardedPlayableEconomy: actionSequence.filter(
      (entry) => entry.runnerDiscardedPlayableEconomy === true,
    ).length,
    discardedInstallableBreaker: actionSequence.filter(
      (entry) => entry.runnerDiscardedInstallableBreaker === true,
    ).length,
    discardedRunPressureCard: actionSequence.filter(
      (entry) => entry.runnerDiscardedRunPressureCard === true,
    ).length,
    runnerInstallActions: actionSequence.filter(
      (entry) => entry.runnerInstallAction === true,
    ).length,
    runnerDuplicateInstallActions: actionSequence.filter(
      (entry) => entry.runnerDuplicateInstallAction === true,
    ).length,
    runnerLowValueDuplicateInstallActions: actionSequence.filter(
      (entry) => entry.runnerLowValueDuplicateInstallAction === true,
    ).length,
    runnerJunkyardBbsDuplicateInstalls: actionSequence.filter(
      (entry) => entry.runnerJunkyardBbsDuplicateInstall === true,
    ).length,
    runnerEconomyActionsTaken: actionSequence.filter(
      (entry) => entry.runnerEconomyActionTaken === true,
    ).length,
    runnerEconomyDecisionWindows: actionSequence.filter(
      (entry) => entry.runnerEconomyDecisionWindow === true,
    ).length,
    runnerLegalEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalEconomyActions ?? 0),
      0,
    ),
    runnerLegalBurstEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalBurstEconomyActions ?? 0),
      0,
    ),
    runnerLegalActionEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalActionEconomyActions ?? 0),
      0,
    ),
    runnerLegalFinitePoolEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalFinitePoolEconomyActions ?? 0),
      0,
    ),
    runnerLegalLoanDebtEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalLoanDebtEconomyActions ?? 0),
      0,
    ),
    runnerLegalRecurringEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalRecurringEconomyActions ?? 0),
      0,
    ),
    runnerLegalResourceEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalResourceEconomyActions ?? 0),
      0,
    ),
    runnerLegalHardwareEconomyActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalHardwareEconomyActions ?? 0),
      0,
    ),
    runnerEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTaken",
    ),
    runnerEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkipped",
    ),
    runnerEconomySkippedWhileLowCredits: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedWhileLowCredits",
    ),
    runnerEconomySkippedWhileKnownUnaffordablePath:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomySkippedWhileKnownUnaffordablePath",
      ),
    runnerEconomySkippedForPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForPressure",
    ),
    runnerEconomySkippedForRemoteContest: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForRemoteContest",
    ),
    runnerEconomySkippedForSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForSetup",
    ),
    runnerEconomySkippedForDraw: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForDraw",
    ),
    runnerEconomySkippedForRun: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForRun",
    ),
    runnerEconomySkippedForInstallBreaker: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForInstallBreaker",
    ),
    runnerEconomySkippedForTrash: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForTrash",
    ),
    runnerEconomySkippedForEndTurn: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForEndTurn",
    ),
    runnerEconomySkippedForUnknownHigherPriority: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedForUnknownHigherPriority",
    ),
    runnerLowCreditDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerLowCreditDecisionWindow",
    ),
    runnerCreditStarvedWithLegalEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedWithLegalEconomy",
    ),
    runnerCreditStarvedEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedEconomyTaken",
    ),
    runnerCreditStarvedEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerCreditStarvedEconomySkipped",
    ),
    runnerKnownUnaffordablePathWithLegalEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerKnownUnaffordablePathWithLegalEconomy",
    ),
    runnerEconomyTakenToReachRunReserve: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTakenToReachRunReserve",
    ),
    runnerEconomyTakenButStillBelowReserve: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyTakenButStillBelowReserve",
    ),
    runnerEconomySkippedThenUnaffordableRun: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomySkippedThenUnaffordableRun",
    ),
    runnerRunStartedBelowKnownPathCost: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRunStartedBelowKnownPathCost",
    ),
    runnerRunStartedAfterSkippingEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRunStartedAfterSkippingEconomy",
    ),
    runnerEconomyChosenOverFreshCentralPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverFreshCentralPressure",
    ),
    runnerEconomyChosenOverRemoteContest: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverRemoteContest",
    ),
    runnerEconomyChosenOverBreakerInstall: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverBreakerInstall",
    ),
    runnerEconomyChosenOverCriticalSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverCriticalSetup",
    ),
    runnerEconomyChosenOverRelevantTrash: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenOverRelevantTrash",
    ),
    runnerEconomyChosenWhileRich: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenWhileRich",
    ),
    runnerEconomyChosenWhilePressureReady: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenWhilePressureReady",
    ),
    runnerEconomyChosenAsReserveSetup: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChosenAsReserveSetup",
    ),
    runnerEconomyChoicePlausible: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChoicePlausible",
    ),
    runnerEconomyChoiceSuspicious: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyChoiceSuspicious",
    ),
    runnerFinitePoolEconomySeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomySeen",
    ),
    runnerFinitePoolEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomyTaken",
    ),
    runnerFinitePoolEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerFinitePoolEconomySkipped",
    ),
    runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted",
      ),
    runnerDebtEconomySeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomySeen",
    ),
    runnerDebtEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomyTaken",
    ),
    runnerDebtEconomySkipped: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomySkipped",
    ),
    runnerDebtEconomyTakenWithoutNeed: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDebtEconomyTakenWithoutNeed",
    ),
    runnerEconomyWithDownsideSeen: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyWithDownsideSeen",
    ),
    runnerEconomyWithDownsideTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyWithDownsideTaken",
    ),
    runnerDelayedPenaltyEconomyTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerDelayedPenaltyEconomyTaken",
    ),
    runnerMemoryBottleneckDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerMemoryBottleneckDecisionWindow",
    ),
    runnerHandSizeBottleneckDecisionWindows: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeBottleneckDecisionWindow",
    ),
    runnerLegalMemoryHardwareActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalMemoryHardwareActions ?? 0),
      0,
    ),
    runnerLegalHandSizeActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalHandSizeActions ?? 0),
      0,
    ),
    runnerMemoryHardwareTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerMemoryHardwareTaken",
    ),
    runnerHandSizeSupportTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeSupportTaken",
    ),
    runnerMemorySupportSkippedWhileGripHasPrograms:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerMemorySupportSkippedWhileGripHasPrograms",
      ),
    runnerHandSizeSupportSkippedWhileDamageRiskVisible:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerHandSizeSupportSkippedWhileDamageRiskVisible",
      ),
    runnerHardwareSetupChosenOverEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHardwareSetupChosenOverEconomy",
    ),
    runnerHardwareSetupChosenOverPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHardwareSetupChosenOverPressure",
    ),
    runnerHandSizeFactUsedForDiagnosis: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerHandSizeFactUsedForDiagnosis",
    ),
    runnerLegalSearchActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalSearchActions ?? 0),
      0,
    ),
    runnerLegalRecoveryActions: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerLegalRecoveryActions ?? 0),
      0,
    ),
    runnerSearchTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchTaken",
    ),
    runnerRecoveryTaken: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRecoveryTaken",
    ),
    runnerSearchSkippedWhileMissingBreakerCoverage:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerSearchSkippedWhileMissingBreakerCoverage",
      ),
    runnerRecoverySkippedWhileMissingBreakerCoverage:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerRecoverySkippedWhileMissingBreakerCoverage",
      ),
    runnerSearchTakenForBreakerCoverage: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchTakenForBreakerCoverage",
    ),
    runnerRecoveryTakenForBreakerCoverage: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerRecoveryTakenForBreakerCoverage",
    ),
    runnerSearchOrRecoveryWindowWithNoInstallFollowup:
      countRunnerSearchRecoveryNoInstallFollowup(actionSequence),
    runnerSearchRecoveryChosenOverEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchRecoveryChosenOverEconomy",
    ),
    runnerSearchRecoveryChosenOverPressure: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSearchRecoveryChosenOverPressure",
    ),
    runnerEconomyFixGateEligibleStarvedSkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyFixGateEligibleStarvedSkip",
    ),
    runnerEconomyFixGateSuspiciousRichEconomy: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerEconomyFixGateSuspiciousRichEconomy",
    ),
    runnerEconomyFixGateSuspiciousEconomyOverPressure:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousEconomyOverPressure",
      ),
    runnerEconomyFixGateSuspiciousEconomyOverRemoteContest:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousEconomyOverRemoteContest",
      ),
    runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed:
      countRunnerEconomySetupMetric(
        actionSequence,
        "runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed",
      ),
    runnerSetupFixGateEligibleMemorySkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSetupFixGateEligibleMemorySkip",
    ),
    runnerSetupFixGateEligibleSearchRecoverySkip: countRunnerEconomySetupMetric(
      actionSequence,
      "runnerSetupFixGateEligibleSearchRecoverySkip",
    ),
    runnerRigInstallActions: actionSequence.filter(
      (entry) => entry.runnerRigInstallAction === true,
    ).length,
    runnerRemoteTrashOpportunities,
    runnerRemoteTrashTaken,
    runnerRemoteTrashDecisionWindows,
    runnerRemoteTrashLegalActions,
    runnerRemoteTrashSkipped,
    runnerRemoteTrashSkippedAffordableRelevant,
    runnerRemoteTrashSkippedAssetEconomy,
    runnerRemoteTrashSkippedFinitePoolEconomy,
    runnerRemoteTrashSkippedWithCorpValueRemaining,
    runnerRemoteTrashSkippedDueToReserve,
    runnerRemoteTrashSkippedDueToLowCredits,
    runnerRemoteTrashSkippedDueToUnknownHigherPriority,
    runnerBbsWhisperingCampaignAccessed: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignAccessed === true,
    ).length,
    runnerBbsWhisperingCampaignTrashLegal: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashLegal === true,
    ).length,
    runnerBbsWhisperingCampaignTrashTaken: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashTaken === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkipped: actionSequence.filter(
      (entry) => entry.runnerBbsWhisperingCampaignTrashSkipped === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkippedAffordable: actionSequence.filter(
      (entry) =>
        entry.runnerBbsWhisperingCampaignTrashSkippedAffordable === true,
    ).length,
    runnerBbsWhisperingCampaignTrashSkippedWithCreditsRemaining:
      actionSequence.filter(
        (entry) =>
          entry.runnerBbsWhisperingCampaignTrashSkipped === true &&
          (entry.runnerRemoteTrashCorpValueRemaining ?? 0) > 0,
      ).length,
    runnerFinitePoolAssetAccessed: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetAccessed === true,
    ).length,
    runnerFinitePoolAssetTrashLegal: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashLegal === true,
    ).length,
    runnerFinitePoolAssetTrashTaken: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashTaken === true,
    ).length,
    runnerFinitePoolAssetTrashSkippedAffordable: actionSequence.filter(
      (entry) => entry.runnerFinitePoolAssetTrashSkippedAffordable === true,
    ).length,
    ...repeatRemoteNoTrashMetrics,
    runnerRemoteTrashFixGateEligible: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateEligible === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByReserve: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByReserve === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByLowCredits: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByLowCredits === true,
    ).length,
    runnerRemoteTrashFixGateBlockedByHigherThreat: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateBlockedByHigherThreat === true,
    ).length,
    runnerRemoteTrashFixGateSuspicious: actionSequence.filter(
      (entry) => entry.runnerRemoteTrashFixGateSuspicious === true,
    ).length,
    runnerRepeatRemoteNoTrashFixGateSuspicious:
      repeatRemoteNoTrashMetrics.runnerRepeatRemoteNoTrashFixGateSuspicious,
    handUseRate:
      runnerHandUseOpportunityWindows > 0
        ? round(runnerHandUseActionsTaken / runnerHandUseOpportunityWindows)
        : 0,
    runnerAverageCredits: averageNumber(
      runnerCreditEntries.map((entry) => entry.runnerCreditsBefore ?? 0),
    ),
    runnerMedianCredits: medianNumber(
      runnerCreditEntries.map((entry) => entry.runnerCreditsBefore ?? 0),
    ),
    runnerEndTurnAverageCredits: averageNumber(
      runnerEndTurnCreditEntries.map((entry) => entry.runnerCreditsAfter ?? 0),
    ),
    runnerEndTurnCreditsBelowReserve: runnerEndTurnCreditEntries.filter(
      (entry) => entry.runnerBelowReserveAfter === true,
    ).length,
    runnerCreditReserveTargetAverage: averageNumber(runnerCreditReserveTargets),
    runnerTurnsBelowContestReserve: runnerCreditEntries.filter(
      (entry) => entry.runnerBelowReserveBefore === true,
    ).length,
    runnerEconomyCreditsGained: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerEconomyCreditsGained ?? 0),
      0,
    ),
    runnerEconomyCreditsSpent: actionSequence.reduce(
      (sum, entry) => sum + (entry.runnerEconomyCreditsSpent ?? 0),
      0,
    ),
    runnerNetCreditDeltaPerTurn: round(
      runnerCreditDeltas.reduce((sum, delta) => sum + delta, 0) /
        Math.max(
          summaries.reduce((sum, summary) => sum + summary.turns, 0),
          1,
        ),
    ),
    runnerRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerRunStartedBelowReserve === true,
    ).length,
    runnerRemoteRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerRemoteRunStartedBelowReserve === true,
    ).length,
    runnerCentralRunsStartedBelowReserve: runnerRuns.filter(
      (entry) => entry.runnerCentralRunStartedBelowReserve === true,
    ).length,
    runnerContestBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerContestBlockedByCredits === true,
    ).length,
    runnerTrashBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerTrashBlockedByCredits === true,
    ).length,
    runnerStealBlockedByCredits: actionSequence.filter(
      (entry) => entry.runnerStealBlockedByCredits === true,
    ).length,
    runnerSpendBelowReserveActions: actionSequence.filter(
      (entry) => entry.runnerSpendBelowReserve === true,
    ).length,
    runnerLowValueSpendBelowReserve: actionSequence.filter(
      (entry) => entry.runnerLowValueSpendBelowReserve === true,
    ).length,
    runnerExpensiveInstallBelowReserve: actionSequence.filter(
      (entry) => entry.runnerExpensiveInstallBelowReserve === true,
    ).length,
    runnerReservePreservingEconomyActions: actionSequence.filter(
      (entry) => entry.runnerReservePreservingEconomy === true,
    ).length,
    runnerReserveAfterSuccessfulRun: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterSuccessfulRun)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveAfterRemoteAccess: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterRemoteAccess)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveAfterCentralRun: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveAfterCentralRun)
        .filter((value): value is number => typeof value === "number"),
    ),
    runnerReserveBeforeAdvancedRemoteContest: averageNumber(
      actionSequence
        .map((entry) => entry.runnerReserveBeforeAdvancedRemoteContest)
        .filter((value): value is number => typeof value === "number"),
    ),
    runsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.runStartedAgainstKnownUnaffordablePath === true,
    ).length,
    remoteRunsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.remoteRunStartedAgainstKnownUnaffordablePath === true,
    ).length,
    centralRunsStartedAgainstKnownUnaffordablePath: runnerRuns.filter(
      (entry) => entry.centralRunStartedAgainstKnownUnaffordablePath === true,
    ).length,
    runnerRunStartedAgainstKnownUnpayableFullPath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnpayableFullPath === true,
    ).length,
    runnerRunStartedAgainstKnownUnpayableRemotePath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnpayableRemotePath === true,
    ).length,
    runnerRunStartedAgainstKnownUnpayableCentralPath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnpayableCentralPath === true,
    ).length,
    runnerKnownPathAccessReachable: actionSequence.filter(
      (entry) => entry.runnerKnownPathAccessReachable === true,
    ).length,
    runnerKnownPathAccessNotReachable: actionSequence.filter(
      (entry) => entry.runnerKnownPathAccessNotReachable === true,
    ).length,
    runnerKnownPathBlockedByUnbreakableIce: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByUnbreakableIce === true,
    ).length,
    runnerKnownPathBlockedByMissingCoverage: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByMissingCoverage === true,
    ).length,
    runnerKnownPathBlockedByKnownEtr: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByKnownEtr === true,
    ).length,
    runnerKnownPathBlockedByWall: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByWall === true,
    ).length,
    runnerKnownPathBlockedByCodeGate: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedByCodeGate === true,
    ).length,
    runnerKnownPathBlockedBySentry: actionSequence.filter(
      (entry) => entry.runnerKnownPathBlockedBySentry === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakablePath: runnerRuns.filter(
      (entry) => entry.runnerRunStartedAgainstKnownUnbreakablePath === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakableCentralPath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnbreakableCentralPath === true,
    ).length,
    runnerRunStartedAgainstKnownUnbreakableRemotePath: runnerRuns.filter(
      (entry) =>
        entry.runnerRunStartedAgainstKnownUnbreakableRemotePath === true,
    ).length,
    runnerKnownUnbreakableRemoteTraceSampled: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteTraceSampled === true,
    ).length,
    runnerKnownUnbreakableRemoteTrueBug: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteTrueBug === true,
    ).length,
    runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified:
      actionSequence.filter(
        (entry) =>
          entry.runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified ===
          true,
      ).length,
    runnerKnownUnbreakableRemoteStateChanged: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteStateChanged === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairMissing: actionSequence.filter(
      (entry) =>
        entry.runnerKnownUnbreakableRemoteCoverageRepairMissing === true,
    ).length,
    runnerKnownUnbreakableRemoteMetricArtifact: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteMetricArtifact === true,
    ).length,
    runnerKnownUnbreakableRemoteUnclassified: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteUnclassified === true,
    ).length,
    runnerKnownUnbreakableRemoteRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunSuppressed === true,
    ).length,
    runnerKnownUnbreakableRemoteRunPenalized: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunPenalized === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairTaken: actionSequence.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteCoverageRepairTaken === true,
    ).length,
    runnerKnownUnbreakableRemoteCoverageRepairAvailable: actionSequence.filter(
      (entry) =>
        entry.runnerKnownUnbreakableRemoteCoverageRepairAvailable === true,
    ).length,
    runnerKnownUnbreakableRemoteRunTakenDespiteGate: runnerRuns.filter(
      (entry) => entry.runnerKnownUnbreakableRemoteRunTakenDespiteGate === true,
    ).length,
    runnerMultiaccessValueAvailable: runnerRuns.filter(
      (entry) =>
        entry.runnerCentralRunWithInterfaceInstalled === true ||
        entry.runnerHqRunWithHqInterface === true ||
        entry.runnerRndRunWithRndInterface === true,
    ).length,
    runnerMultiaccessValueUsed: runnerRuns.filter(
      (entry) =>
        (entry.runnerHqRunWithHqInterface === true ||
          entry.runnerRndRunWithRndInterface === true) &&
        entry.runnerMultiaccessValueSuppressedNoAccess !== true,
    ).length,
    runnerMultiaccessValueSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerMultiaccessValueSuppressedNoAccess === true,
    ).length,
    runnerCentralPressureSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerCentralPressureSuppressedNoAccess === true,
    ).length,
    runnerHqInterfaceSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerHqInterfaceSuppressedNoAccess === true,
    ).length,
    runnerRndInterfaceSuppressedNoAccess: actionSequence.filter(
      (entry) => entry.runnerRndInterfaceSuppressedNoAccess === true,
    ).length,
    runnerRepeatKnownUnbreakableRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRunPenalized: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRunPenalized === true,
    ).length,
    runnerRepeatKnownUnbreakableCentralRunSuppressed: actionSequence.filter(
      (entry) =>
        entry.runnerRepeatKnownUnbreakableCentralRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRemoteRunSuppressed: actionSequence.filter(
      (entry) => entry.runnerRepeatKnownUnbreakableRemoteRunSuppressed === true,
    ).length,
    runnerRepeatKnownUnbreakableRunTakenDespiteSuppression: runnerRuns.filter(
      (entry) =>
        entry.runnerRepeatKnownUnbreakableRunTakenDespiteSuppression === true,
    ).length,
    runnerCoverageRepairIntentCandidates: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentCandidates === true,
    ).length,
    runnerCoverageRepairIntentSearchTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentSearchTaken === true,
    ).length,
    runnerCoverageRepairIntentRecoveryTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentRecoveryTaken === true,
    ).length,
    runnerCoverageRepairIntentInstallTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentInstallTaken === true,
    ).length,
    runnerCoverageRepairIntentDrawOrEconomyTaken: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentDrawOrEconomyTaken === true,
    ).length,
    runnerCoverageRepairIntentSatisfied: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentSatisfied === true,
    ).length,
    runnerCoverageRepairIntentNoFollowup: actionSequence.filter(
      (entry) => entry.runnerCoverageRepairIntentNoFollowup === true,
    ).length,
    runnerCoverageRepairIntentBlockedByHiddenTargetUncertain:
      actionSequence.filter(
        (entry) =>
          entry.runnerCoverageRepairIntentBlockedByHiddenTargetUncertain ===
          true,
      ).length,
    runnerDataWallHqNoAccessSuppressed: actionSequence.filter(
      (entry) => entry.runnerDataWallHqNoAccessSuppressed === true,
    ).length,
    runnerDataWallHqRepeatSuppressed: actionSequence.filter(
      (entry) => entry.runnerDataWallHqRepeatSuppressed === true,
    ).length,
    runnerHqInterfaceDataWallValueSuppressed: actionSequence.filter(
      (entry) => entry.runnerHqInterfaceDataWallValueSuppressed === true,
    ).length,
    runnerKnownPathCanReachAccessFalse: actionSequence.filter(
      (entry) => entry.runnerKnownPathCanReachAccessFalse === true,
    ).length,
    runnerKnownPathCanBreakNextIceButNotFullPath: actionSequence.filter(
      (entry) => entry.runnerKnownPathCanBreakNextIceButNotFullPath === true,
    ).length,
    runnerRunAbortedAfterKnownUnpayableLaterIce: actionSequence.filter(
      (entry) => entry.runnerRunAbortedAfterKnownUnpayableLaterIce === true,
    ).length,
    runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: runnerRuns.filter(
      (entry) =>
        entry.runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce === true,
    ).length,
    runnerRunCostQuoteUnderestimatedFullPath: runnerRuns.filter(
      (entry) => entry.runnerRunCostQuoteUnderestimatedFullPath === true,
    ).length,
    runnerRepeatRunOnKnownUnpayablePath: runnerRuns.filter(
      (entry) => entry.runnerRepeatRunOnKnownUnpayablePath === true,
    ).length,
    runnerRepeatRunOnKnownUnpayableRemotePath: runnerRuns.filter(
      (entry) => entry.runnerRepeatRunOnKnownUnpayableRemotePath === true,
    ).length,
    runnerRunCouldOnlyForceRezButNotAccess: runnerRuns.filter(
      (entry) => entry.runnerRunCouldOnlyForceRezButNotAccess === true,
    ).length,
    runnerRunAllowedAsFirstProbeUnknownIce: actionSequence.filter(
      (entry) => entry.runnerRunAllowedAsFirstProbeUnknownIce === true,
    ).length,
    runnerRunSuppressedAsKnownNoAccess: actionSequence.filter(
      (entry) => entry.runnerRunSuppressedAsKnownNoAccess === true,
    ).length,
    runnerRunPenalizedAsKnownNoAccess: runnerRuns.filter(
      (entry) => entry.runnerRunPenalizedAsKnownNoAccess === true,
    ).length,
    runsEndedAfterFirstIceDueToCredits: actionSequence.filter(
      (entry) => entry.runEndedAfterFirstIceDueToCredits === true,
    ).length,
    creditsMissingForKnownPath: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runCreditsMissingForKnownPath)
        .filter((value): value is number => typeof value === "number"),
    ),
    knownPathCostAtRunStart: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runKnownPathCostAtStart)
        .filter((value): value is number => typeof value === "number"),
    ),
    creditsAfterKnownPathEstimate: averageNumber(
      runnerKnownPathRunEntries
        .map((entry) => entry.runCreditsAfterKnownPathEstimate)
        .filter((value): value is number => typeof value === "number"),
    ),
    runStartedWithInsufficientStealOrTrashReserve: runnerRuns.filter(
      (entry) => entry.runStartedWithInsufficientStealOrTrashReserve === true,
    ).length,
    probeRunsWithPositiveInfoValue: runnerRuns.filter(
      (entry) => entry.probeRunWithPositiveInfoValue === true,
    ).length,
    lowValueUnaffordableRuns: runnerRuns.filter(
      (entry) => entry.lowValueUnaffordableRun === true,
    ).length,
    illegalActions: summaries.reduce(
      (sum, summary) => sum + summary.metrics.illegalActions,
      0,
    ),
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    fallbackRate: round(
      actionSequence.filter((entry) => entry.fallbackUsed).length /
        totalActions,
    ),
    timeoutRate: round(
      actionSequence.filter((entry) => entry.timeoutUsed).length / totalActions,
    ),
  };
}
