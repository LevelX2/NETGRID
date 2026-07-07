type SimulationActionSequenceEntry = {
  side?: string;
  actionType?: string;
  corpScoreTerminalWindow?: boolean;
  corpScoreTerminalWindowRunnerAccessThreatHigh?: boolean;
  corpScoreTerminalWindowProtectedRemoteReady?: boolean;
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
          entry.corpScoreTerminalSkipped === true &&
          isPassiveCorpScoreLineSkip(entry),
      ).length,
    0,
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
