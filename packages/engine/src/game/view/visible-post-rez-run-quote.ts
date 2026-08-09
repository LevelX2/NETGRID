import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstanceId,
  type GameState,
  type VisibleCard,
  type VisibleCorpIcePostRezRunQuote,
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
 * Choice-dependent rez state and active-run context remain deliberately
 * incomplete; the eventual applied action must be projected from its new
 * authoritative state instead.
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
  if (state.run) {
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
