import { type AiDecisionInput } from "@netgrid/shared";
import { mergedPublicHistory } from "./public-event-history";

export type AiObservedFacts = {
  eventCounts: Record<string, number>;
  publicServers: string[];
  tags: number;
  agendaPoints: { own: number; opponent: number };
};

export function buildObservedFacts(input: AiDecisionInput): AiObservedFacts {
  const eventCounts: Record<string, number> = {};
  for (const event of mergedPublicHistory(input))
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
  return {
    eventCounts,
    publicServers: input.playerView.servers.map((server) => server.id).sort(),
    tags: input.playerView.own.tags,
    agendaPoints: {
      own: input.playerView.own.agendaPoints,
      opponent: input.playerView.opponent.agendaPoints,
    },
  };
}
