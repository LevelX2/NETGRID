import { hasEvidenceFlag } from "../runtime/evidence-value";
import { isRemoteServerTarget } from "../runtime/server-target";

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
  targetCardType?: string;
  hqKnownAgendaCount?: number;
  knownRemoteAgendas?: number;
  knownRemoteTrashableCards?: number;
  knownUnrezzedIceFromExpose?: number;
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
  runnerRemoteRunOpportunityAgainstAdvancedRemote?: boolean;
  remoteTrashBoostedByKnownRemoteTrashable?: boolean;
  runnerRepeatedLowValueCentralRun?: boolean;
  runnerNoFreshCentralRunTaken?: boolean;
  runnerRepeatedCentralRunWithoutFreshValue?: boolean;
  runnerSkippedAdvancedRemoteContest?: boolean;
  scoreActionsAvailable?: number;
  finalAdvance?: boolean;
  protectedFinalAdvance?: boolean;
  protectBeforeAdvance?: boolean;
  advancementCountersAdded?: number;
  evidence?: readonly string[];
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

export function isRunnerEndgameMeaningfulRunOpportunity(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  if (entry.side !== "runner") return false;
  return (
    entry.runnerRemoteRunOpportunityAgainstAdvancedRemote === true ||
    entry.runnerTrueCentralCloseoutOpportunity === true ||
    (entry.hqKnownAgendaCount ?? 0) > 0 ||
    (entry.knownRemoteAgendas ?? 0) > 0 ||
    (entry.knownRemoteTrashableCards ?? 0) > 0 ||
    entry.runnerCentralRunWithMultiaccess === true ||
    entry.runnerCentralRunWithInterfaceInstalled === true ||
    entry.runnerCentralRunEventWithGoodTarget === true
  );
}

export function isRunnerEndgameMeaningfulRunTaken(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  if (entry.side !== "runner") return false;
  if (entry.actionType === "steal_agenda") return true;
  if (
    entry.actionType === "trash_accessed_card" ||
    entry.runnerRelevantRemoteTrashTaken === true
  )
    return true;
  if (entry.actionType !== "start_run") return false;
  return (
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralCloseoutRunTaken === true ||
    entry.runnerCentralRunWithMultiaccess === true ||
    entry.runnerCentralRunWithInterfaceInstalled === true ||
    entry.runnerCentralRunEventWithGoodTarget === true ||
    entry.hqRunBoostedBecauseKnownAgenda === true ||
    entry.hqRunBoostedByRndToHqAgenda === true ||
    entry.remoteRunBoostedByKnownRemoteAgenda === true ||
    entry.remoteTrashBoostedByKnownRemoteTrashable === true
  );
}

export function isEndgameKnownInfoOpportunity(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.side === "runner" &&
    ((entry.hqKnownAgendaCount ?? 0) > 0 ||
      (entry.knownRemoteAgendas ?? 0) > 0 ||
      (entry.knownRemoteTrashableCards ?? 0) > 0 ||
      (entry.knownUnrezzedIceFromExpose ?? 0) > 0 ||
      entry.hqRunBoostedBecauseKnownAgenda === true ||
      entry.hqRunBoostedByRndToHqAgenda === true ||
      entry.remoteRunBoostedByKnownRemoteAgenda === true ||
      entry.remoteTrashBoostedByKnownRemoteTrashable === true)
  );
}

export function isEndgameKnownInfoTaken(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.side === "runner" &&
    (entry.actionType === "steal_agenda" ||
      entry.actionType === "trash_accessed_card" ||
      (entry.actionType === "start_run" &&
        (entry.hqRunBoostedBecauseKnownAgenda === true ||
          entry.hqRunBoostedByRndToHqAgenda === true ||
          entry.remoteRunBoostedByKnownRemoteAgenda === true ||
          entry.remoteTrashBoostedByKnownRemoteTrashable === true ||
          (entry.knownUnrezzedIceFromExpose ?? 0) > 0)))
  );
}

export function isCorpEndgameScorePathOpportunity(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  if (entry.side !== "corp") return false;
  return (
    (entry.scoreActionsAvailable ?? 0) > 0 ||
    entry.finalAdvance === true ||
    entry.protectedFinalAdvance === true ||
    entry.protectBeforeAdvance === true ||
    isCorpRemoteAdvancementProgressForEndgame(entry) ||
    (isCorpRemoteBuildActionForEndgame(entry) &&
      entry.targetCardType === "agenda")
  );
}

export function isCorpEndgameScorePathTaken(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  if (entry.side !== "corp") return false;
  return (
    entry.actionType === "score_agenda" ||
    isCorpRemoteAdvancementProgressForEndgame(entry) ||
    entry.protectedFinalAdvance === true ||
    entry.protectBeforeAdvance === true
  );
}

export function isEndgameScoreOrStealPressureAction(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.actionType === "score_agenda" ||
    entry.actionType === "steal_agenda" ||
    entry.actionType === "trash_accessed_card" ||
    isCorpRemoteAdvancementProgressForEndgame(entry) ||
    (entry.side === "runner" && entry.actionType === "start_run")
  );
}

export function isEndgameLowValueRepeatAction(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.runnerRepeatedLowValueCentralRun === true ||
    entry.runnerNoFreshCentralRunTaken === true ||
    entry.runnerRepeatedCentralRunWithoutFreshValue === true ||
    hasEndgameEvidenceFlag(entry, "runner_access_no_value_repeated:true") ||
    hasEndgameEvidenceFlag(
      entry,
      "runner_central_success_followed_by_repeat_no_value:true",
    ) ||
    hasEndgameEvidenceFlag(
      entry,
      "runner_jack_out_repeated_same_server_without_new_info:true",
    )
  );
}

export function isRunnerEndgameStallSymptom(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.runnerContestBlockedByCredits === true ||
    entry.runnerRemoteContestBlockedByCredits === true ||
    entry.runnerRemoteContestBlockedByPostRunReserve === true ||
    entry.runnerRemoteContestBlockedByBreakerCoverage === true ||
    entry.runnerRemoteContestBlockedByKnownIceCost === true ||
    entry.runStartedAgainstKnownUnaffordablePath === true ||
    entry.runnerSkippedAdvancedRemoteContest === true ||
    entry.runnerCentralRunBurnedRemoteContestReserve === true ||
    isEndgameLowValueRepeatAction(entry)
  );
}

function isCorpRemoteAdvancementProgressForEndgame(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  if (entry.side !== "corp") return false;
  if (!isRemoteServerTarget(entry.targetServerId)) return false;
  if (entry.actionType === "advance_card") return true;
  return (entry.advancementCountersAdded ?? 0) > 0;
}

function isCorpRemoteBuildActionForEndgame(
  entry: RunnerEndgameCloseoutEntry,
): boolean {
  return (
    entry.side === "corp" &&
    isRemoteServerTarget(entry.targetServerId) &&
    (entry.actionType === "install_card" || entry.actionType === "rez_ice")
  );
}

function hasEndgameEvidenceFlag(
  entry: RunnerEndgameCloseoutEntry,
  flag: string,
): boolean {
  return hasEvidenceFlag({ evidence: entry.evidence ?? [] }, flag);
}
