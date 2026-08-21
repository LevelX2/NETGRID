import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";

export type CorpVisibleAgendaPredicate = (
  input: AiDecisionInput,
  card: VisibleCard,
) => boolean;

export type CorpResidentScoreDefenseBinding = Readonly<{
  agendaInstanceId: string;
  serverId: string;
}>;

/**
 * A concrete, empty remote with an Engine-quoted ICE interaction is never a
 * blank scoring target. The exact score-protection probability model may
 * deliberately leave conditional, damaging, taxing, or encounter-disrupting
 * subroutines unquantified, but corp.score_agenda must still preserve the
 * strictly better server topology instead of opening an empty sibling remote.
 *
 * This is intentionally a reuse/dominance fact, not a claim that the remote
 * already satisfies the score-protection threshold. Assets in the root keep
 * the server available for an explicit parallel-remote decision.
 */
export function corpRemoteHasEngineQuotedReusableScoreFriction(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) =>
      candidate.id === serverId && candidate.id.startsWith("remote_"),
  );
  if (!server || server.root.length > 0 || server.ice.length === 0) {
    return false;
  }
  return server.ice.some((ice) =>
    ice.rezzed === true
      ? (ice.effectiveRunQuote?.subroutines.length ?? 0) > 0
      : corpIceHasExactPostRezRunFriction(input, ice, serverId),
  );
}

/**
 * Certifies that one exact unrezzed ICE in the bound remote has both an
 * Engine-quoted non-empty post-rez interaction and a currently fundable rez
 * route. This deliberately accepts taxing, damaging, tagging and encounter-
 * disrupting subroutines in addition to ETR; the score owner still performs
 * its separate rush-risk assessment before admitting the agenda install.
 */
export function corpRemoteHasEngineQuotedFundableScoreFriction(
  input: AiDecisionInput,
  serverId: string,
  maximumAdditionalRezCredits: number,
): boolean {
  if (
    !Number.isSafeInteger(maximumAdditionalRezCredits) ||
    maximumAdditionalRezCredits < 0
  ) {
    return false;
  }
  const server = input.playerView.servers.find(
    (candidate) =>
      candidate.id === serverId &&
      candidate.id.startsWith("remote_") &&
      candidate.root.length === 0,
  );
  if (!server) return false;
  return server.ice.some((ice) => {
    if (
      ice.rezzed === true ||
      !corpIceHasExactPostRezRunFriction(input, ice, serverId)
    ) {
      return false;
    }
    const quote = ice.effectiveRezCostQuote;
    if (
      quote?.context !== "installed" ||
      quote.cardId !== ice.instanceId ||
      quote.targetServerId !== serverId ||
      quote.projectedServerId !== serverId ||
      quote.expiresAtStateVersion !== input.playerView.stateVersion ||
      quote.complete !== true ||
      quote.mandatoryAdditionalCosts.agendaPoints !== 0 ||
      !Number.isSafeInteger(quote.finalCredits) ||
      quote.finalCredits < 0
    ) {
      return false;
    }
    return (
      Math.max(0, quote.finalCredits - input.playerView.own.credits) <=
      maximumAdditionalRezCredits
    );
  });
}

function corpIceHasExactPostRezRunFriction(
  input: AiDecisionInput,
  ice: VisibleCard,
  serverId: string,
): boolean {
  const quote = ice.effectivePostRezRunQuote;
  return (
    quote?.context === "installed_post_rez" &&
    quote.complete === true &&
    quote.cardId === ice.instanceId &&
    quote.targetServerId === serverId &&
    quote.projectedServerId === serverId &&
    quote.expiresAtStateVersion === input.playerView.stateVersion &&
    quote.effectiveRunQuote.iceInstanceId === ice.instanceId &&
    quote.effectiveRunQuote.subroutines.length > 0
  );
}

/**
 * Reads the exact score/defense execution receipt that permits the resident
 * score root to continue with its already bound agenda. This adapter owns no
 * plan discovery, action materialization, or executor selection.
 */
