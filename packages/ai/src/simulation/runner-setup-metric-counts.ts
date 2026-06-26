import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import { nextEntries } from "./plan-conversion-predicates";

export function countRunnerCoverageConversions(
  sequence: AiSimulationActionSequenceEntry[],
  predicate: (entry: AiSimulationActionSequenceEntry) => boolean,
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): number {
  return sequence.filter((entry, index) => {
    if (entry.side !== "runner" || !predicate(entry)) return false;
    return nextEntries(sequence, index, 6).some(
      (later) =>
        later.side === "runner" &&
        later.actionType === "start_run" &&
        (isMeaningfulBoardProgress(later) ||
          later.runnerPhaseExitToPressure === true ||
          later.runnerRemoteRunAgainstAdvancedRemote === true ||
          later.runnerCentralCloseoutRunTaken === true),
    );
  }).length;
}

export function countRunnerPressureWithinOwnActions(
  sequence: AiSimulationActionSequenceEntry[],
  predicate: (entry: AiSimulationActionSequenceEntry) => boolean,
  ownActionWindow: number,
): number {
  return sequence.filter((entry, index) => {
    if (entry.side !== "runner" || !predicate(entry)) return false;
    let ownActions = 0;
    for (
      let candidateIndex = index + 1;
      candidateIndex < sequence.length;
      candidateIndex += 1
    ) {
      const candidate = sequence[candidateIndex]!;
      if (candidate.side !== "runner") continue;
      ownActions += 1;
      if (candidate.runnerPressureTakenAfterCoverageReady === true) return true;
      if (ownActions >= ownActionWindow) return false;
    }
    return false;
  }).length;
}

export function countRunnerEconomySetupMetric(
  sequence: AiSimulationActionSequenceEntry[],
  metric: keyof AiSimulationActionSequenceEntry,
): number {
  return sequence.filter((entry) => entry[metric] === true).length;
}

export function countRunnerSearchRecoveryNoInstallFollowup(
  sequence: AiSimulationActionSequenceEntry[],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "runner" ||
      (entry.runnerSearchTaken !== true && entry.runnerRecoveryTaken !== true)
    )
      return false;
    let ownActions = 0;
    for (
      let candidateIndex = index + 1;
      candidateIndex < sequence.length;
      candidateIndex += 1
    ) {
      const candidate = sequence[candidateIndex]!;
      if (candidate.side !== "runner") continue;
      ownActions += 1;
      if (candidate.actionType === "install_card") return false;
      if (candidate.actionType === "start_run") return false;
      if (ownActions >= 3) return true;
    }
    return ownActions > 0;
  }).length;
}
