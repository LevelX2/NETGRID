import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type VisibleCard,
  type VisibleCorpIcePostRezRunQuote,
  type ServerId,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { visibleCorpCard } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import { visibleCurrentIceBreakExchange } from "./visible-rez-resource-exchange-quote";
import { projectFixedCorpIcePostRezState } from "./fixed-ice-post-rez-state";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import { applyCreditGain } from "../economy/credit-gain";

/**
 * Quotes the run-facing state of one ICE without mutating GameState. Fixed
 * rez and an exactly bound x-strength LegalAction can be projected. Other
 * choice-dependent rez states remain incomplete. During an active run only
 * the currently approached ICE can be projected.
 */
export function visibleCorpIcePostRezRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
  action?: LegalAction,
): VisibleCorpIcePostRezRunQuote | undefined {
  return projectCorpIcePostRezRunQuote(state, iceId, visibleIce, action);
}

function projectCorpIcePostRezRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
  action?: LegalAction,
  projectionContext: "installed" | "post_install_minimum" = "installed",
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
  const variable = implementation?.variableRez;
  const value = action?.payload?.variableRezValue;
  const exactVariableAction =
    variable?.kind === "x_strength" &&
    action?.type === "rez_ice" &&
    action.side === "corp" &&
    action.source === iceId &&
    action.expiresAtStateVersion === state.stateVersion &&
    action.payload?.cardId === iceId &&
    action.payload.variableRezKind === "x_strength" &&
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= variable.minValue &&
    value <= variable.maxValue &&
    action.payload.effectiveStrengthAfterRez === value &&
    action.payload.variableRezAdditionalCost ===
      value * variable.additionalCostPerValue;
  // Installation cost quotes bind alternate-subtype ICE to its explicit
  // no-surcharge base branch. This internal projection never chooses an
  // installed ICE's current rez action or promotes a paid alternate subtype.
  const exactPostInstallBaseSubtype =
    projectionContext === "post_install_minimum" &&
    action === undefined &&
    variable?.kind === "alternate_subtype" &&
    variable.baseSubtypes.length > 0;
  if (
    (variable && !exactVariableAction && !exactPostInstallBaseSubtype) ||
    source.variableIceState
  ) {
    return {
      ...binding,
      complete: false,
      reason: "variable_rez_choice_required",
    };
  }
  const rezEffects = implementation?.lifecycle?.on_rez ?? [];
  // This projection supports only deterministic public Corp credit gains.
  // Other lifecycle effects and open choices keep their explicit boundary.
  if (
    rezEffects.length > 0 &&
    (source.controller !== "corp" ||
      state.pendingChoice !== undefined ||
      state.pendingCorpCreditGainReplacement !== undefined ||
      rezEffects.some(
        (effect) =>
          effect.kind !== "gain_credits" ||
          effect.visibility !== "public" ||
          (effect.recipient !== "corp" && effect.recipient !== "controller"),
      ))
  ) {
    return {
      ...binding,
      complete: false,
      reason: "on_rez_lifecycle_projection_required",
    };
  }
  const projectedState = projectFixedCorpIcePostRezState(state, iceId);
  if (projectedState && rezEffects.length > 0) {
    // Only these branches are writable by the admitted credit interpreter.
    // Keep the event log, RNG and unrelated card objects read-only and shared.
    projectedState.corp = { ...state.corp };
    if (state.actionEconomy)
      projectedState.actionEconomy = structuredClone(state.actionEconomy);
    const originalTimingPoint = projectedState.timingPoint;
    // A future ICE encounter cannot inherit mandatory-draw replacement relief.
    projectedState.timingPoint = "run.approach_ice";
    executeCardImplementationEffects(
      projectedState,
      {
        sourceCardId: iceId,
        sourceDefinitionId: definitionId,
        sourceTitle: CARD_DEFINITIONS_BY_ID[definitionId]!.title,
        controller: source.controller,
        reason: "card_lifecycle",
        isEffectSuspended: () =>
          Boolean(projectedState.pendingCorpCreditGainReplacement),
        gainCredits: (side, amount, gainOrdinal) =>
          applyCreditGain(projectedState, {
            side,
            baseAmount: amount,
            source: {
              kind: "card_effect",
              sourceDefinitionId: definitionId,
              sourceCardId: iceId,
              gainOrdinal,
              reason: "card_lifecycle",
            },
          }),
      },
      rezEffects,
    );
    projectedState.timingPoint = originalTimingPoint;
    if (projectedState.pendingCorpCreditGainReplacement) {
      return {
        ...binding,
        complete: false,
        reason: "on_rez_lifecycle_projection_required",
      };
    }
  }
  if (
    projectedState &&
    exactVariableAction &&
    variable?.kind === "x_strength"
  ) {
    projectedState.cardInstances[iceId]!.variableIceState = {
      family: "x_strength",
      value: value!,
      strength: value!,
      cap: variable.maxValue,
      additionalCostPaid: value! * variable.additionalCostPerValue,
      ...(variable.traceLimitFromValue ? { traceLimit: value! } : {}),
    };
  }
  if (
    projectedState &&
    exactPostInstallBaseSubtype &&
    variable?.kind === "alternate_subtype"
  ) {
    projectedState.cardInstances[iceId]!.variableIceState = {
      family: "alternate_subtype",
      value: 0,
      additionalCostPaid: 0,
      selectedSubtypes: [...variable.baseSubtypes],
    };
  }
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
  const effect = effectiveRunQuote.conditionalEncounterEffects?.[0];
  const paidEncounterDefense =
    isCurrentApproachedIce(state, iceId, server.id) &&
    projectedVisibleIce &&
    effectiveRunQuote.subroutines.length === 0 &&
    effectiveRunQuote.conditionalEncounterEffects?.length === 1 &&
    effect?.kind === "corp_paid_add_end_the_run_subroutine"
      ? {
          creditCost: effect.creditCost,
          exchange: visibleCurrentIceBreakExchange(
            state,
            iceId,
            projectedVisibleIce,
            effectiveRunQuote,
            1,
          ),
        }
      : undefined;
  return {
    ...binding,
    complete: true,
    effectiveRunQuote,
    ...(projectedState && rezEffects.length > 0
      ? {
          creditGainOnRez: {
            creditsBefore: state.corp.credits,
            creditGain: projectedState.corp.credits - state.corp.credits,
            creditsAfter: projectedState.corp.credits,
          },
        }
      : {}),
    ...(paidEncounterDefense ? { paidEncounterDefense } : {}),
  };
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
    ? projectCorpIcePostRezRunQuote(
        projected, iceId, visibleIce, undefined, "post_install_minimum",
      )
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