export function corpResidentScoreDefenseBinding(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
  visibleCardIsAgenda: CorpVisibleAgendaPredicate,
): CorpResidentScoreDefenseBinding | undefined {
  const commitment = previous?.turnPlanCommitment;
  const committedRootPlanInstanceId =
    commitment?.phases[commitment.cursor.phaseIndex]?.root.planInstanceId;
  const executorScoreAncestor = (() => {
    if (!previous?.executorInstanceId) return undefined;
    const visited = new Set<string>();
    let instanceId: string | undefined = previous.executorInstanceId;
    while (instanceId && !visited.has(instanceId)) {
      visited.add(instanceId);
      const instance = previous.instances.find(
        (candidate) => candidate.instanceId === instanceId,
      );
      if (!instance) return undefined;
      if (instance.moduleId === "corp.score_agenda") return instance;
      instanceId = instance.parentInstanceId;
    }
    return undefined;
  })();
  const root =
    executorScoreAncestor ??
    previous?.instances.find(
      (instance) =>
        (instance.instanceId === previous.rootForegroundInstanceId ||
          instance.instanceId === committedRootPlanInstanceId) &&
        instance.moduleId === "corp.score_agenda",
    );
  const residentScoreState = root?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          agendaInstanceId?: unknown;
          serverId?: unknown;
        };
      }
    | undefined;
  const residentScoreAgendaCardInstanceId =
    residentScoreState?.kind === "score" &&
    typeof residentScoreState.signal?.agendaInstanceId === "string"
      ? residentScoreState.signal.agendaInstanceId
      : undefined;
  const residentScoreServerId =
    residentScoreState?.kind === "score" &&
    typeof residentScoreState.signal?.serverId === "string"
      ? residentScoreState.signal.serverId
      : undefined;
  const residentDefenseExecutor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.parentInstanceId === root?.instanceId,
  );
  const residentDefenseState = residentDefenseExecutor?.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          serverId?: unknown;
          parentProjectId?: unknown;
          sourceCardInstanceId?: unknown;
        }>;
      }
    | undefined;
  const recentScoreStagingSignal =
    residentDefenseState?.kind === "defense" &&
    residentDefenseExecutor?.updatedAtStateVersion ===
      input.playerView.stateVersion - 1
      ? residentDefenseState.signals?.find(
          (signal) =>
            signal.kind === "score_protection_staging_install" &&
            signal.serverId === residentScoreServerId &&
            signal.parentProjectId === root?.dedupeKey,
        )
      : undefined;
  const lease = previous?.turnPlanExecutionLease;
  const currentNode =
    commitment?.phases[commitment.cursor.phaseIndex]?.nodes[
      commitment.cursor.nodeIndex
    ];
  const stagedIceInstanceId = currentNode?.invocation.sourceCardInstanceId;
  const exactImmediateStagingServers =
    stagedIceInstanceId === undefined
      ? []
      : input.playerView.servers.filter((server) =>
          server.ice.some((ice) => ice.instanceId === stagedIceInstanceId),
        );
  const exactImmediateStagingReceipt =
    root !== undefined &&
    lease !== undefined &&
    commitment !== undefined &&
    lease.commitmentId === commitment.commitmentId &&
    lease.actionType === "install_card" &&
    lease.stateIdentity.stateVersion + 1 === input.playerView.stateVersion &&
    currentNode?.invocation.semanticActionType === "install.card" &&
    stagedIceInstanceId !== undefined &&
    exactImmediateStagingServers.length === 1;
  const residentScoreStagingServers =
    typeof recentScoreStagingSignal?.sourceCardInstanceId === "string"
      ? input.playerView.servers.filter(
          (server) =>
            server.id.startsWith("remote_") &&
            (residentScoreServerId === "new_remote" ||
              server.id === residentScoreServerId) &&
            server.ice.some(
              (ice) =>
                ice.instanceId ===
                recentScoreStagingSignal.sourceCardInstanceId,
            ),
        )
      : [];
  const residentScoreStagingReceipt =
    residentScoreAgendaCardInstanceId !== undefined &&
    (residentScoreServerId === "new_remote" ||
      residentScoreServerId?.startsWith("remote_") === true) &&
    typeof recentScoreStagingSignal?.sourceCardInstanceId === "string" &&
    residentScoreStagingServers.length === 1;
  const residentConcreteScoreServers =
    residentScoreAgendaCardInstanceId !== undefined &&
    residentScoreServerId?.startsWith("remote_") === true
      ? input.playerView.servers.filter(
          (server) =>
            server.id === residentScoreServerId && server.ice.length > 0,
        )
      : [];
  const residentConcreteScoreReceipt =
    residentConcreteScoreServers.length === 1 &&
    input.playerView.own.gripOrHq.some(
      (card) =>
        card.instanceId === residentScoreAgendaCardInstanceId &&
        visibleCardIsAgenda(input, card),
    );
  if (
    !exactImmediateStagingReceipt &&
    !residentScoreStagingReceipt &&
    !residentConcreteScoreReceipt
  ) {
    return undefined;
  }
  const resolvedServerId = residentConcreteScoreReceipt
    ? residentConcreteScoreServers[0]!.id
    : residentScoreStagingReceipt
      ? residentScoreStagingServers[0]!.id
      : exactImmediateStagingServers[0]!.id;
  if (
    residentScoreAgendaCardInstanceId !== undefined &&
    input.playerView.own.gripOrHq.some(
      (card) =>
        card.instanceId === residentScoreAgendaCardInstanceId &&
        visibleCardIsAgenda(input, card),
    )
  ) {
    return {
      agendaInstanceId: residentScoreAgendaCardInstanceId,
      serverId: resolvedServerId,
    };
  }
  if (!root) return undefined;
  const agendaInstanceId = input.playerView.own.gripOrHq.find(
    (card) =>
      card.definitionId !== undefined &&
      root.dedupeKey.includes(`:${card.instanceId}:`) &&
      visibleCardIsAgenda(input, card),
  )?.instanceId;
  return agendaInstanceId
    ? { agendaInstanceId, serverId: resolvedServerId }
    : undefined;
}

export function corpResidentScoreAgendaInstanceId(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
  visibleCardIsAgenda: CorpVisibleAgendaPredicate,
): string | undefined {
  return corpResidentScoreDefenseBinding(
    previous,
    input,
    visibleCardIsAgenda,
  )?.agendaInstanceId;
}
