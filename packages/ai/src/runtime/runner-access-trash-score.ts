import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

type RunnerAccessTrashContext = {
  trashable: boolean;
  affordableRelevant: boolean;
  highImpact: boolean;
  trashCost: number;
  generalCreditCost: number;
  creditsAfterGeneralTrash: number;
  reserveTarget: number;
  deferredByBudget: boolean;
  centralAccess: boolean;
  acuteThreat?: boolean;
  finitePoolEconomy?: boolean;
  corpValueRemaining?: number;
  dropsBelowReserve?: boolean;
  accessServerId?: string;
  targetType?: string;
  role?: string;
};

export type RunnerAccessTrashScoreDependencies = {
  trashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerAccessTrashContext;
};

export function runnerAccessTrashScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerAccessTrashScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const context = dependencies.trashAccessContext(input, action);
  if (!context.trashable) return components;
  const takingTrash = action.type === "trash_accessed_card";
  // Keep the ordinary central-run working reserve bounded. The broader
  // reserveTarget may include an unrelated expensive remote and must not turn
  // every affordable central trash into a permanent decline.
  const matchpointCentralEconomyReserveTarget = 4;
  const highRemainingFinitePool =
    context.finitePoolEconomy === true &&
    (context.corpValueRemaining ?? 0) >= Math.max(context.trashCost + 2, 8);
  const followUpRun =
    input.playerView.own.clicks >= 1
      ? plausibleFollowUpRunAfterTrash(
          input,
          context.creditsAfterGeneralTrash,
        )
      : undefined;
  const breaksMatchpointCentralEconomyReserve =
    context.centralAccess &&
    context.role === "economy" &&
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 1 &&
    context.creditsAfterGeneralTrash < matchpointCentralEconomyReserveTarget &&
    context.acuteThreat !== true &&
    !highRemainingFinitePool &&
    followUpRun !== undefined;
  if (takingTrash) {
    components.push({
      key: "runner_trash_affordability",
      label: "Trash-Kosten zahlbar",
      value:
        input.playerView.own.credits >= context.generalCreditCost
          ? context.centralAccess
            ? 220
            : 600
          : -1200,
      reason: `credits:${input.playerView.own.credits};cost:${context.trashCost};general_cost:${context.generalCreditCost}`,
    });
    if (context.centralAccess) {
      components.push({
        key: "runner_central_access_trash_low_corp_investment",
        label: "Zentralzugriff ohne Korp-Install",
        value: -900,
        reason: context.accessServerId ?? "central",
      });
    }
    if (breaksMatchpointCentralEconomyReserve) {
      components.push({
        key: "runner_matchpoint_central_economy_trash_reserve",
        label: "Matchpoint-Runreserve vor Zentral-Trash",
        value: -3_200,
        reason: `credits_after:${context.creditsAfterGeneralTrash};reserve:${matchpointCentralEconomyReserveTarget};role:${context.role};follow_up_server:${followUpRun?.serverId}`,
      });
    }
    if (context.deferredByBudget) {
      components.push({
        key: "runner_access_trash_deferred_by_budget",
        label: "Budget nach Trash zu niedrig",
        value: -5600,
        reason: `credits_after:${context.creditsAfterGeneralTrash};reserve:${context.reserveTarget}`,
      });
    }
    if (context.role === "low_value") {
      components.push({
        key: "runner_access_trash_low_value",
        label: "Niedriger Trash-Wert",
        value: -5200,
        reason: context.targetType ?? "unknown",
      });
    }
  } else {
    if (breaksMatchpointCentralEconomyReserve) {
      components.push({
        key: "runner_decline_matchpoint_central_economy_trash",
        label: "Matchpoint-Runreserve erhalten",
        value: 2_400,
        reason: `credits_after_trash:${context.creditsAfterGeneralTrash};reserve:${matchpointCentralEconomyReserveTarget};role:${context.role};follow_up_server:${followUpRun?.serverId}`,
      });
    }
    if (context.deferredByBudget) {
      components.push({
        key: "runner_decline_trash_preserve_budget",
        label: "Budget erhalten",
        value: 3600,
        reason: `credits_after_trash:${context.creditsAfterGeneralTrash};reserve:${context.reserveTarget}`,
      });
    } else if (context.role === "low_value") {
      components.push({
        key: "runner_decline_low_value_trash",
        label: "Niedrigen Trash ablehnen",
        value: 2600,
        reason: context.targetType ?? "unknown",
      });
    } else if (context.affordableRelevant && context.highImpact) {
      components.push({
        key: "runner_decline_relevant_trash",
        label: "Relevanten Trash liegenlassen",
        value: -1800,
        reason: context.role ?? "relevant",
      });
    }
  }
  return components;
}

function plausibleFollowUpRunAfterTrash(
  input: AiDecisionInput,
  creditsAfterTrash: number,
): { serverId: string } | undefined {
  for (const server of input.playerView.servers) {
    if (!serverHasAccessPayoff(input, server.id)) continue;
    const path = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      runnerRunPathCreditBudgetWithVisiblePools(
        creditsAfterTrash,
        input.playerView.own.rig ?? [],
      ),
      server.root,
      input.playerView.opponent.credits,
      {
        visibleRemoteServerCount: input.playerView.servers.filter((entry) =>
          entry.id.startsWith("remote_"),
        ).length,
        visibleCorpCredits: input.playerView.opponent.credits,
      },
    );
    if (!path.canReachAccess) continue;
    const unknownIceProbeReserve = server.ice.filter(
      (ice) => ice.rezzed !== true || !ice.known || !ice.definitionId,
    ).length;
    if (
      (path.visibleBreakCost ?? 0) + unknownIceProbeReserve <= creditsAfterTrash
    ) {
      return { serverId: server.id };
    }
  }
  return undefined;
}

function serverHasAccessPayoff(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  if (serverId === "hq") return input.playerView.opponent.handCount > 0;
  if (serverId === "rd") return input.playerView.opponent.deckCount > 0;
  if (serverId === "archives") {
    return input.playerView.opponent.discardCount > 0;
  }
  const server = input.playerView.servers.find((entry) => entry.id === serverId);
  return (
    serverId.startsWith("remote_") &&
    server?.root.some(
      (card) => !card.known || !card.definitionId || card.type === "agenda",
    ) === true
  );
}
