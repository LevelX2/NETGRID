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
  const contestedKeys = new Set<string>();
  const centralInsteadKeys = new Set<string>();
  const centralJustifiedKeys = new Set<string>();
  const centralBurnedKeys = new Set<string>();
  const blockedCreditKeys = new Set<string>();
  const blockedPostRunKeys = new Set<string>();
  const blockedBreakerKeys = new Set<string>();
  const blockedKnownIceKeys = new Set<string>();
  const baitLowValueKeys = new Set<string>();
  const repeatedCentralKeys = new Set<string>();
  const threatFirstTurn = new Map<string, number>();
  const contestDeltas: number[] = [];
  const resolveDeltas: number[] = [];
  let insufficientPostRunStarts = 0;
  let sufficientPostRunStarts = 0;

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const turn = entry.turnNumber ?? 0;
      for (const serverId of entry.runnerAdvancedRemoteThreatServerIds ?? []) {
        const key = `${summary.seed}|${turn}|${serverId}`;
        threatKeys.add(key);
        const persistentKey = `${summary.seed}|${serverId}`;
        if (!threatFirstTurn.has(persistentKey)) {
          threatFirstTurn.set(persistentKey, turn);
        }
      }
      for (const serverId of entry.runnerContestableAdvancedRemoteThreatServerIds ??
        []) {
        const key = `${summary.seed}|${turn}|${serverId}`;
        contestableKeys.add(key);
        if (entry.runnerRemoteContestBlockedByCredits)
          blockedCreditKeys.add(key);
        if (entry.runnerRemoteContestBlockedByPostRunReserve)
          blockedPostRunKeys.add(key);
        if (entry.runnerRemoteContestBlockedByBreakerCoverage)
          blockedBreakerKeys.add(key);
        if (entry.runnerRemoteContestBlockedByKnownIceCost)
          blockedKnownIceKeys.add(key);
        if (entry.runnerRemoteContestDeclinedAsBaitOrLowValue)
          baitLowValueKeys.add(key);
        if (entry.runnerCentralRunInsteadOfContestableAdvancedRemote)
          centralInsteadKeys.add(key);
        if (entry.runnerCentralRunInsteadWasJustified)
          centralJustifiedKeys.add(key);
        if (entry.runnerCentralRunBurnedRemoteContestReserve)
          centralBurnedKeys.add(key);
        if (entry.runnerRepeatedCentralRunWhileSameRemoteThreat)
          repeatedCentralKeys.add(key);
      }
      if (entry.runnerContestedAdvancedRemoteServerId) {
        const serverId = entry.runnerContestedAdvancedRemoteServerId;
        contestedKeys.add(`${summary.seed}|${turn}|${serverId}`);
        const first = threatFirstTurn.get(`${summary.seed}|${serverId}`);
        if (first !== undefined) contestDeltas.push(Math.max(0, turn - first));
      }
      if (
        entry.actionType === "score_agenda" ||
        (entry.actionType === "steal_agenda" &&
          entry.advancedAgendaStealSource === "remote")
      ) {
        const serverId = entry.targetServerId;
        if (serverId) {
          const first = threatFirstTurn.get(`${summary.seed}|${serverId}`);
          if (first !== undefined)
            resolveDeltas.push(Math.max(0, turn - first));
        }
      }
      if (entry.runnerRemoteRunStartedWithInsufficientPostRunReserve)
        insufficientPostRunStarts += 1;
      if (entry.runnerRemoteRunStartedWithSufficientPostRunReserve)
        sufficientPostRunStarts += 1;
    }
  }

  const skippedContestable = [...contestableKeys].filter(
    (key) => !contestedKeys.has(key),
  ).length;
  return {
    uniqueAdvancedRemoteThreats: threatKeys.size,
    contestableAdvancedRemoteThreats: contestableKeys.size,
    advancedRemoteThreatsContested: contestedKeys.size,
    advancedRemoteThreatContestRate:
      contestableKeys.size > 0
        ? round(contestedKeys.size / contestableKeys.size)
        : 0,
    skippedContestableAdvancedRemoteThreats: skippedContestable,
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
