import { hasEvidenceFlag } from "../runtime/evidence-value";
import { isRemoteServerTarget } from "../runtime/server-target";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";

export function summarizeRunnerRepeatRemoteNoTrashMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerRepeatAccessKnownRemote"
  | "runnerRepeatAccessKnownTrashableRemote"
  | "runnerRepeatAccessKnownTrashableRemoteWithoutTrash"
  | "runnerRepeatRunOnSameRemoteAfterDecliningTrash"
  | "runnerRepeatRunOnSameRemoteNoNewInfo"
  | "runnerRepeatRemoteAccessNoProgress"
  | "runnerRepeatRemoteRunSuppressedAfterNoTrash"
  | "runnerRepeatRemoteRunPenalizedAfterNoTrash"
  | "runnerRepeatRemoteNoTrashFixGateSuspicious"
> {
  const metrics = {
    runnerRepeatAccessKnownRemote: 0,
    runnerRepeatAccessKnownTrashableRemote: 0,
    runnerRepeatAccessKnownTrashableRemoteWithoutTrash: 0,
    runnerRepeatRunOnSameRemoteAfterDecliningTrash: 0,
    runnerRepeatRunOnSameRemoteNoNewInfo: 0,
    runnerRepeatRemoteAccessNoProgress: 0,
    runnerRepeatRemoteRunSuppressedAfterNoTrash: 0,
    runnerRepeatRemoteRunPenalizedAfterNoTrash: 0,
    runnerRepeatRemoteNoTrashFixGateSuspicious: 0,
  };
  for (const summary of summaries) {
    const declinedTrashRemotes = new Map<
      string,
      { unchanged: boolean; affordable: boolean }
    >();
    for (const entry of progressionEntriesWithRunTargets(
      summary.actionSequence,
    )) {
      const serverId = entry.targetServerId;
      if (entry.side === "corp") {
        const decline = serverId
          ? declinedTrashRemotes.get(serverId)
          : undefined;
        if (
          decline &&
          (entry.actionType === "install_card" ||
            entry.actionType === "rez_ice" ||
            entry.actionType === "rez_card" ||
            entry.actionType === "score_agenda" ||
            (entry.advancementCountersAdded ?? 0) > 0)
        ) {
          decline.unchanged = false;
        }
        continue;
      }
      if (
        entry.actionAlternatives?.some(
          (alternative) =>
            !alternative.selected &&
            alternative.whyNot?.some((reason) =>
              reason.startsWith(
                "runner_remote_run_declined_trash_memory_active:",
              ),
            ),
        )
      ) {
        metrics.runnerRepeatRemoteRunSuppressedAfterNoTrash += 1;
      }
      if (
        hasEvidenceFlag(
          entry,
          "runner_repeat_remote_after_declined_trash_penalized:true",
        )
      ) {
        metrics.runnerRepeatRemoteRunPenalizedAfterNoTrash += 1;
      }
      if (!serverId || !isRemoteServerTarget(serverId)) continue;
      if (entry.runnerRunStarted === true) {
        const decline = declinedTrashRemotes.get(serverId);
        if (!decline) continue;
        declinedTrashRemotes.delete(serverId);
        metrics.runnerRepeatRunOnSameRemoteAfterDecliningTrash += 1;
        if (decline.unchanged) {
          metrics.runnerRepeatRunOnSameRemoteNoNewInfo += 1;
          metrics.runnerRepeatRemoteAccessNoProgress += 1;
          if (decline.affordable)
            metrics.runnerRepeatRemoteNoTrashFixGateSuspicious += 1;
        }
      }
      if (entry.runnerRemoteAccessWithRelevantTrashableCard === true) {
        metrics.runnerRepeatAccessKnownRemote += 1;
        if (entry.runnerRemoteAccessWithTrashableCard === true) {
          metrics.runnerRepeatAccessKnownTrashableRemote += 1;
          if (entry.runnerRemoteTrashDeclined === true) {
            metrics.runnerRepeatAccessKnownTrashableRemoteWithoutTrash += 1;
            declinedTrashRemotes.set(serverId, {
              unchanged: true,
              affordable:
                entry.runnerSkippedAffordableRelevantRemoteTrash === true,
            });
          }
        }
      }
      if (
        entry.actionType === "steal_agenda" ||
        entry.actionType === "trash_accessed_card"
      ) {
        declinedTrashRemotes.delete(serverId);
      }
    }
  }
  return metrics;
}
