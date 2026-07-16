import type { AiDecisionInput } from "@netgrid/shared";

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
    return {
      kind: "opponent_matchpoint",
      pointsNeeded,
      remoteServerIds: [],
      evidence: [
        "terminal_contest_kind:opponent_matchpoint",
        `terminal_contest_points_needed:${pointsNeeded}`,
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
