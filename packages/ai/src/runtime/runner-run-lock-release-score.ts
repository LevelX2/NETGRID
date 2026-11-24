import { isRemoteServerId } from "@netgrid/shared";
import { visibleRunnerPathTraceContext } from "../run-analysis/trace-rules-profile-planning";
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
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import { mergedPublicHistory } from "../public-event-history";
import { actionClickCost, actionCreditCost } from "./action-cost";
import { serverBlocksStealthBitPayments } from "./server-target";

type FollowUp = {
  serverId: string;
  estimatedProbeCredits: number;
  reserveAfterProbe: number;
  targetCredits: number;
  pathReady: boolean;
  evidence: string[];
};

export type RunnerRunLockReleaseProjection = {
  serverId: string;
  terminal: boolean;
  value: number;
  creditCost: number;
  clicksAfterRelease: number;
  estimatedProbeCredits: number;
  reserveAfterProbe: number;
  targetCredits: number;
  fundingGap: number;
  status:
    | "ready"
    | "blocked_funding"
    | "blocked_clicks"
    | "blocked_path"
    | "blocked_action_unavailable";
  evidence: string[];
};

export function runnerRunLockReleaseScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    !isRunLockReleaseAction(action)
  ) {
    return undefined;
  }

  const projection = runnerRunLockReleaseProjection(input, action);
  if (!projection || projection.status !== "ready") return undefined;
  return {
    key: projection.terminal
      ? "runner_matchpoint_run_lock_release"
      : "runner_viable_followup_run_lock_release",
    label: projection.terminal
      ? "Run-Sperre für terminalen Contest lösen"
      : "Run-Sperre für glaubwürdigen Folgepfad lösen",
    value: projection.value,
    reason: [
      `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
      `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
      `clicks_after_release:${projection.clicksAfterRelease}`,
      `credits_after_release:${input.playerView.own.credits - projection.creditCost}`,
      `follow_up_server:${projection.serverId}`,
      `estimated_probe_credits:${projection.estimatedProbeCredits}`,
      `reserve_after_probe:${projection.reserveAfterProbe}`,
      `run_lock_release_target_credits:${projection.targetCredits}`,
      `release_context:${projection.terminal ? "terminal_contest" : "viable_followup"}`,
      ...projection.evidence,
    ].join("|"),
  };
}

export function runnerRunLockReleaseProjection(
  input: AiDecisionInput,
  action?: LegalAction,
  preferredServerIds: readonly string[] = [],
): RunnerRunLockReleaseProjection | undefined {
  if (input.side !== "runner") return undefined;
  const currentOffer =
    action &&
    input.legalActions.find((offer) => offer.actionId === action.actionId);
  if (
    action &&
    (!actionMatchesCurrentDecision(input, currentOffer) ||
      !isRunLockReleaseAction(currentOffer))
  )
    return undefined;
  const creditCost = currentOffer
    ? actionCreditCost(currentOffer)
    : visibleRunnerRunLockCreditCost(input);
  if (creditCost <= 0) return undefined;
  const clickCost = currentOffer ? actionClickCost(currentOffer) : 1;
  const clicksAfterRelease = input.playerView.own.clicks - clickCost;
  const terminalThreat = runnerTerminalContestThreat(input);
  const creditsAfterRelease = Math.max(
    0,
    input.playerView.own.credits - creditCost,
  );
  const followUp = plausibleFollowUpRun(
    input,
    creditsAfterRelease,
    creditCost,
    terminalThreat,
    preferredServerIds,
  );
  if (!followUp) return undefined;
  const fundingGap = Math.max(
    0,
    followUp.targetCredits - input.playerView.own.credits,
  );
  const status: RunnerRunLockReleaseProjection["status"] = !followUp.pathReady
    ? "blocked_path"
    : clicksAfterRelease < 1
      ? "blocked_clicks"
      : fundingGap > 0
        ? "blocked_funding"
        : action === undefined
          ? "blocked_action_unavailable"
          : "ready";
  return {
    serverId: followUp.serverId,
    terminal: terminalThreat !== undefined,
    value: terminalThreat ? 4_100 : 1_800,
    creditCost,
    clicksAfterRelease,
    estimatedProbeCredits: followUp.estimatedProbeCredits,
    reserveAfterProbe: followUp.reserveAfterProbe,
    targetCredits: followUp.targetCredits,
    fundingGap,
    status,
    evidence: [
      `run_lock_release_projection_status:${status}`,
      `run_lock_release_credit_cost:${creditCost}`,
      `run_lock_release_funding_gap:${fundingGap}`,
      ...followUp.evidence,
      ...(terminalThreat?.evidence ?? []),
    ],
  };
}

