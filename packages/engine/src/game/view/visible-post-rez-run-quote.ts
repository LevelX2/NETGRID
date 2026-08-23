import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardInstanceId,
  type GameState,
  type VisibleCard,
  type VisibleCorpIcePostRezRunQuote,
  type ServerId,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { visibleCorpCard } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";

/**
 * Projects the deterministic state transition shared by every fixed ICE rez.
 * Lifecycle effects are not reproduced here: callers must reject cards with
 * on-rez lifecycle work before using this narrow state projection.
 */
export function projectFixedCorpIcePostRezState(
  state: GameState,
  iceId: CardInstanceId,
): GameState | undefined {
  const source = state.cardInstances[iceId];
  if (!source || source.rezzed) return undefined;
  return {
    ...state,
    cardInstances: {
      ...state.cardInstances,
      [iceId]: {
        ...source,
        faceup: true,
        rezzed: true,
      },
    },
  };
}

/**
 * Quotes the run-facing state of one fixed-rez ICE without mutating GameState.
 * Choice-dependent rez state remains deliberately incomplete. During an
 * active run only the exact currently approached fixed ICE can be projected;
 * every other active-run ICE remains incomplete.
 */
export function visibleCorpIcePostRezRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
): VisibleCorpIcePostRezRunQuote | undefined {
  const source = state.cardInstances[iceId];
  const definitionId = visibleIce.definitionId;
  const server = state.corp.servers.find((candidate) =>
    candidate.ice.includes(iceId),
  );
  if (
    !server ||
    !source ||
    source.rezzed ||
    visibleIce.known !== true ||
    visibleIce.type !== "ice" ||
    !definitionId ||
    source.definitionId !== definitionId ||
    CARD_DEFINITIONS_BY_ID[definitionId]?.type !== "ice"
  ) {
    return undefined;
  }
  const binding = {
    context: "installed_post_rez" as const,
    cardId: iceId,
    iceDefinitionId: definitionId,
    targetServerId: server.id,
    projectedServerId: server.id,
    expiresAtStateVersion: state.stateVersion,
  };
  if (state.run && !isCurrentApproachedIce(state, iceId, server.id)) {
    return { ...binding, complete: false, reason: "active_run_context" };
  }
  const implementation = cardImplementationForDefinitionId(definitionId);
  if (implementation?.variableRez || source.variableIceState) {
    return {
      ...binding,
      complete: false,
      reason: "variable_rez_choice_required",
    };
  }
  if ((implementation?.lifecycle?.on_rez?.length ?? 0) > 0) {
    return {
      ...binding,
      complete: false,
      reason: "on_rez_lifecycle_projection_required",
    };
  }
  const projectedState = projectFixedCorpIcePostRezState(state, iceId);
  const projectedVisibleIce = projectedState
    ? visibleCorpCard(projectedState, iceId, "corp", "ice")
    : undefined;
  const effectiveRunQuote = projectedVisibleIce
    ? visibleEffectiveIceRunQuote(projectedState!, iceId, projectedVisibleIce)
    : undefined;
  if (!effectiveRunQuote) {
    return {
      ...binding,
      complete: false,
      reason: "effective_run_projection_unavailable",
    };
  }
  return { ...binding, complete: true, effectiveRunQuote };
}

export function visibleCorpIcePostInstallRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  targetServerId: ServerId,
  projectedServerId: Exclude<ServerId, "new_remote">,
): VisibleCorpIcePostRezRunQuote | undefined {
  const source = state.cardInstances[iceId];
  if (
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "hq" ||
    !state.corp.hq.includes(iceId)
  ) {
    return undefined;
  }
  const projected = structuredClone(state);
  const projectedSource = projected.cardInstances[iceId]!;
  const existingServer = projected.corp.servers.find(
    (server) => server.id === projectedServerId,
  );
  const server =
    targetServerId === "new_remote"
      ? {
          id: projectedServerId,
          kind: "remote" as const,
          label: `Remote ${projectedServerId.slice("remote_".length)}`,
          ice: [] as CardInstanceId[],
          root: [] as CardInstanceId[],
        }
      : existingServer;
  if (!server || (targetServerId === "new_remote" && existingServer)) {
    return undefined;
  }
  if (targetServerId === "new_remote") projected.corp.servers.push(server);
  projected.corp.hq = projected.corp.hq.filter((id) => id !== iceId);
  server.ice.push(iceId);
  projected.cardInstances[iceId] = {
    ...projectedSource,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId: projectedServerId },
  };
  const visibleIce = visibleCorpCard(projected, iceId, "corp", "ice");
  return visibleIce
    ? visibleCorpIcePostRezRunQuote(projected, iceId, visibleIce)
    : undefined;
}

function isCurrentApproachedIce(
  state: GameState,
  iceId: CardInstanceId,
  serverId: string,
): boolean {
  const run = state.run;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    state.timingPoint === "run.approach_ice" &&
    run?.phase === "approach_ice" &&
    run.attackedServerId === serverId &&
    run.position.kind === "ice" &&
    run.position.serverId === serverId &&
    run.approachedIceId === iceId &&
    server?.ice[run.position.iceIndex] === iceId
  );
}
