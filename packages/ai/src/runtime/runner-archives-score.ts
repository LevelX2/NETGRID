import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import { runnerRunProjectionPreservesNormalAccess } from "../actions/run-action-projection";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  eventMayChangeArchives,
  findLastHistoryIndex,
  isArchivesAccessEvent,
  mergedPublicHistory,
} from "../public-event-history";
import { runnerPressureVariationBucket } from "../runner-run-target-guidance";

/** A visible, currently payable win with no ICE or unresolved Archives effects. */
export function runnerVisibleArchivesWinningRun(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const view = input.playerView;
  if (
    evaluation.targetServerId !== "archives" ||
    evaluation.accessServerId !== "archives" ||
    evaluation.runActionProjection.sourceKind !== "basic_action" ||
    !runnerRunProjectionPreservesNormalAccess(
      input,
      evaluation.runActionProjection,
    ) ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.routeQuote?.reachability !== "guaranteed_access" ||
    evaluation.routeQuote.fundingGap !== 0 ||
    evaluation.routeQuote.effects.length !== 0 ||
    (evaluation.routeQuote.conditionalRiskReasons?.length ?? 0) !== 0 ||
    !input.legalActions.some(
      (action) =>
        action.actionId === evaluation.actionId &&
        action.side === "runner" &&
        action.type === "start_run" &&
        action.payload?.serverId === "archives" &&
        action.expiresAtStateVersion === view.stateVersion,
    )
  )
    return false;

  const archives = view.servers.find((server) => server.id === "archives");
  const pointsNeeded = view.agendaPointsToWin - view.own.agendaPoints;
  if (
    !archives ||
    archives.ice.length !== 0 ||
    archives.root.length !== view.opponent.discardCount ||
    pointsNeeded <= 0 ||
    archives.root.some((card) => {
      const definition =
        card.known && card.definitionId
          ? cardSpecPlanningCardByDefinitionId(card.definitionId)
          : undefined;
      return (
        !definition ||
        definition.planning.engine.accessEffects?.some(
          (effect) =>
            effect.kind === "on_access" &&
            effect.sourceZones.includes("archives") &&
            !effect.ignoreIfAccessedFrom?.includes("archives"),
        ) === true
      );
    })
  )
    return false;

  return archives.root.some((card) => {
    const quote = card.effectiveStealCostQuote;
    return (
      card.type === "agenda" &&
      card.agendaPoints !== undefined &&
      card.agendaPoints >= pointsNeeded &&
      quote?.complete === true &&
      quote.agendaInstanceId === card.instanceId &&
      quote.serverId === archives.id &&
      quote.stateVersion === view.stateVersion &&
      Number.isSafeInteger(quote.creditCost) &&
      quote.creditCost >= 0 &&
      quote.creditCost <= evaluation.creditsAfterRun
    );
  });
}

export function runnerArchivesHasQualifiedHiddenPayoff(
  input: AiDecisionInput,
): boolean {
  if (input.side !== "runner") return false;
  const hiddenArchivesCount = runnerHiddenArchivesCount(input);
  if (hiddenArchivesCount === 0) return false;
  return (
    input.playerView.opponent.deckCount <= 6 ||
    input.playerView.own.agendaPoints >=
      Math.max(1, input.playerView.agendaPointsToWin - 1) ||
    hiddenArchivesCount >= 10 ||
    unresolvedRandomCorpDiscard(input) ||
    runnerArchivesSpeculativeProbeDisposition(input).admitted
  );
}

function runnerHiddenArchivesCount(input: AiDecisionInput): number {
  const knownRootCount =
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.filter(
        (card) => card.known && typeof card.definitionId === "number",
      ).length ?? 0;
  return Math.max(0, input.playerView.opponent.discardCount - knownRootCount);
}

export function runnerArchivesSpeculativeProbeDisposition(
  input: AiDecisionInput,
): { admitted: boolean; bucket: number; opportunityKey: string } {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  const lastMutation = history
    .slice(lastArchivesAccessIndex + 1)
    .filter((event) => eventMayChangeArchives(event))
    .at(-1);
  const opportunityKey = [
    "archives-speculative-probe",
    input.seed,
    runnerHiddenArchivesCount(input),
    input.playerView.opponent.discardCount,
    lastMutation?.eventId ?? "initial-visible-state",
  ].join("|");
  const bucket = runnerPressureVariationBucket(opportunityKey, 8);
  return { admitted: bucket === 0, bucket, opportunityKey };
}

function unresolvedRandomCorpDiscard(input: AiDecisionInput): boolean {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  return history.slice(lastArchivesAccessIndex + 1).some((event) => {
    const payload = event.publicPayload;
    return (
      payload.actor === "corp" &&
      (payload.hiddenZoneAction === "hq_random_discard" ||
        payload.randomizedByCockroach === true ||
        (typeof payload.cardImplementationRandomHqDiscardCost === "number" &&
          payload.cardImplementationRandomHqDiscardCost > 0))
    );
  });
}
