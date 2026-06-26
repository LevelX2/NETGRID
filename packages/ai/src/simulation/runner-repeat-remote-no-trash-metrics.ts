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
    let declinedTrashRemote: string | undefined;
    for (const entry of progressionEntriesWithRunTargets(
      summary.actionSequence,
    )) {
      if (entry.side !== "runner") continue;
      if (
        entry.runnerRemoteAccessWithRelevantTrashableCard === true &&
        isRemoteServerTarget(entry.targetServerId)
      ) {
        metrics.runnerRepeatAccessKnownRemote += 1;
        if (entry.runnerRemoteAccessWithTrashableCard === true) {
          metrics.runnerRepeatAccessKnownTrashableRemote += 1;
        }
        if (entry.runnerRemoteTrashTaken === true) {
          declinedTrashRemote = undefined;
        } else if (entry.runnerRemoteAccessWithTrashableCard === true) {
          metrics.runnerRepeatAccessKnownTrashableRemoteWithoutTrash += 1;
          declinedTrashRemote = entry.targetServerId;
        }
      }
      if (
        entry.actionType === "start_run" &&
        entry.targetServerId &&
        entry.targetServerId === declinedTrashRemote
      ) {
        metrics.runnerRepeatRunOnSameRemoteAfterDecliningTrash += 1;
        metrics.runnerRepeatRunOnSameRemoteNoNewInfo += 1;
        metrics.runnerRepeatRemoteAccessNoProgress += 1;
        metrics.runnerRepeatRemoteNoTrashFixGateSuspicious += 1;
      }
      if (
        hasEvidenceFlag(
          entry,
          "runner_repeat_remote_after_declined_trash_penalized:true",
        )
      ) {
        metrics.runnerRepeatRemoteRunPenalizedAfterNoTrash += 1;
      }
      if (
        declinedTrashRemote &&
        entry.actionType !== "start_run" &&
        entry.actionType !== "decline_trash" &&
        entry.runnerRemoteTrashTaken !== true
      ) {
        metrics.runnerRepeatRemoteRunSuppressedAfterNoTrash += 1;
        declinedTrashRemote = undefined;
      }
    }
  }
  return metrics;
}
