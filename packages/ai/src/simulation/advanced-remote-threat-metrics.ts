import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function summarizeAdvancedRemoteThreatMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "uniqueAdvancedRemoteThreats"
  | "contestableAdvancedRemoteThreats"
  | "advancedRemoteThreatsContested"
  | "advancedRemoteThreatContestRate"
  | "skippedContestableAdvancedRemoteThreats"
  | "centralRunInsteadOfContestableAdvancedRemote"
  | "centralRunInsteadWasJustified"
  | "centralRunBurnedRemoteContestReserve"
  | "remoteContestBlockedByCredits"
  | "remoteContestBlockedByPostRunReserve"
  | "remoteContestBlockedByBreakerCoverage"
  | "remoteContestBlockedByKnownIceCost"
  | "remoteContestDeclinedAsBaitOrLowValue"
  | "repeatedCentralRunsWhileSameRemoteThreat"
  | "remoteRunStartedWithInsufficientPostRunReserve"
  | "remoteRunStartedWithSufficientPostRunReserve"
  | "turnsFromRemoteThreatCreatedToContest"
  | "turnsFromRemoteThreatCreatedToScoreOrSteal"
> {
  const threatKeys = new Set<string>();
  const contestableKeys = new Set<string>();
  const contestAttempts = new Set<string>();
  const contestedContestableKeys = new Set<string>();
  const centralInsteadKeys = new Set<string>();
  const centralJustifiedKeys = new Set<string>();
  const centralBurnedKeys = new Set<string>();
  const blockedCreditKeys = new Set<string>();
  const blockedPostRunKeys = new Set<string>();
  const blockedBreakerKeys = new Set<string>();
  const blockedKnownIceKeys = new Set<string>();
  const baitLowValueKeys = new Set<string>();
  const repeatedCentralKeys = new Set<string>();
  const contestDeltas: number[] = [];
  const resolveDeltas: number[] = [];
  let insufficientPostRunStarts = 0;
  let sufficientPostRunStarts = 0;

  for (const [gameIndex, summary] of summaries.entries()) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const threatFirstTurn = new Map<string, number>();
    for (const entry of sequence) {
      const turn = entry.turnNumber;
      if (turn !== undefined) {
        for (const threat of entry.runnerAdvancedRemoteThreats ?? []) {
          const { serverId, blocker } = threat;
          const key = `${gameIndex}|${turn}|${serverId}`;
          threatKeys.add(key);
          if (!threatFirstTurn.has(serverId))
            threatFirstTurn.set(serverId, turn);
          if (blocker === "ice_cost" || blocker === "post_run_reserve")
            blockedCreditKeys.add(key);
          if (blocker === "post_run_reserve") blockedPostRunKeys.add(key);
          if (blocker === "breaker_coverage") blockedBreakerKeys.add(key);
          if (blocker === "ice_cost") blockedKnownIceKeys.add(key);
          if (blocker === "bait_or_low_value") baitLowValueKeys.add(key);
          if (!threat.contestable) continue;
          contestableKeys.add(key);
          if (entry.runnerCentralRunInsteadOfContestableAdvancedRemote)
            centralInsteadKeys.add(key);
          if (entry.runnerCentralRunInsteadWasJustified)
            centralJustifiedKeys.add(key);
          if (entry.runnerCentralRunBurnedRemoteContestReserve)
            centralBurnedKeys.add(key);
          if (entry.runnerRepeatedCentralRunWhileSameRemoteThreat)
            repeatedCentralKeys.add(key);
        }
      }
      if (turn !== undefined && entry.runnerContestedAdvancedRemoteServerId) {
        const serverId = entry.runnerContestedAdvancedRemoteServerId;
        const key = `${gameIndex}|${turn}|${serverId}`;
        const first = threatFirstTurn.get(serverId);
        if (!contestAttempts.has(key) && first !== undefined)
          contestDeltas.push(Math.max(0, turn - first));
        contestAttempts.add(key);
        if (
          entry.runnerAdvancedRemoteThreats?.some(
            (threat) => threat.contestable && threat.serverId === serverId,
          )
        )
          contestedContestableKeys.add(key);
      }
      if (
        entry.actionType === "score_agenda" ||
        (entry.actionType === "steal_agenda" &&
          entry.advancedAgendaStealSource === "remote")
      ) {
        const serverId = entry.targetServerId;
        if (serverId && turn !== undefined) {
          const first = threatFirstTurn.get(serverId);
          if (first !== undefined) {
            resolveDeltas.push(Math.max(0, turn - first));
            threatFirstTurn.delete(serverId);
          }
        }
      }
      if (entry.runnerRemoteRunStartedWithInsufficientPostRunReserve)
        insufficientPostRunStarts += 1;
      if (entry.runnerRemoteRunStartedWithSufficientPostRunReserve)
        sufficientPostRunStarts += 1;
    }
  }

  const contestedContestable = contestedContestableKeys.size;
  return {
    uniqueAdvancedRemoteThreats: threatKeys.size,
    contestableAdvancedRemoteThreats: contestableKeys.size,
    advancedRemoteThreatsContested: contestedContestable,
    advancedRemoteThreatContestRate:
      contestableKeys.size > 0
        ? round(contestedContestable / contestableKeys.size)
        : 0,
    skippedContestableAdvancedRemoteThreats:
      contestableKeys.size - contestedContestable,
    centralRunInsteadOfContestableAdvancedRemote: centralInsteadKeys.size,
    centralRunInsteadWasJustified: centralJustifiedKeys.size,
    centralRunBurnedRemoteContestReserve: centralBurnedKeys.size,
    remoteContestBlockedByCredits: blockedCreditKeys.size,
    remoteContestBlockedByPostRunReserve: blockedPostRunKeys.size,
    remoteContestBlockedByBreakerCoverage: blockedBreakerKeys.size,
    remoteContestBlockedByKnownIceCost: blockedKnownIceKeys.size,
    remoteContestDeclinedAsBaitOrLowValue: baitLowValueKeys.size,
    repeatedCentralRunsWhileSameRemoteThreat: repeatedCentralKeys.size,
    remoteRunStartedWithInsufficientPostRunReserve: insufficientPostRunStarts,
    remoteRunStartedWithSufficientPostRunReserve: sufficientPostRunStarts,
    turnsFromRemoteThreatCreatedToContest: averageNumber(contestDeltas),
    turnsFromRemoteThreatCreatedToScoreOrSteal: averageNumber(resolveDeltas),
  };
}
