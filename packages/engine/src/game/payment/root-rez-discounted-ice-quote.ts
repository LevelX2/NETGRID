import type {
  CorpRootRezDiscountedIceQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  discountedRezSourceIdsForRunIce,
  quoteCorpRezCost,
} from "./corp-rez-cost";

export function quoteCorpRootRezDiscountedIce(
  state: GameState,
  action: LegalAction,
): CorpRootRezDiscountedIceQuote | undefined {
  const run = state.run;
  const source = action.source ? state.cardInstances[action.source] : undefined;
  const implementation = source
    ? cardImplementationForDefinitionId(source.definitionId)
    : undefined;
  const server = state.corp.servers.find((s) => s.id === run?.attackedServerId);
  const ice = run?.approachedIceId
    ? state.cardInstances[run.approachedIceId]
    : undefined;
  if (
    state.activeSide !== "corp" ||
    state.timingPoint !== "run.approach_ice" ||
    run?.phase !== "approach_ice" ||
    run.bypassFirstIceRemaining === true ||
    run.position.kind !== "ice" ||
    !source ||
    source.rezzed ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    !server?.root.includes(source.instanceId) ||
    !ice ||
    ice.rezzed ||
    !server.ice.includes(ice.instanceId) ||
    cardImplementationForDefinitionId(ice.definitionId)?.variableRez !==
      undefined ||
    action.type !== "rez_card" ||
    action.side !== "corp" ||
    action.expiresAtStateVersion !== state.stateVersion ||
    action.timingPoint !== state.timingPoint ||
    action.costs.some((cost) =>
      Object.values(cost).some((value) => value !== 0),
    ) ||
    Object.keys(implementation ?? {}).some(
      (key) => key !== "cardDefinitionId" && key !== "fortRunWindows",
    ) ||
    implementation?.fortRunWindows?.length !== 1 ||
    implementation.fortRunWindows[0]?.kind !== "discounted_rez_ice_on_this_fort"
  )
    return undefined;

  const projected: GameState = {
    ...state,
    cardInstances: {
      ...state.cardInstances,
      [source.instanceId]: { ...source, faceup: true, rezzed: true },
    },
  };
  if (
    !discountedRezSourceIdsForRunIce(projected, ice.instanceId).includes(
      source.instanceId,
    )
  )
    return undefined;
  const ordinary = quoteCorpRezCost(state, ice.instanceId);
  const discounted = quoteCorpRezCost(projected, ice.instanceId, {
    discountedRezSourceCardId: source.instanceId,
  });
  if (
    !discounted.canPay ||
    discounted.finalCredits >= ordinary.finalCredits ||
    discounted.publicPayload.temporaryDerezAfterRun !== true ||
    discounted.costs.some((cost) =>
      Object.entries(cost).some(
        ([key, value]) => key !== "credits" && value !== 0,
      ),
    )
  )
    return undefined;
  return {
    schemaVersion: "corp-root-rez-discounted-ice-v1",
    actionId: action.actionId,
    sourceCardInstanceId: source.instanceId,
    targetServerId: server.id,
    targetIceInstanceId: ice.instanceId,
    runId: run.runId,
    stateVersion: state.stateVersion,
    ordinaryCredits: ordinary.finalCredits,
    discountedCredits: discounted.finalCredits,
    temporaryDerezAfterRun: true,
  };
}
