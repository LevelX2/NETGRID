import type { AiDecisionInput } from "@netgrid/shared";
import { mergedPublicHistory } from "./public-event-history";

export type RunnerTerminalContestThreat = {
  kind: "opponent_matchpoint" | "visible_two_point_remote";
  pointsNeeded: number;
  remoteServerIds: string[];
  evidence: string[];
};

export function runnerTerminalContestThreat(
  input: AiDecisionInput,
): RunnerTerminalContestThreat | undefined {
  const pointsNeeded = Math.max(
    0,
    input.playerView.agendaPointsToWin - input.playerView.opponent.agendaPoints,
  );
  if (pointsNeeded === 1) {
    const previouslyScoredRemoteIds = new Set(
      mergedPublicHistory(input).flatMap((event) => {
        const payload = event.publicPayload;
        if (
          payload.actor !== "corp" ||
          (payload.actionType !== "score_agenda" &&
            event.type !== "score_agenda")
        ) {
          return [];
        }
        const targets =
          payload.targets &&
          typeof payload.targets === "object" &&
          !Array.isArray(payload.targets)
            ? (payload.targets as Record<string, unknown>)
            : undefined;
        const serverId =
          typeof payload.serverId === "string"
            ? payload.serverId
            : typeof targets?.scoredFromServerId === "string"
              ? targets.scoredFromServerId
              : undefined;
        return serverId?.startsWith("remote_") ? [serverId] : [];
      }),
    );
    const remoteServerIds = input.playerView.servers
      .filter(
        (server) =>
          server.id.startsWith("remote_") &&
          previouslyScoredRemoteIds.has(server.id) &&
          server.root.some(
            (card) => card.known === false || card.type === "agenda",
          ),
      )
      .map((server) => server.id)
      .sort();
    return {
      kind: "opponent_matchpoint",
      pointsNeeded,
      remoteServerIds,
      evidence: [
        "terminal_contest_kind:opponent_matchpoint",
        `terminal_contest_points_needed:${pointsNeeded}`,
        ...(remoteServerIds.length > 0
          ? [
              `terminal_contest_remote_servers:${remoteServerIds.join("|")}`,
              "terminal_contest_public_basis:occupied_remote_previously_scored_by_corp",
            ]
          : []),
      ],
    };
  }
  if (pointsNeeded !== 2) return undefined;

  const remoteServerIds = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.some(
          (card) =>
            (card.known === false || card.type === "agenda") &&
            (card.advancementCounters ?? 0) >= 2,
        ),
    )
    .map((server) => server.id)
    .sort();
  if (remoteServerIds.length === 0) return undefined;

  return {
    kind: "visible_two_point_remote",
    pointsNeeded,
    remoteServerIds,
    evidence: [
      "terminal_contest_kind:visible_two_point_remote",
      `terminal_contest_points_needed:${pointsNeeded}`,
      `terminal_contest_remote_servers:${remoteServerIds.join("|")}`,
      "terminal_contest_public_basis:unknown_or_agenda_root_with_two_advancement_counters",
    ],
  };
}
