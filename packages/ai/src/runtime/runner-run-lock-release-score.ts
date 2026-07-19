import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import {
  runnerTerminalContestThreat,
  type RunnerTerminalContestThreat,
} from "./runner-terminal-contest-threat";
import { AI_HINTS_BY_CARD } from "../ai-hints";

type FollowUp = {
  serverId: string;
  estimatedProbeCredits: number;
};

export function runnerRunLockReleaseScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  const terminalThreat = runnerTerminalContestThreat(input);
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    !isRunLockReleaseAction(action)
  ) {
    return undefined;
  }

  const clickCost = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const creditCost = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const clicksAfterRelease = input.playerView.own.clicks - clickCost;
  const creditsAfterRelease = input.playerView.own.credits - creditCost;
  if (clicksAfterRelease < 1 || creditsAfterRelease < 0) return undefined;
  const ownAtMatchpoint =
    (input.playerView.own.agendaPoints ?? 0) >=
    input.playerView.agendaPointsToWin - 1;
  if (
    !terminalThreat &&
    (clicksAfterRelease < 2 ||
      !installedBreakerAvailable(input) ||
      (creditCost > 1 && !ownAtMatchpoint))
  ) {
    return undefined;
  }

  const followUp = plausibleFollowUpRun(
    input,
    creditsAfterRelease,
    terminalThreat,
  );
  if (!followUp) return undefined;
  const reserveAfterProbe =
    creditsAfterRelease - followUp.estimatedProbeCredits;
  if (!terminalThreat && reserveAfterProbe < 4) return undefined;
  if (
    !terminalThreat &&
    input.playerView.own.gripOrHq.length <
      (input.playerView.own.maxHandSize ?? 5) &&
    legalHostedInstallAvailable(input)
  ) {
    return undefined;
  }

  return {
    key: terminalThreat
      ? "runner_matchpoint_run_lock_release"
      : "runner_viable_followup_run_lock_release",
    label: terminalThreat
      ? "Run-Sperre für terminalen Contest lösen"
      : "Run-Sperre für glaubwürdigen Folgepfad lösen",
    value: terminalThreat ? 4_100 : 1_800,
    reason: [
      `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
      `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
      `clicks_after_release:${clicksAfterRelease}`,
      `credits_after_release:${creditsAfterRelease}`,
      `follow_up_server:${followUp.serverId}`,
      `estimated_probe_credits:${followUp.estimatedProbeCredits}`,
      `reserve_after_probe:${reserveAfterProbe}`,
      `own_at_matchpoint:${ownAtMatchpoint}`,
      `release_context:${terminalThreat ? "terminal_contest" : "viable_followup"}`,
      ...(terminalThreat?.evidence ?? []),
    ].join("|"),
  };
}

function installedBreakerAvailable(input: AiDecisionInput): boolean {
  return (input.playerView.own.rig ?? []).some((card) => {
    const hint = card.definitionId
      ? AI_HINTS_BY_CARD.get(card.definitionId)
      : undefined;
    return (
      (card.subtypes ?? []).some((subtype) =>
        subtype.toLowerCase().includes("icebreaker"),
      ) ||
      hint?.breakerProfile !== undefined ||
      (hint?.roles ?? []).some(
        (role) => role === "icebreaker" || role.startsWith("breaker_"),
      )
    );
  });
}

function legalHostedInstallAvailable(input: AiDecisionInput): boolean {
  const installedIds = new Set(
    (input.playerView.own.rig ?? []).map((card) => card.instanceId),
  );
  if (installedIds.size === 0) return false;
  return (input.legalActions ?? []).some(
    (action) =>
      action.side === "runner" &&
      action.type === "install_card" &&
      action.actionId.split(".").some((segment) => installedIds.has(segment)),
  );
}

function isRunLockReleaseAction(action: LegalAction): boolean {
  return (
    action.type === "trigger_ability" &&
    (action.payload?.abilityId === "pay_to_remove_run_lock" ||
      action.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock")
  );
}

function plausibleFollowUpRun(
  input: AiDecisionInput,
  creditsAfterRelease: number,
  terminalThreat: RunnerTerminalContestThreat | undefined,
): FollowUp | undefined {
  const candidates = input.playerView.servers
    .filter((server) =>
      terminalThreat?.kind === "visible_two_point_remote"
        ? terminalThreat.remoteServerIds.includes(server.id)
        : serverHasContestPayoff(input, server.id),
    )
    .flatMap((server) => {
      const path = assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        runnerRunPathCreditBudgetWithVisiblePools(
          creditsAfterRelease,
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
      if (!path.canReachAccess) return [];
      const unknownIceProbeReserve = server.ice.filter(
        (ice) => ice.rezzed !== true || !ice.known || !ice.definitionId,
      ).length;
      return [
        {
          serverId: server.id,
          estimatedProbeCredits:
            (path.visibleBreakCost ?? 0) + unknownIceProbeReserve,
        },
      ];
    })
    .filter(
      (candidate) => candidate.estimatedProbeCredits <= creditsAfterRelease,
    )
    .sort(
      (left, right) =>
        left.estimatedProbeCredits - right.estimatedProbeCredits ||
        serverPriority(left.serverId) - serverPriority(right.serverId) ||
        left.serverId.localeCompare(right.serverId),
    );
  return candidates[0];
}

function serverHasContestPayoff(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  if (serverId === "hq") return input.playerView.opponent.handCount > 0;
  if (serverId === "rd") return input.playerView.opponent.deckCount > 0;
  if (!serverId.startsWith("remote_")) return false;
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  return (
    server?.root.some(
      (card) => !card.known || !card.definitionId || card.type === "agenda",
    ) === true
  );
}

function serverPriority(serverId: string): number {
  if (serverId === "hq") return 0;
  if (serverId === "rd") return 1;
  return 2;
}
