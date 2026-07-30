import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";

export type CorpVisibleAgendaPredicate = (
  input: AiDecisionInput,
  card: VisibleCard,
) => boolean;

/**
 * Reads the exact score/defense execution receipt that permits the resident
 * score root to continue with its already bound agenda. This adapter owns no
 * plan discovery, action materialization, or executor selection.
 */
export function corpResidentScoreAgendaInstanceId(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
  visibleCardIsAgenda: CorpVisibleAgendaPredicate,
): string | undefined {
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
  const exactImmediateStagingReceipt =
    root !== undefined &&
    lease !== undefined &&
    commitment !== undefined &&
    lease.commitmentId === commitment.commitmentId &&
    lease.actionType === "install_card" &&
    lease.stateIdentity.stateVersion + 1 === input.playerView.stateVersion &&
    currentNode?.invocation.semanticActionType === "install.card" &&
    stagedIceInstanceId !== undefined &&
    input.playerView.servers.some((server) =>
      server.ice.some((ice) => ice.instanceId === stagedIceInstanceId),
    );
  const residentScoreStagingReceipt =
    residentScoreAgendaCardInstanceId !== undefined &&
    residentScoreServerId?.startsWith("remote_") === true &&
    typeof recentScoreStagingSignal?.sourceCardInstanceId === "string" &&
    input.playerView.servers.some(
      (server) =>
        server.id === residentScoreServerId &&
        server.ice.some(
          (ice) =>
            ice.instanceId === recentScoreStagingSignal.sourceCardInstanceId,
        ),
    );
  if (!exactImmediateStagingReceipt && !residentScoreStagingReceipt) {
    return undefined;
  }
  if (
    residentScoreAgendaCardInstanceId !== undefined &&
    input.playerView.own.gripOrHq.some(
      (card) =>
        card.instanceId === residentScoreAgendaCardInstanceId &&
        visibleCardIsAgenda(input, card),
    )
  ) {
    return residentScoreAgendaCardInstanceId;
  }
  if (!root) return undefined;
  return input.playerView.own.gripOrHq.find(
    (card) =>
      card.definitionId !== undefined &&
      root.dedupeKey.includes(`:${card.instanceId}:`) &&
      visibleCardIsAgenda(input, card),
  )?.instanceId;
}
