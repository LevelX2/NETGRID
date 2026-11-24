import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerEffectsOnlyTaxCorpIceInstalls } from "../../runner-canonical-hint-semantics";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../../public-event-history";
import { isRemoteServerTarget } from "../../runtime/server-target";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { sourceDefinitionIdForAction } from "../../runtime/visible-card-lookup";

export function runnerInstallTaxTarget(
  input: AiDecisionInputWithDeckCapabilities,
  definitionId: number,
  candidates: readonly ActionSemanticCandidate[],
): { target?: { actionId: string; serverId: string } } | undefined {
  if (
    input.side !== "runner" ||
    !runnerEffectsOnlyTaxCorpIceInstalls(
      AI_HINTS_BY_CARD.get(definitionId)?.effects,
    ) ||
    cardImplementationForDefinitionId(definitionId)?.installTargetBinding
      ?.kind !== "choose_data_fort_on_install"
  ) {
    return undefined;
  }

  const { playerView, legalActions } = input;
  const strategy = input.ownStrategicIntentState;
  const plannedTarget =
    strategy?.side === "runner" &&
    strategy.stateVersion === playerView.stateVersion &&
    strategy.transition.status !== "abandoned"
      ? strategy.targetVector
      : undefined;
  const currentTurn = playerView.turnSerial;
  const recentRuns = mergedPublicHistory(input).filter(
    (event) =>
      event.type === "start_run" &&
      event.publicPayload.actor === "runner" &&
      typeof event.turnSerial === "number" &&
      typeof currentTurn === "number" &&
      event.turnSerial >= currentTurn - 4 &&
      event.turnSerial <= currentTurn,
  );
  const ranked = candidates.flatMap((candidate) => {
    const action = legalActions.find(
      (offer) =>
        offer.actionId === candidate.actionId &&
        offer.source === candidate.sourceCardInstanceId &&
        offer.type === "install_card" &&
        actionMatchesCurrentDecision(input, offer),
    );
    const server = playerView.servers.find(
      (entry) => entry.id === action?.payload?.selectedServerId,
    );
    if (
      !action ||
      sourceDefinitionIdForAction(input, action) !== definitionId ||
      !server ||
      server.id === "archives"
    )
      return [];

    const central = server.id === "hq" || server.id === "rd";
    const planned =
      plannedTarget?.kind === (central ? "central" : "remote") &&
      plannedTarget.targetId === server.id;
    const recentRunTurns = new Set(
      recentRuns
        .filter((event) => serverIdFromEvent(event) === server.id)
        .map((event) => event.turnSerial),
    ).size;
    // Changing scoring remotes avoids the tax. An isolated agenda access
    // cannot establish recurring demand for ICE at that specific server.
    const establishedRemote =
      isRemoteServerTarget(server.id) &&
      planned &&
      recentRunTurns >= 2 &&
      server.ice.length > 0;
    if (central ? !planned && recentRunTurns < 2 : !establishedRemote)
      return [];

    return [
      {
        actionId: action.actionId,
        serverId: server.id,
        planned,
        installedIce: server.ice.length,
        recentRunTurns,
      },
    ];
  });
  const best = ranked.sort(
    (a, b) =>
      Number(b.planned) - Number(a.planned) ||
      b.recentRunTurns - a.recentRunTurns ||
      a.installedIce - b.installedIce ||
      a.actionId.localeCompare(b.actionId),
  )[0];
  return best
    ? { target: { actionId: best.actionId, serverId: best.serverId } }
    : {};
}
