import { hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function corpScoreTerminalFollowupMetrics(
  actionSequence: AiSimulationSummary["actionSequence"],
): Pick<
  AiMatchProgressionMetrics,
  | "corpScoreTerminalSkippedThenAgendaStolen"
  | "corpScoreTerminalSkippedThenNoScoreWindow"
  | "corpScoreTerminalSkippedThenActionLimit"
  | "corpScoreTerminalSkippedThenProtectionLoop"
  | "corpScoreTerminalSkippedThenEconomyLoop"
  | "corpScoreTerminalSkippedThenRemoteStillSafe"
  | "corpScoreTerminalSkippedThenScoreNextDecision"
> {
  let corpScoreTerminalSkippedThenAgendaStolen = 0;
  let corpScoreTerminalSkippedThenNoScoreWindow = 0;
  let corpScoreTerminalSkippedThenActionLimit = 0;
  let corpScoreTerminalSkippedThenProtectionLoop = 0;
  let corpScoreTerminalSkippedThenEconomyLoop = 0;
  let corpScoreTerminalSkippedThenRemoteStillSafe = 0;
  let corpScoreTerminalSkippedThenScoreNextDecision = 0;
  const skippedEntries = actionSequence
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.corpScoreTerminalSkipped === true);

  for (const { entry, index } of skippedEntries) {
    const future = actionSequence.slice(index + 1, index + 13);
    const futureCorp = future.filter((candidate) => candidate.side === "corp");
    const nextCorp = futureCorp[0];
    const scoreLike = (candidate: AiSimulationActionSequenceEntry) =>
      candidate.corpScoreTerminalScoreTaken === true ||
      candidate.corpScoreTerminalAdvanceTaken === true ||
      candidate.corpScoreTerminalAgendaInstalled === true ||
      candidate.actionType === "score_agenda";

    if (
      future.some(
        (candidate) =>
          candidate.side === "runner" &&
          candidate.actionType === "steal_agenda",
      )
    )
      corpScoreTerminalSkippedThenAgendaStolen += 1;

    if (nextCorp && scoreLike(nextCorp))
      corpScoreTerminalSkippedThenScoreNextDecision += 1;

    if (!futureCorp.slice(0, 3).some(scoreLike))
      corpScoreTerminalSkippedThenNoScoreWindow += 1;

    if (index >= actionSequence.length - 6 && !futureCorp.some(scoreLike))
      corpScoreTerminalSkippedThenActionLimit += 1;

    if (
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalSkippedForProtection === true ||
            hasEvidenceFlag(
              candidate,
              "corp_protection_loop_after_remote_safe:true",
            ),
        )
    )
      corpScoreTerminalSkippedThenProtectionLoop += 1;

    if (
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalSkippedForEconomy === true ||
            hasEvidenceFlag(candidate, "corp_economy_before_score_window:true"),
        )
    )
      corpScoreTerminalSkippedThenEconomyLoop += 1;

    if (
      entry.corpScoreTerminalWindowProtectedRemoteReady === true ||
      futureCorp
        .slice(0, 3)
        .some(
          (candidate) =>
            candidate.corpScoreTerminalWindowProtectedRemoteReady === true,
        )
    )
      corpScoreTerminalSkippedThenRemoteStillSafe += 1;
  }

  return {
    corpScoreTerminalSkippedThenAgendaStolen,
    corpScoreTerminalSkippedThenNoScoreWindow,
    corpScoreTerminalSkippedThenActionLimit,
    corpScoreTerminalSkippedThenProtectionLoop,
    corpScoreTerminalSkippedThenEconomyLoop,
    corpScoreTerminalSkippedThenRemoteStillSafe,
    corpScoreTerminalSkippedThenScoreNextDecision,
  };
}
