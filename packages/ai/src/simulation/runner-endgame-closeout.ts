export type RunnerEndgameCloseoutWindowSummary = {
  raw: number;
  deduped: number;
  trueOpportunities: number;
  falsePositive: number;
  byKnownHqAgenda: number;
  byKnownRndTopAgenda: number;
  byKnownRemoteAgenda: number;
  byPointsToWin: number;
  blockedByCredits: number;
  blockedByBreakerCoverage: number;
  blockedByPostRunReserve: number;
  attempted: number;
  skippedWithReason: number;
};

type RunnerEndgameCloseoutReason =
  | "known_hq_agenda"
  | "known_rnd_top_agenda"
  | "known_remote_agenda"
  | "points_to_win";

type RunnerEndgameCloseoutCandidate = {
  key: string;
  reasons: Set<RunnerEndgameCloseoutReason>;
  blockedByCredits: boolean;
  blockedByBreakerCoverage: boolean;
  blockedByPostRunReserve: boolean;
  attempted: boolean;
};

export type RunnerEndgameCloseoutEntry = {
  side?: string;
  actionType?: string;
  targetServerId?: string;
  hqKnownAgendaCount?: number;
  knownRemoteAgendas?: number;
  runCreditsMissingForKnownPath?: number;
  hqRunBoostedBecauseKnownAgenda?: boolean;
  hqRunBoostedByRndToHqAgenda?: boolean;
  remoteRunBoostedByKnownRemoteAgenda?: boolean;
  runnerTrueCentralCloseoutOpportunity?: boolean;
  runnerCentralCloseoutRunTaken?: boolean;
  runnerCentralRunWithMultiaccess?: boolean;
  runnerCentralRunWithInterfaceInstalled?: boolean;
  runnerCentralRunEventWithGoodTarget?: boolean;
  runnerContestBlockedByCredits?: boolean;
  runnerRemoteContestBlockedByCredits?: boolean;
  runnerStealBlockedByCredits?: boolean;
  runnerRemoteContestBlockedByBreakerCoverage?: boolean;
  runnerRemoteContestBlockedByKnownIceCost?: boolean;
  runStartedAgainstKnownUnaffordablePath?: boolean;
  remoteRunStartedAgainstKnownUnaffordablePath?: boolean;
  centralRunStartedAgainstKnownUnaffordablePath?: boolean;
  runnerRemoteContestBlockedByPostRunReserve?: boolean;
  runnerCentralRunStartedWithInsufficientPostRunReserve?: boolean;
  runnerRemoteRunStartedWithInsufficientPostRunReserve?: boolean;
  runnerCentralRunBurnedRemoteContestReserve?: boolean;
  runStartedWithInsufficientStealOrTrashReserve?: boolean;
  runnerRemoteRunAgainstAdvancedRemote?: boolean;
  runnerRelevantRemoteTrashTaken?: boolean;
};

export function summarizeRunnerEndgameCloseoutWindow(
  strategicWindow: RunnerEndgameCloseoutEntry[],
  runnerNearWin: boolean,
): RunnerEndgameCloseoutWindowSummary {
  const candidates: RunnerEndgameCloseoutCandidate[] = [];
  for (const entry of strategicWindow) {
    const candidate = runnerEndgameCloseoutCandidateForEntry(
      entry,
      runnerNearWin,
    );
    if (candidate) candidates.push(candidate);
  }

  const byKey = new Map<string, RunnerEndgameCloseoutCandidate>();
  for (const candidate of candidates) {
    const existing = byKey.get(candidate.key);
    if (!existing) {
      byKey.set(candidate.key, candidate);
      continue;
    }
    for (const reason of candidate.reasons) existing.reasons.add(reason);
    existing.blockedByCredits ||= candidate.blockedByCredits;
    existing.blockedByBreakerCoverage ||= candidate.blockedByBreakerCoverage;
    existing.blockedByPostRunReserve ||= candidate.blockedByPostRunReserve;
    existing.attempted ||= candidate.attempted;
  }

  const deduped = [...byKey.values()];
  const trueCandidates = deduped.filter(
    (candidate) =>
      !candidate.blockedByCredits &&
      !candidate.blockedByBreakerCoverage &&
      !candidate.blockedByPostRunReserve,
  );
  const blockedCandidates = deduped.filter(
    (candidate) =>
      candidate.blockedByCredits ||
      candidate.blockedByBreakerCoverage ||
      candidate.blockedByPostRunReserve,
  );

  return {
    raw: candidates.length,
    deduped: deduped.length,
    trueOpportunities: trueCandidates.length,
    falsePositive: deduped.length - trueCandidates.length,
    byKnownHqAgenda: countRunnerCloseoutReason(
      trueCandidates,
      "known_hq_agenda",
    ),
    byKnownRndTopAgenda: countRunnerCloseoutReason(
      trueCandidates,
      "known_rnd_top_agenda",
    ),
    byKnownRemoteAgenda: countRunnerCloseoutReason(
      trueCandidates,
      "known_remote_agenda",
    ),
    byPointsToWin: countRunnerCloseoutReason(trueCandidates, "points_to_win"),
    blockedByCredits: blockedCandidates.filter(
      (candidate) => candidate.blockedByCredits,
    ).length,
    blockedByBreakerCoverage: blockedCandidates.filter(
      (candidate) => candidate.blockedByBreakerCoverage,
    ).length,
    blockedByPostRunReserve: blockedCandidates.filter(
      (candidate) => candidate.blockedByPostRunReserve,
    ).length,
    attempted: trueCandidates.filter((candidate) => candidate.attempted).length,
    skippedWithReason: blockedCandidates.length,
  };
}

