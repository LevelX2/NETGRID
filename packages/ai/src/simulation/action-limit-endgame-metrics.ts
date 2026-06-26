import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  isRunnerEconomyProgressAction,
  isRunnerSetupAction,
  isStrategicPlanDecision,
  planKindForConversion,
} from "./plan-conversion-predicates";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import {
  countSameStrategicPlanRepeatsWithoutProgress,
  isCorpEndgameScorePathOpportunity,
  isCorpEndgameScorePathTaken,
  isCorpEndgameStallSymptom,
  isEndgameKnownInfoOpportunity,
  isEndgameKnownInfoTaken,
  isEndgameLowValueRepeatAction,
  isEndgameProtectionAction,
  isEndgameScoreOrStealPressureAction,
  isEndgameSetupOrEconomyAction,
  isRunnerEndgameMeaningfulRunOpportunity,
  isRunnerEndgameMeaningfulRunTaken,
  isRunnerEndgameStallSymptom,
  summarizeRunnerEndgameCloseoutWindow,
} from "./runner-endgame-closeout";

export function summarizeActionLimitEndgameMetrics(
  summaries: AiSimulationSummary[],
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): Pick<
  AiMatchProgressionMetrics,
  | "actionLimitRootCauseByMatch"
  | "actionLimitDominantSide"
  | "actionLimitDominantSideRunner"
  | "actionLimitDominantSideCorp"
  | "actionLimitDominantSideBoth"
  | "finalStrategicWindowNoProgressActions"
  | "finalStrategicWindowRunnerNoProgressActions"
  | "finalStrategicWindowCorpNoProgressActions"
  | "finalWindowRunnerMeaningfulRunOpportunities"
  | "finalWindowRunnerMeaningfulRunsTaken"
  | "finalWindowCorpScorePathOpportunities"
  | "finalWindowCorpScorePathTaken"
  | "finalWindowKnownInfoExploitationOpportunities"
  | "finalWindowKnownInfoExploitationTaken"
  | "endgameCloseoutOpportunitiesRunner"
  | "endgameCloseoutOpportunitiesRunnerRaw"
  | "endgameCloseoutOpportunitiesRunnerDeduped"
  | "endgameCloseoutOpportunitiesRunnerTrue"
  | "endgameCloseoutOpportunitiesRunnerFalsePositive"
  | "runnerCloseoutByKnownHqAgenda"
  | "runnerCloseoutByKnownRndTopAgenda"
  | "runnerCloseoutByKnownRemoteAgenda"
  | "runnerCloseoutByPointsToWin"
  | "runnerCloseoutBlockedByCredits"
  | "runnerCloseoutBlockedByBreakerCoverage"
  | "runnerCloseoutBlockedByPostRunReserve"
  | "runnerCloseoutAttempted"
  | "runnerCloseoutSkippedWithReason"
  | "endgameCloseoutOpportunitiesCorp"
  | "endgameCloseoutAttemptsRunner"
  | "endgameCloseoutAttemptsCorp"
  | "endgameScoreOrStealPressureActions"
  | "endgameSetupOrEconomyActions"
  | "endgameProtectionActions"
  | "endgameLowValueRepeatActions"
  | "actionLimitLikelyDeckPressureIssue"
  | "actionLimitLikelyStrategyIssue"
  | "actionLimitLikelyMetricArtifact"
