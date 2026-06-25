import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import {
  eventMayChangeArchives,
  findLastHistoryIndex,
  isArchivesAccessEvent,
  mergedPublicHistory,
} from "./public-event-history";

export function staleKnownArchivesRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    action.payload?.serverId !== "archives"
  )
    return 0;
  if (
    input.legalActions.some(
      (candidate) =>
        candidate.type === "trash_accessed_card" ||
        candidate.type === "steal_agenda",
    )
  )
    return 0;
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  );
  const visibleArchivesCards = archives?.root ?? [];
  if (
    visibleArchivesCards.length === 0 ||
    visibleArchivesCards.some((card) => !card.known || !card.definitionId)
  )
    return 0;
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  if (lastArchivesAccessIndex < 0) return 0;
  if (
    history
      .slice(lastArchivesAccessIndex + 1)
      .some((event) => eventMayChangeArchives(event))
  )
    return 0;
  return 520;
}
