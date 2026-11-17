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
    if (entry.side === "runner" && entry.runnerRunStarted === true) {
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

type ActionSequence = AiSimulationSummary["actionSequence"];

export function countCorpMultiIceInstallOrderFutureEffectDead(
  sequence: ActionSequence,
): number {
  const laterInstalls = new Set<string>();
  let count = 0;
  for (let index = sequence.length - 1; index >= 0; index--) {
    const entry = sequence[index]!;
    const key = corpIceInstallTurnAndServer(entry);
    if (key === undefined) continue;
    if (
      entry.corpFutureRunIceInstalledAsDeadEffect === true &&
      laterInstalls.has(key)
    )
      count++;
    laterInstalls.add(key);
  }
  return count;
}

export function countCorpMultiIceInstallOrderOptimized(
  sequence: ActionSequence,
): number {
  const earlierOrdinaryInstalls = new Set<string>();
  let count = 0;
  for (const entry of sequence) {
    const key = corpIceInstallTurnAndServer(entry);
    if (key === undefined) continue;
    if (
      entry.corpFutureRunIceInstalledAsLiveEffect === true &&
      earlierOrdinaryInstalls.has(key)
    )
      count++;
    if (entry.corpFutureRunIceInstalled !== true)
      earlierOrdinaryInstalls.add(key);
  }
  return count;
}

function corpIceInstallTurnAndServer(
  entry: ActionSequence[number],
): string | undefined {
  if (
    entry.side !== "corp" ||
    entry.actionType !== "install_card" ||
    entry.installPlacement !== "ice" ||
    !entry.targetServerId ||
    !entry.turnNumber
  )
    return undefined;
  return `${entry.turnNumber}:${entry.targetServerId}`;
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
    if (entry.side !== "runner" || entry.runnerRunStarted !== true) continue;
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
