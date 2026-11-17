import type { AiSimulationSummary } from "./ai-simulation-summary";
import { isRemoteServerTarget } from "../runtime/server-target";

export function progressionEntriesWithRunTargets(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary["actionSequence"] {
  let currentRunTarget: string | undefined;
  const runTargetFollowupActionTypeSet = new Set([
    "access_card",
    "steal_agenda",
    "trash_accessed_card",
    "decline_trash",
    "jack_out",
  ]);
  return actionSequence.map((entry) => {
    if (entry.side === "runner" && entry.actionType === "start_run") {
      currentRunTarget = entry.targetServerId;
      return entry;
    }
    if (
      entry.side === "runner" &&
      !entry.targetServerId &&
      runTargetFollowupActionTypeSet.has(entry.actionType) &&
      currentRunTarget
    ) {
      return { ...entry, targetServerId: currentRunTarget };
    }
    return entry;
  });
}

export function countCorpMultiIceInstallOrderFutureEffectDead(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "corp" ||
      entry.actionType !== "install_card" ||
      entry.installPlacement !== "ice" ||
      entry.corpFutureRunIceInstalledAsDeadEffect !== true ||
      !entry.targetServerId ||
      !entry.turnNumber
    )
      return false;
    return sequence
      .slice(index + 1)
      .some(
        (later) =>
          later.side === "corp" &&
          later.turnNumber === entry.turnNumber &&
          later.actionType === "install_card" &&
          later.installPlacement === "ice" &&
          later.targetServerId === entry.targetServerId,
      );
  }).length;
}

export function countCorpMultiIceInstallOrderOptimized(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "corp" ||
      entry.actionType !== "install_card" ||
      entry.installPlacement !== "ice" ||
      entry.corpFutureRunIceInstalledAsLiveEffect !== true ||
      !entry.targetServerId ||
      !entry.turnNumber
    )
      return false;
    return sequence
      .slice(0, index)
      .some(
        (previous) =>
          previous.side === "corp" &&
          previous.turnNumber === entry.turnNumber &&
          previous.actionType === "install_card" &&
          previous.installPlacement === "ice" &&
          previous.targetServerId === entry.targetServerId &&
          previous.corpFutureRunIceInstalled !== true,
      );
  }).length;
}

export function isCorpRemoteAdvancementProgress(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  if (entry.side !== "corp") return false;
  if (!isRemoteServerTarget(entry.targetServerId)) return false;
  if (entry.actionType === "advance_card") return true;
  return (entry.advancementCountersAdded ?? 0) > 0;
}

export function countRunnerTurnsBelowContestReserve(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  const turns = new Set<number>();
  for (const entry of sequence) {
    if (
      entry.side === "runner" &&
      entry.runnerBelowReserveBefore === true &&
      entry.turnNumber !== undefined
    )
      turns.add(entry.turnNumber);
  }
  return turns.size;
}

export function countPressureTargetSwitches(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  let previousTarget: string | undefined;
  let switches = 0;
  for (const entry of sequence) {
    if (entry.side !== "runner" || entry.actionType !== "start_run") continue;
    const target = entry.targetServerId ?? "unknown";
    if (previousTarget !== undefined && previousTarget !== target) switches++;
    previousTarget = target;
  }
  return switches;
}

export function successfulRunAccessTargets(
  sequence: AiSimulationSummary["actionSequence"],
): string[] {
  const byRun = new Map<string, string>();
  for (const entry of sequence) {
    if (
      entry.side === "runner" &&
      entry.runnerReserveRunId &&
      entry.runnerReserveAccessTarget
    )
      byRun.set(entry.runnerReserveRunId, entry.runnerReserveAccessTarget);
  }
  return [...byRun.values()];
}
