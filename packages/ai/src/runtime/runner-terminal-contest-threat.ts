import type { AiDecisionInput } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { mergedPublicHistory } from "./public-event-history";

/** Reconcealment does not erase an exposure that the belief owner still validates. */
function rootMayBeAgenda(
  input: AiDecisionInput,
  serverId: string,
  card: AiDecisionInput["playerView"]["servers"][number]["root"][number],
  index: number,
): boolean {
  if (card.known !== false) return card.type === "agenda";
  const memory = reconstructBeliefState(
    input,
  ).runnerOpponentModel?.knownPositionMemory.find(
    (entry) =>
      entry.zone === serverId &&
      entry.positionKey === `root:${index}` &&
      entry.invalidatedBy.length === 0,
  );
  if (!memory) return true;
  const definition = CARD_DEFINITIONS_BY_ID[memory.definitionId];
  if (!definition) {
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Restore the canonical definition for the validated remembered remote root.",
    });
  }
  return definition.type === "agenda";
}

export type RunnerTerminalContestThreat = {
  kind:
    | "opponent_matchpoint"
    | "visible_two_point_remote"
    | "visible_three_point_remote"
    | "protected_two_point_matchpoint_remote";
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
          server.root.some((card, index) =>
            rootMayBeAgenda(input, server.id, card, index),
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
  if (pointsNeeded === 3) {
    const visibleThreePointRemoteIds = input.playerView.servers
      .filter(
        (server) =>
          server.id.startsWith("remote_") &&
          server.root.some(
            (card, index) =>
              rootMayBeAgenda(input, server.id, card, index) &&
              (card.advancementCounters ?? 0) >= 1,
          ),
      )
      .map((server) => server.id)
      .sort();
    if (visibleThreePointRemoteIds.length === 0) return undefined;
    return {
      kind: "visible_three_point_remote",
      pointsNeeded,
      remoteServerIds: visibleThreePointRemoteIds,
      evidence: [
        "terminal_contest_kind:visible_three_point_remote",
        `terminal_contest_points_needed:${pointsNeeded}`,
        `terminal_contest_remote_servers:${visibleThreePointRemoteIds.join("|")}`,
        "terminal_contest_public_basis:unknown_or_agenda_root_with_one_advancement_counter",
      ],
    };
  }
  if (pointsNeeded !== 2) return undefined;

  const visibleTwoPointRemoteIds = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.some(
          (card, index) =>
            rootMayBeAgenda(input, server.id, card, index) &&
            (card.advancementCounters ?? 0) >= 2,
        ),
    )
    .map((server) => server.id)
    .sort();
  if (visibleTwoPointRemoteIds.length > 0) {
    return {
      kind: "visible_two_point_remote",
      pointsNeeded,
      remoteServerIds: visibleTwoPointRemoteIds,
      evidence: [
        "terminal_contest_kind:visible_two_point_remote",
        `terminal_contest_points_needed:${pointsNeeded}`,
        `terminal_contest_remote_servers:${visibleTwoPointRemoteIds.join("|")}`,
        "terminal_contest_public_basis:unknown_or_agenda_root_with_two_advancement_counters",
      ],
    };
  }

  const protectedHiddenRemoteIds = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.ice.length >= 2 &&
        server.root.some(
          (card, index) =>
            card.known === false &&
            rootMayBeAgenda(input, server.id, card, index),
        ),
    )
    .map((server) => server.id)
    .sort();
  if (protectedHiddenRemoteIds.length === 0) return undefined;
  return {
    kind: "protected_two_point_matchpoint_remote",
    pointsNeeded,
    remoteServerIds: protectedHiddenRemoteIds,
    evidence: [
      "terminal_contest_kind:protected_two_point_matchpoint_remote",
      `terminal_contest_points_needed:${pointsNeeded}`,
      `terminal_contest_remote_servers:${protectedHiddenRemoteIds.join("|")}`,
      "terminal_contest_public_basis:protected_unknown_root_at_two_point_matchpoint",
    ],
  };
}

/** Public target fact shared by route admission and the existing contest owner. */
export function runnerTargetHasTerminalContestThreat(
  input: AiDecisionInput,
  targetServerId: string,
): boolean {
  const terminalThreat = runnerTerminalContestThreat(input);
  if (!terminalThreat) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const visiblyAdvancedRoot =
    server?.root.some(
      (card, index) =>
        rootMayBeAgenda(input, server.id, card, index) &&
        (card.advancementCounters ?? 0) > 0,
    ) === true;
  const repeatedMatchpointRemote =
    terminalThreat.remoteServerIds.includes(targetServerId);
  if (!visiblyAdvancedRoot && !repeatedMatchpointRemote) {
    return false;
  }
  return (
    terminalThreat.kind === "opponent_matchpoint" || repeatedMatchpointRemote
  );
}