function countRunnerCloseoutReason(
  candidates: RunnerEndgameCloseoutCandidate[],
  reason: RunnerEndgameCloseoutReason,
): number {
  return candidates.filter((candidate) => candidate.reasons.has(reason)).length;
}

function runnerEndgameCloseoutCandidateForEntry(
  entry: RunnerEndgameCloseoutEntry,
  runnerNearWin: boolean,
): RunnerEndgameCloseoutCandidate | undefined {
  if (entry.side !== "runner") return undefined;

  const reasons = new Set<RunnerEndgameCloseoutReason>();
  if (
    (entry.hqKnownAgendaCount ?? 0) > 0 ||
    entry.hqRunBoostedBecauseKnownAgenda === true
  ) {
    reasons.add("known_hq_agenda");
  }
  if (entry.hqRunBoostedByRndToHqAgenda === true) {
    reasons.add("known_rnd_top_agenda");
  }
  if (
    (entry.knownRemoteAgendas ?? 0) > 0 ||
    entry.remoteRunBoostedByKnownRemoteAgenda === true
  ) {
    reasons.add("known_remote_agenda");
  }
  if (
    runnerNearWin &&
    (entry.runnerTrueCentralCloseoutOpportunity === true ||
      entry.runnerCentralCloseoutRunTaken === true ||
      entry.runnerCentralRunWithMultiaccess === true ||
      entry.runnerCentralRunWithInterfaceInstalled === true ||
      entry.runnerCentralRunEventWithGoodTarget === true ||
      (entry.hqKnownAgendaCount ?? 0) > 0 ||
      (entry.knownRemoteAgendas ?? 0) > 0)
  ) {
    reasons.add("points_to_win");
  }
  if (reasons.size === 0) return undefined;

  const target = runnerCloseoutTargetForEntry(entry, reasons);
  const key = `${target}:${[...reasons].sort().join("+")}`;
  return {
    key,
    reasons,
    blockedByCredits: runnerCloseoutBlockedByCredits(entry),
    blockedByBreakerCoverage: runnerCloseoutBlockedByBreakerCoverage(entry),
    blockedByPostRunReserve: runnerCloseoutBlockedByPostRunReserve(entry),
    attempted: runnerCloseoutAttemptedByEntry(entry),
  };
}

function runnerCloseoutTargetForEntry(
  entry: RunnerEndgameCloseoutEntry,
  reasons: Set<RunnerEndgameCloseoutReason>,
): string {
  if (entry.targetServerId) return entry.targetServerId;
  if (reasons.has("known_hq_agenda") || reasons.has("known_rnd_top_agenda"))
    return "hq";
  if (reasons.has("known_remote_agenda")) return "remote";
  return "central";
}

function runnerCloseoutBlockedByCredits(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.runnerContestBlockedByCredits === true ||
    entry.runnerRemoteContestBlockedByCredits === true ||
    entry.runnerStealBlockedByCredits === true ||
    (entry.runCreditsMissingForKnownPath ?? 0) > 0
  );
}

function runnerCloseoutBlockedByBreakerCoverage(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.runnerRemoteContestBlockedByBreakerCoverage === true ||
    entry.runnerRemoteContestBlockedByKnownIceCost === true ||
    entry.runStartedAgainstKnownUnaffordablePath === true ||
    entry.remoteRunStartedAgainstKnownUnaffordablePath === true ||
    entry.centralRunStartedAgainstKnownUnaffordablePath === true
  );
}

function runnerCloseoutBlockedByPostRunReserve(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.runnerRemoteContestBlockedByPostRunReserve === true ||
    entry.runnerCentralRunStartedWithInsufficientPostRunReserve === true ||
    entry.runnerRemoteRunStartedWithInsufficientPostRunReserve === true ||
    entry.runnerCentralRunBurnedRemoteContestReserve === true ||
    entry.runStartedWithInsufficientStealOrTrashReserve === true
  );
}

function runnerCloseoutAttemptedByEntry(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.actionType === "start_run" ||
    entry.actionType === "trash_accessed_card" ||
    entry.runnerCentralCloseoutRunTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerRelevantRemoteTrashTaken === true
  );
}