> {
  let actionLimitRootCauseByMatch = 0;
  let actionLimitDominantSideRunner = 0;
  let actionLimitDominantSideCorp = 0;
  let actionLimitDominantSideBoth = 0;
  let finalStrategicWindowNoProgressActions = 0;
  let finalStrategicWindowRunnerNoProgressActions = 0;
  let finalStrategicWindowCorpNoProgressActions = 0;
  let finalWindowRunnerMeaningfulRunOpportunities = 0;
  let finalWindowRunnerMeaningfulRunsTaken = 0;
  let finalWindowCorpScorePathOpportunities = 0;
  let finalWindowCorpScorePathTaken = 0;
  let finalWindowKnownInfoExploitationOpportunities = 0;
  let finalWindowKnownInfoExploitationTaken = 0;
  let endgameCloseoutOpportunitiesRunner = 0;
  let endgameCloseoutOpportunitiesRunnerRaw = 0;
  let endgameCloseoutOpportunitiesRunnerDeduped = 0;
  let endgameCloseoutOpportunitiesRunnerTrue = 0;
  let endgameCloseoutOpportunitiesRunnerFalsePositive = 0;
  let runnerCloseoutByKnownHqAgenda = 0;
  let runnerCloseoutByKnownRndTopAgenda = 0;
  let runnerCloseoutByKnownRemoteAgenda = 0;
  let runnerCloseoutByPointsToWin = 0;
  let runnerCloseoutBlockedByCredits = 0;
  let runnerCloseoutBlockedByBreakerCoverage = 0;
  let runnerCloseoutBlockedByPostRunReserve = 0;
  let runnerCloseoutAttempted = 0;
  let runnerCloseoutSkippedWithReason = 0;
  let endgameCloseoutOpportunitiesCorp = 0;
  let endgameCloseoutAttemptsRunner = 0;
  let endgameCloseoutAttemptsCorp = 0;
  let endgameScoreOrStealPressureActions = 0;
  let endgameSetupOrEconomyActions = 0;
  let endgameProtectionActions = 0;
  let endgameLowValueRepeatActions = 0;
  let actionLimitLikelyDeckPressureIssue = 0;
  let actionLimitLikelyStrategyIssue = 0;
  let actionLimitLikelyMetricArtifact = 0;

  for (const summary of summaries) {
    if (summary.winner !== "action_limit_reached") continue;
    actionLimitRootCauseByMatch += 1;
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const strategicWindow = sequence.filter(isStrategicPlanDecision).slice(-30);
    const windowNoProgress = strategicWindow.filter(
      (entry) => !isMeaningfulBoardProgress(entry),
    );
    const runnerNoProgress = windowNoProgress.filter(
      (entry) => entry.side === "runner",
    );
    const corpNoProgress = windowNoProgress.filter(
      (entry) => entry.side === "corp",
    );
    const runnerRunOpportunities = strategicWindow.filter(
      isRunnerEndgameMeaningfulRunOpportunity,
    );
    const runnerRunsTaken = strategicWindow.filter(
      isRunnerEndgameMeaningfulRunTaken,
    );
    const corpScorePathOpportunities = strategicWindow.filter(
      isCorpEndgameScorePathOpportunity,
    );
    const corpScorePathTaken = strategicWindow.filter(
      isCorpEndgameScorePathTaken,
    );
    const knownInfoOpportunities = strategicWindow.filter(
      isEndgameKnownInfoOpportunity,
    );
    const knownInfoTaken = strategicWindow.filter(isEndgameKnownInfoTaken);
    const runnerNearWin = summary.finalAgendaPoints.runner >= 5;
    const corpNearWin = summary.finalAgendaPoints.corp >= 5;
    const runnerCloseoutSummary = summarizeRunnerEndgameCloseoutWindow(
      strategicWindow,
      runnerNearWin,
    );
    const runnerCloseoutOpportunities = runnerCloseoutSummary.trueOpportunities;
    const corpCloseoutOpportunities = corpNearWin
      ? corpScorePathOpportunities.length
      : strategicWindow.filter(
          (entry) =>
            entry.side === "corp" && (entry.scoreActionsAvailable ?? 0) > 0,
        ).length;
    const runnerCloseoutAttempts = runnerCloseoutSummary.attempted;
    const corpCloseoutAttempts = strategicWindow.filter(
      (entry) =>
        entry.side === "corp" &&
        (entry.actionType === "score_agenda" ||
          (corpNearWin && isCorpEndgameScorePathTaken(entry))),
    ).length;
    const pressureActions = strategicWindow.filter(
      isEndgameScoreOrStealPressureAction,
    );
    const setupOrEconomyActions = strategicWindow.filter((entry) =>
      isEndgameSetupOrEconomyAction(entry, {
        planKind: planKindForConversion(entry),
        runnerSetupAction: isRunnerSetupAction(entry),
        runnerEconomyProgressAction: isRunnerEconomyProgressAction(entry),
      }),
    );
    const protectionActions = strategicWindow.filter((entry) =>
      isEndgameProtectionAction(entry, planKindForConversion(entry)),
    );
    const lowValueRepeatActions =
      strategicWindow.filter(isEndgameLowValueRepeatAction).length +
      countSameStrategicPlanRepeatsWithoutProgress(
        strategicWindow,
        (entry) => ({
          planKind: planKindForConversion(entry),
          meaningfulBoardProgress: isMeaningfulBoardProgress(entry),
        }),
      );

    finalStrategicWindowNoProgressActions += windowNoProgress.length;
    finalStrategicWindowRunnerNoProgressActions += runnerNoProgress.length;
    finalStrategicWindowCorpNoProgressActions += corpNoProgress.length;
    finalWindowRunnerMeaningfulRunOpportunities +=
      runnerRunOpportunities.length;
    finalWindowRunnerMeaningfulRunsTaken += runnerRunsTaken.length;
    finalWindowCorpScorePathOpportunities += corpScorePathOpportunities.length;
    finalWindowCorpScorePathTaken += corpScorePathTaken.length;
    finalWindowKnownInfoExploitationOpportunities +=
      knownInfoOpportunities.length;
    finalWindowKnownInfoExploitationTaken += knownInfoTaken.length;
    endgameCloseoutOpportunitiesRunner += runnerCloseoutOpportunities;
    endgameCloseoutOpportunitiesRunnerRaw += runnerCloseoutSummary.raw;
    endgameCloseoutOpportunitiesRunnerDeduped += runnerCloseoutSummary.deduped;
    endgameCloseoutOpportunitiesRunnerTrue +=
      runnerCloseoutSummary.trueOpportunities;
    endgameCloseoutOpportunitiesRunnerFalsePositive +=
      runnerCloseoutSummary.falsePositive;
    runnerCloseoutByKnownHqAgenda += runnerCloseoutSummary.byKnownHqAgenda;
    runnerCloseoutByKnownRndTopAgenda +=
      runnerCloseoutSummary.byKnownRndTopAgenda;
    runnerCloseoutByKnownRemoteAgenda +=
      runnerCloseoutSummary.byKnownRemoteAgenda;
    runnerCloseoutByPointsToWin += runnerCloseoutSummary.byPointsToWin;
    runnerCloseoutBlockedByCredits += runnerCloseoutSummary.blockedByCredits;
    runnerCloseoutBlockedByBreakerCoverage +=
      runnerCloseoutSummary.blockedByBreakerCoverage;
    runnerCloseoutBlockedByPostRunReserve +=
      runnerCloseoutSummary.blockedByPostRunReserve;
    runnerCloseoutAttempted += runnerCloseoutSummary.attempted;
    runnerCloseoutSkippedWithReason += runnerCloseoutSummary.skippedWithReason;
    endgameCloseoutOpportunitiesCorp += corpCloseoutOpportunities;
    endgameCloseoutAttemptsRunner += runnerCloseoutAttempts;
    endgameCloseoutAttemptsCorp += corpCloseoutAttempts;
    endgameScoreOrStealPressureActions += pressureActions.length;
    endgameSetupOrEconomyActions += setupOrEconomyActions.length;
    endgameProtectionActions += protectionActions.length;
    endgameLowValueRepeatActions += lowValueRepeatActions;

    const runnerSymptoms =
      runnerNoProgress.length +
      strategicWindow.filter(isRunnerEndgameStallSymptom).length +
      Math.max(0, runnerRunOpportunities.length - runnerRunsTaken.length) +
      Math.max(0, knownInfoOpportunities.length - knownInfoTaken.length) +
      Math.max(0, runnerCloseoutOpportunities - runnerCloseoutAttempts);
    const corpSymptoms =
      corpNoProgress.length +
      strategicWindow.filter((entry) =>
        isCorpEndgameStallSymptom(entry, {
          planKind: planKindForConversion(entry),
          meaningfulBoardProgress: isMeaningfulBoardProgress(entry),
        }),
      ).length +
      Math.max(
        0,
        corpScorePathOpportunities.length - corpScorePathTaken.length,
      ) +
      Math.max(0, corpCloseoutOpportunities - corpCloseoutAttempts);
    const likelyMetricArtifact =
      strategicWindow.length === 0 ||
      (windowNoProgress.length <= 2 &&
        sequence.filter((entry) => !isStrategicPlanDecision(entry)).length >
          strategicWindow.length);
    const likelyDeckPressureIssue =
      pressureActions.length <= 1 &&
      runnerCloseoutOpportunities === 0 &&
      corpCloseoutOpportunities === 0 &&
      setupOrEconomyActions.length + protectionActions.length >=
        Math.max(3, windowNoProgress.length);

    if (likelyMetricArtifact) actionLimitLikelyMetricArtifact += 1;
    else if (likelyDeckPressureIssue) actionLimitLikelyDeckPressureIssue += 1;
    else actionLimitLikelyStrategyIssue += 1;

    if (runnerSymptoms > 0 || corpSymptoms > 0) {
      if (
        runnerSymptoms > 0 &&
        corpSymptoms > 0 &&
        Math.abs(runnerSymptoms - corpSymptoms) <= 3
      ) {
        actionLimitDominantSideBoth += 1;
      } else if (runnerSymptoms > corpSymptoms) {
        actionLimitDominantSideRunner += 1;
      } else {
        actionLimitDominantSideCorp += 1;
      }
    }
  }

  return {
    actionLimitRootCauseByMatch,
    actionLimitDominantSide:
      actionLimitDominantSideRunner +
      actionLimitDominantSideCorp +
      actionLimitDominantSideBoth,
    actionLimitDominantSideRunner,
    actionLimitDominantSideCorp,
    actionLimitDominantSideBoth,
    finalStrategicWindowNoProgressActions,
    finalStrategicWindowRunnerNoProgressActions,
    finalStrategicWindowCorpNoProgressActions,
    finalWindowRunnerMeaningfulRunOpportunities,
    finalWindowRunnerMeaningfulRunsTaken,
    finalWindowCorpScorePathOpportunities,
    finalWindowCorpScorePathTaken,
    finalWindowKnownInfoExploitationOpportunities,
    finalWindowKnownInfoExploitationTaken,
    endgameCloseoutOpportunitiesRunner,
    endgameCloseoutOpportunitiesRunnerRaw,
    endgameCloseoutOpportunitiesRunnerDeduped,
    endgameCloseoutOpportunitiesRunnerTrue,
    endgameCloseoutOpportunitiesRunnerFalsePositive,
    runnerCloseoutByKnownHqAgenda,
    runnerCloseoutByKnownRndTopAgenda,
    runnerCloseoutByKnownRemoteAgenda,
    runnerCloseoutByPointsToWin,
    runnerCloseoutBlockedByCredits,
    runnerCloseoutBlockedByBreakerCoverage,
    runnerCloseoutBlockedByPostRunReserve,
    runnerCloseoutAttempted,
    runnerCloseoutSkippedWithReason,
    endgameCloseoutOpportunitiesCorp,
    endgameCloseoutAttemptsRunner,
    endgameCloseoutAttemptsCorp,
    endgameScoreOrStealPressureActions,
    endgameSetupOrEconomyActions,
    endgameProtectionActions,
    endgameLowValueRepeatActions,
    actionLimitLikelyDeckPressureIssue,
    actionLimitLikelyStrategyIssue,
    actionLimitLikelyMetricArtifact,
  };
}
