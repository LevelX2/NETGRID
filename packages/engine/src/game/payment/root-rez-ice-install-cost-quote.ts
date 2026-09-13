import type {
  CorpRootRezIceInstallCostQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { canInstallCorpIceInServer } from "../install/corp-ice-install-restrictions";
import { quoteCorpIceInstallCost } from "./corp-rez-cost";

/** Quotes only the fixed, free activation of a pure installation-cost modifier.
 * No lifecycle, choice, credit income, or future LegalAction is synthesized.
 */
export function quoteCorpRootRezIceInstallCosts(
  state: GameState,
  action: LegalAction,
): CorpRootRezIceInstallCostQuote | undefined {
  const source = action.source ? state.cardInstances[action.source] : undefined;
  const server = state.corp.servers.find((s) =>
    source ? s.root.includes(source.instanceId) : false,
  );
  const implementation = source
    ? cardImplementationForDefinitionId(source.definitionId)
    : undefined;
  if (
    state.activeSide !== "corp" ||
    state.timingPoint !== "corp_action.main" ||
    state.run ||
    state.corp.clicks < 1 ||
    action.side !== "corp" ||
    action.type !== "rez_card" ||
    action.expiresAtStateVersion !== state.stateVersion ||
    action.timingPoint !== state.timingPoint ||
    action.costs.some((cost) =>
      Object.values(cost).some((value) => value !== 0),
    ) ||
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    source.rezzed ||
    !server ||
    !implementation?.modifiers?.length ||
    Object.keys(implementation).some(
      (key) => key !== "cardDefinitionId" && key !== "modifiers",
    ) ||
    implementation.modifiers.some(
      (modifier) =>
        modifier.kind !== "install_cost" ||
        modifier.operation !== "reduce" ||
        modifier.activeWhile !== "rezzed" ||
        modifier.sourceZone !== "corp_root" ||
        modifier.visibility !== "public",
    )
  )
    return undefined;

  const projected: GameState = {
    ...state,
    cardInstances: {
      ...state.cardInstances,
      [source.instanceId]: { ...source, faceup: true, rezzed: true },
    },
  };
  const installs = state.corp.hq.flatMap((id) => {
    const card = state.cardInstances[id];
    const definition = card
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]
      : undefined;
    if (!definition || !canInstallCorpIceInServer(definition, server))
      return [];
    const before = quoteCorpIceInstallCost(state, id, server);
    const after = quoteCorpIceInstallCost(projected, id, server);
    return before.canPay && after.finalCredits < before.finalCredits
      ? [
          {
            cardInstanceId: id,
            beforeCredits: before.finalCredits,
            afterCredits: after.finalCredits,
          },
        ]
      : [];
  });
  if (installs.length === 0) return undefined;
  return {
    schemaVersion: "corp-root-rez-ice-install-cost-quote-v1",
    actionId: action.actionId,
    sourceCardInstanceId: source.instanceId,
    targetServerId: server.id,
    stateVersion: state.stateVersion,
    installs,
  };
}
