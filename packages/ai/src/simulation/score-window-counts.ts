type SimulationActionSequenceEntry = {
  side?: string;
  actionType?: string;
  corpScoreTerminalWindow?: boolean;
  corpScoreTerminalWindowScoreLegal?: boolean;
  corpScoreTerminalWindowAdvanceToScoreLegal?: boolean;
  corpScoreTerminalWindowAgendaInstallLegal?: boolean;
  corpScoreTerminalWindowRunnerAccessThreatHigh?: boolean;
  corpScoreTerminalWindowProtectedRemoteReady?: boolean;
  corpScoreTerminalWindowRemoteContestLow?: boolean;
  corpScoreTerminalWindowCreditsSufficient?: boolean;
  corpScoreTerminalSkipped?: boolean;
  corpScoreTerminalSkippedForEconomy?: boolean;
  corpScoreTerminalSkippedForDraw?: boolean;
  corpScoreTerminalSkippedForProtection?: boolean;
  corpScoreTerminalSkippedForInstallIce?: boolean;
  corpScoreTerminalSkippedForInstallAssetOrUpgrade?: boolean;
  corpScoreTerminalSkippedForHqProtection?: boolean;
  corpScoreTerminalSkippedForRndProtection?: boolean;
  corpScoreTerminalSkippedForRemotePortfolio?: boolean;
  corpScoreTerminalSkippedForUnknownHigherPriority?: boolean;
  corpScoreConversionFixGateBlockedByCheapContest?: boolean;
  corpScoreConversionFixGateBlockedByCredits?: boolean;
  corpScoreConversionFixGateBlockedByRunnerContest?: boolean;
  corpScoreConversionFixGateBlockedByHqThreat?: boolean;
};

type SimulationSummaryWithActionSequence = {
  winner?: string;
  actionSequence: SimulationActionSequenceEntry[];
};

export function countUnsafeScoreChosen(
  summaries: SimulationSummaryWithActionSequence[],
): number {
  return summaries.reduce(
    (sum, summary) =>
      sum +
      summary.actionSequence.filter((entry, index) =>
        unsafeScoreChosenEntry(summary, entry, index),
      ).length,
    0,
  );
}

function unsafeScoreChosenEntry(
  summary: SimulationSummaryWithActionSequence,
  entry: SimulationActionSequenceEntry,
  index: number,
): boolean {
  if (
    entry.side !== "corp" ||
    entry.actionType !== "score_agenda" ||
    entry.corpScoreTerminalWindow !== true ||
    entry.corpScoreTerminalWindowRunnerAccessThreatHigh !== true ||
    entry.corpScoreTerminalWindowProtectedRemoteReady === true
  ) {
    return false;
  }
  return !(
    summary.winner === "corp" &&
    index === summary.actionSequence.length - 1
  );
}

export function countPassiveActionWithScoreLineAvailable(
  summaries: SimulationSummaryWithActionSequence[],
): number {
  return summaries.reduce(
    (sum, summary) =>
      sum +
      summary.actionSequence.filter(
        (entry) =>
          entry.side === "corp" &&
          entry.corpScoreTerminalWindow === true &&
          hasConcretePassiveScoreLineAvailable(entry) &&
          entry.corpScoreTerminalSkipped === true &&
          isPassiveCorpScoreLineSkip(entry),
      ).length,
    0,
  );
}

export function hasConcretePassiveScoreLineAvailable(
  entry: SimulationActionSequenceEntry,
): boolean {
  if (entry.corpScoreTerminalWindowScoreLegal === true) return true;
  if (entry.corpScoreTerminalWindowAdvanceToScoreLegal === true) return true;
  if (entry.corpScoreTerminalWindowAgendaInstallLegal !== true) return false;
  return (
    entry.corpScoreTerminalWindowProtectedRemoteReady === true &&
    entry.corpScoreTerminalWindowRemoteContestLow === true &&
    entry.corpScoreTerminalWindowCreditsSufficient === true &&
    !corpScoreLineBlocked(entry)
  );
}

function corpScoreLineBlocked(entry: SimulationActionSequenceEntry): boolean {
  return (
    entry.corpScoreConversionFixGateBlockedByCheapContest === true ||
    entry.corpScoreConversionFixGateBlockedByCredits === true ||
    entry.corpScoreConversionFixGateBlockedByRunnerContest === true ||
    entry.corpScoreConversionFixGateBlockedByHqThreat === true
  );
}

function isPassiveCorpScoreLineSkip(
  entry: SimulationActionSequenceEntry,
): boolean {
  if (
    entry.actionType === "score_agenda" ||
    entry.actionType === "advance_card"
  )
    return false;
  return (
    entry.corpScoreTerminalSkippedForEconomy === true ||
    entry.corpScoreTerminalSkippedForDraw === true ||
    entry.corpScoreTerminalSkippedForProtection === true ||
    entry.corpScoreTerminalSkippedForInstallIce === true ||
    entry.corpScoreTerminalSkippedForInstallAssetOrUpgrade === true ||
    entry.corpScoreTerminalSkippedForHqProtection === true ||
    entry.corpScoreTerminalSkippedForRndProtection === true ||
    entry.corpScoreTerminalSkippedForRemotePortfolio === true ||
    entry.corpScoreTerminalSkippedForUnknownHigherPriority === true
  );
}