function visibleRunnerRunLockCreditCost(input: AiDecisionInput): number {
  const currentTurnSerial = input.playerView.turnSerial;
  for (const event of [...mergedPublicHistory(input)].reverse()) {
    if (
      currentTurnSerial !== undefined &&
      event.turnSerial !== undefined &&
      event.turnSerial !== currentTurnSerial
    ) {
      continue;
    }
    if (event.publicPayload.runnerRunLockCleared === true) return 0;
    const cost = event.publicPayload.runnerRunLockCreditCost;
    if (typeof cost === "number" && Number.isFinite(cost) && cost > 0) {
      return Math.floor(cost);
    }
  }
  return 0;
}

export function runnerSpeculativeRunLockReleaseScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    !isRunLockReleaseAction(action) ||
    !actionMatchesCurrentDecision(input, action)
  )
    return undefined;
  if (runnerRunLockReleaseScoreComponent(input, action)) return undefined;
  return {
    key: "runner_speculative_run_lock_release",
    label: "Run-Sperre ohne Folgepfad",
    value: -120,
    reason: "run_lock_release_without_credible_followup:true",
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
  creditCost: number,
  terminalThreat: RunnerTerminalContestThreat | undefined,
  preferredServerIds: readonly string[],
): FollowUp | undefined {
  const preferredRank = new Map(
    preferredServerIds.map((serverId, index) => [serverId, index]),
  );
  const reserveRequirement = terminalThreat ? 0 : 4;
  const candidates = input.playerView.servers
    .filter(
      (server) =>
        !server.statuses?.some((status) => status.kind === "run_prohibited"),
    )
    .filter((server) =>
      terminalThreat && terminalThreat.remoteServerIds.length > 0
        ? terminalThreat.remoteServerIds.includes(server.id)
        : serverHasContestPayoff(input, server.id),
    )
    .flatMap((server) => {
      const excludeStealthCredits = serverBlocksStealthBitPayments(server);
      const path = assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        runnerRunPathCreditBudgetWithVisiblePools(
          creditsAfterRelease,
          input.playerView.own.rig ?? [],
          { excludeStealthCredits },
        ),
        server.root,
        input.playerView.opponent.credits,
        {
          ...visibleRunnerPathTraceContext(input),
          excludeStealthTraceCredits: excludeStealthCredits,
          visibleRemoteServerCount: input.playerView.servers.filter((entry) =>
            isRemoteServerId(entry.id),
          ).length,
          visibleCorpCredits: input.playerView.opponent.credits,
        },
      );
      const unknownIceProbeReserve = server.ice.filter(
        (ice) => ice.rezzed !== true || !ice.known || !ice.definitionId,
      ).length;
      const missingUnknownIceCoverage =
        unknownIceProbeReserve > 0 && !installedBreakerAvailable(input);
      const missingNonTerminalRunCapability =
        terminalThreat === undefined && !installedBreakerAvailable(input);
      const pathReady =
        !missingUnknownIceCoverage &&
        !missingNonTerminalRunCapability &&
        (path.canReachAccess ||
          (path.noAccessReason === "known_path_unpayable" &&
            !path.knownPathBlockedByMissingCoverage &&
            !path.knownPathBlockedByUnbreakableIce &&
            !path.knownPathBlockedByEtr));
      const estimatedProbeCredits =
        Math.max(0, path.visibleBreakCost ?? 0) + unknownIceProbeReserve;
      const targetCredits =
        creditCost + estimatedProbeCredits + reserveRequirement;
      return [
        {
          serverId: server.id,
          estimatedProbeCredits,
          reserveAfterProbe:
            input.playerView.own.credits - creditCost - estimatedProbeCredits,
          targetCredits,
          pathReady,
          evidence: [
            `run_lock_release_path_ready:${pathReady}`,
            `run_lock_release_visible_break_cost:${Math.max(0, path.visibleBreakCost ?? 0)}`,
            `run_lock_release_unknown_ice_reserve:${unknownIceProbeReserve}`,
            `run_lock_release_post_run_reserve:${reserveRequirement}`,
            ...(missingUnknownIceCoverage
              ? ["run_lock_release_unknown_ice_without_installed_breaker"]
              : []),
            ...(missingNonTerminalRunCapability
              ? ["run_lock_release_nonterminal_without_installed_breaker"]
              : []),
          ],
        },
      ];
    })
    .sort(
      (left, right) =>
        Number(right.pathReady) - Number(left.pathReady) ||
        (preferredRank.get(left.serverId) ?? Number.MAX_SAFE_INTEGER) -
          (preferredRank.get(right.serverId) ?? Number.MAX_SAFE_INTEGER) ||
        left.targetCredits - right.targetCredits ||
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
  if (!isRemoteServerId(serverId)) return false;
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
