import type { AiDecisionInput } from "@netgrid/shared";
import {
  eventMayChangeArchives,
  findLastHistoryIndex,
  isArchivesAccessEvent,
  mergedPublicHistory,
} from "../public-event-history";
import { runnerPressureVariationBucket } from "../runner-run-target-guidance";

export function runnerArchivesHasQualifiedHiddenPayoff(
  input: AiDecisionInput,
): boolean {
  if (input.side !== "runner") return false;
  const hiddenArchivesCount = runnerHiddenArchivesCount(input);
  if (hiddenArchivesCount === 0) return false;
  return (
    input.playerView.opponent.deckCount <= 6 ||
    input.playerView.own.agendaPoints >=
      Math.max(1, input.playerView.agendaPointsToWin - 1) ||
    hiddenArchivesCount >= 10 ||
    unresolvedRandomCorpDiscard(input) ||
    runnerArchivesSpeculativeProbeDisposition(input).admitted
  );
}

function runnerHiddenArchivesCount(input: AiDecisionInput): number {
  const knownRootCount =
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.filter(
        (card) => card.known && typeof card.definitionId === "string",
      ).length ?? 0;
  return Math.max(0, input.playerView.opponent.discardCount - knownRootCount);
}

export function runnerArchivesSpeculativeProbeDisposition(
  input: AiDecisionInput,
): { admitted: boolean; bucket: number; opportunityKey: string } {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  const lastMutation = history
    .slice(lastArchivesAccessIndex + 1)
    .filter((event) => eventMayChangeArchives(event))
    .at(-1);
  const opportunityKey = [
    "archives-speculative-probe",
    input.seed,
    runnerHiddenArchivesCount(input),
    input.playerView.opponent.discardCount,
    lastMutation?.eventId ?? "initial-visible-state",
  ].join("|");
  const bucket = runnerPressureVariationBucket(opportunityKey, 8);
  return { admitted: bucket === 0, bucket, opportunityKey };
}

function unresolvedRandomCorpDiscard(input: AiDecisionInput): boolean {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  return history.slice(lastArchivesAccessIndex + 1).some((event) => {
    const payload = event.publicPayload;
    return (
      payload.actor === "corp" &&
      (payload.hiddenZoneAction === "hq_random_discard" ||
        payload.randomizedByCockroach === true ||
        (typeof payload.cardImplementationRandomHqDiscardCost === "number" &&
          payload.cardImplementationRandomHqDiscardCost > 0))
    );
  });
}
