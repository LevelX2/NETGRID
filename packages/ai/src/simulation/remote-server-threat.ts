import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  agendaPointsForMetrics,
  remoteTrashCostForVisibleCard,
} from "./card-metric-lookup";
import { remoteTrashRoleForVisibleCard } from "./remote-trash-role";
import { isRemoteServerTarget } from "../runtime/server-target";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { actionCreditCost } from "../runtime/action-cost";

export type RunnerRemoteThreatProfile = {
  serverId: string;
  advanced: boolean;
  relevantTrash: boolean;
  blockedByBreakerCoverage: boolean;
  blockedByKnownIceCost: boolean;
  blockedByPostRunReserve: boolean;
  creditsAfterPath: number;
  postRunReserveTarget: number;
  contestable: boolean;
};

export type RunnerRemoteThreatTargetingDiagnostics = Partial<{
  runnerAdvancedRemoteThreatServerIds: string[];
  runnerContestableAdvancedRemoteThreatServerIds: string[];
  runnerContestedAdvancedRemoteServerId: string;
  runnerCentralRunInsteadOfContestableAdvancedRemote: boolean;
  runnerCentralRunInsteadWasJustified: boolean;
  runnerCentralRunJustificationReason: string;
  runnerCentralRunBurnedRemoteContestReserve: boolean;
  runnerRemoteContestBlockedByCredits: boolean;
  runnerRemoteContestBlockedByPostRunReserve: boolean;
  runnerRemoteContestBlockedByBreakerCoverage: boolean;
  runnerRemoteContestBlockedByKnownIceCost: boolean;
  runnerRepeatedCentralRunWhileSameRemoteThreat: boolean;
  runnerRemoteRunStartedWithInsufficientPostRunReserve: boolean;
  runnerRemoteRunStartedWithSufficientPostRunReserve: boolean;
}>;

export function remoteServerHasScoreThreat(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some(
    (card) =>
      (card.advancementCounters ?? 0) > 0 ||
      (card.known && card.type === "agenda"),
  );
}

export function remoteTrashAccessProtectsAcuteThreatForMetrics(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  if (remoteServerHasScoreThreat(input, serverId)) return true;
  return server.root.some((card) => {
    if (!card.known || card.type !== "agenda" || !card.definitionId)
      return false;
    return (
      input.playerView.own.agendaPoints +
        agendaPointsForMetrics(card.definitionId) >=
      input.playerView.agendaPointsToWin - 1
    );
  });
}

export function runnerHasVisibleRemoteScoreThreat(
  input: AiDecisionInput,
): boolean {
  return input.playerView.servers.some(
    (server) =>
      isRemoteServerTarget(server.id) &&
      remoteServerHasScoreThreat(input, server.id),
  );
}

export function runnerRemoteHasKnownRelevantTrashTarget(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some((card) => {
    if (!card.known || remoteTrashCostForVisibleCard(card) === undefined)
      return false;
    const role = remoteTrashRoleForVisibleCard(card);
    return role !== "low_value" && role !== "unknown";
  });
}

export function runnerRemoteThreatProfile(
  input: AiDecisionInput,
  serverId: string,
  runnerPostRunReserveTargetForRemoteInput: (
    input: AiDecisionInput,
    serverId: string,
  ) => number,
): RunnerRemoteThreatProfile {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const assessment = assessKnownRezzedIcePath(
    server?.ice ?? [],
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server?.root ?? [],
  );
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const creditsAfterPath = input.playerView.own.credits - visibleBreakCost;
  const postRunReserveTarget = runnerPostRunReserveTargetForRemoteInput(
    input,
    serverId,
  );
  const advanced = remoteServerHasScoreThreat(input, serverId);
  const relevantTrash = runnerRemoteHasKnownRelevantTrashTarget(
    input,
    serverId,
  );
  const blockedByKnownIceCost = visibleBreakCost > input.playerView.own.credits;
  const blockedByBreakerCoverage =
    assessment.blocked === true && !blockedByKnownIceCost;
  const blockedByPostRunReserve =
    !blockedByBreakerCoverage &&
    !blockedByKnownIceCost &&
    creditsAfterPath < postRunReserveTarget;
  return {
    serverId,
    advanced,
    relevantTrash,
    blockedByBreakerCoverage,
    blockedByKnownIceCost,
    blockedByPostRunReserve,
    creditsAfterPath,
    postRunReserveTarget,
    contestable:
      advanced &&
      !blockedByBreakerCoverage &&
      !blockedByKnownIceCost &&
      !blockedByPostRunReserve,
  };
}

export function runnerRemoteThreatTargetingDiagnosticsForAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
  dependencies: {
    runnerRemoteThreatProfile: (
      input: AiDecisionInput,
      serverId: string,
    ) => RunnerRemoteThreatProfile;
    runnerCentralRunHasClearPressureJustification: (
      input: AiDecisionInput,
      targetServerId: string,
      contestableRemoteThreatVisible: boolean,
    ) => boolean;
    runnerCentralRunPressureJustificationReasons: (
      input: AiDecisionInput,
      targetServerId: string,
      contestableRemoteThreatVisible: boolean,
    ) => string[];
    runnerCentralRunBurnsRemoteContestReserve: (
      input: AiDecisionInput,
      targetServerId: string,
      contestableProfiles: RunnerRemoteThreatProfile[],
    ) => boolean;
  },
): RunnerRemoteThreatTargetingDiagnostics {
  if (input.side !== "runner" || action.side !== "runner") return {};
  const legalRemoteProfiles = input.legalActions
    .filter(
      (candidate) =>
        candidate.type === "start_run" &&
        typeof candidate.payload?.serverId === "string" &&
        isRemoteServerTarget(candidate.payload.serverId),
    )
    .map((candidate) =>
      dependencies.runnerRemoteThreatProfile(
        input,
        String(candidate.payload?.serverId),
      ),
    );
  const advancedProfiles = legalRemoteProfiles.filter(
    (profile) => profile.advanced,
  );
  if (advancedProfiles.length === 0) return {};
  const contestableProfiles = advancedProfiles.filter(
    (profile) => profile.contestable,
  );
  const selectedProfile = targetServerId
    ? advancedProfiles.find((profile) => profile.serverId === targetServerId)
    : undefined;
  const centralRun =
    action.type === "start_run" &&
    (targetServerId === "hq" ||
      targetServerId === "rd" ||
      targetServerId === "archives");
  const centralJustified =
    centralRun && targetServerId
      ? dependencies.runnerCentralRunHasClearPressureJustification(
          input,
          targetServerId,
          contestableProfiles.length > 0,
        )
      : false;
  const centralJustificationReasons =
    centralRun && targetServerId
      ? dependencies.runnerCentralRunPressureJustificationReasons(
          input,
          targetServerId,
          contestableProfiles.length > 0,
        )
      : [];
  const centralBurnedReserve =
    centralRun &&
    targetServerId !== undefined &&
    contestableProfiles.length > 0 &&
    dependencies.runnerCentralRunBurnsRemoteContestReserve(
      input,
      targetServerId,
      contestableProfiles,
    );
  const contested =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    selectedProfile !== undefined;
  const blockedByCredits = advancedProfiles.some(
    (profile) =>
      profile.blockedByKnownIceCost || profile.blockedByPostRunReserve,
  );
  const blockedByPostRunReserve = advancedProfiles.some(
    (profile) => profile.blockedByPostRunReserve,
  );
  const blockedByBreakerCoverage = advancedProfiles.some(
    (profile) => profile.blockedByBreakerCoverage,
  );
  const blockedByKnownIceCost = advancedProfiles.some(
    (profile) => profile.blockedByKnownIceCost,
  );
  return {
    runnerAdvancedRemoteThreatServerIds: advancedProfiles.map(
      (profile) => profile.serverId,
    ),
    ...(contestableProfiles.length > 0
      ? {
          runnerContestableAdvancedRemoteThreatServerIds:
            contestableProfiles.map((profile) => profile.serverId),
        }
      : {}),
    ...(contested
      ? { runnerContestedAdvancedRemoteServerId: selectedProfile.serverId }
      : {}),
    ...(centralRun && contestableProfiles.length > 0
      ? { runnerCentralRunInsteadOfContestableAdvancedRemote: true }
      : {}),
    ...(centralJustified ? { runnerCentralRunInsteadWasJustified: true } : {}),
    ...(centralRun && centralJustificationReasons[0]
      ? { runnerCentralRunJustificationReason: centralJustificationReasons[0] }
      : {}),
    ...(centralBurnedReserve
      ? { runnerCentralRunBurnedRemoteContestReserve: true }
      : {}),
    ...(blockedByCredits ? { runnerRemoteContestBlockedByCredits: true } : {}),
    ...(blockedByPostRunReserve
      ? { runnerRemoteContestBlockedByPostRunReserve: true }
      : {}),
    ...(blockedByBreakerCoverage
      ? { runnerRemoteContestBlockedByBreakerCoverage: true }
      : {}),
    ...(blockedByKnownIceCost
      ? { runnerRemoteContestBlockedByKnownIceCost: true }
      : {}),
    ...(centralRun && contestableProfiles.length > 0 && !centralJustified
      ? { runnerRepeatedCentralRunWhileSameRemoteThreat: true }
      : {}),
    ...(selectedProfile !== undefined && !selectedProfile.contestable
      ? { runnerRemoteRunStartedWithInsufficientPostRunReserve: true }
      : {}),
    ...(selectedProfile?.contestable === true
      ? { runnerRemoteRunStartedWithSufficientPostRunReserve: true }
      : {}),
  };
}

export function runnerContestBlockedByCredits(
  input: AiDecisionInput,
  reserveTarget: number,
): boolean {
  return input.legalActions.some((action) => {
    if (
      action.side !== "runner" ||
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string" ||
      !isRemoteServerTarget(action.payload.serverId) ||
      !remoteServerHasScoreThreat(input, action.payload.serverId)
    )
      return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === action.payload?.serverId,
    );
    if (!server) return false;
    const path =
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      ).visibleBreakCost ?? 0;
    return (
      input.playerView.own.credits < path ||
      input.playerView.own.credits - path < Math.min(3, reserveTarget - 2)
    );
  });
}

export function runnerTrashBlockedByCredits(
  input: AiDecisionInput,
): boolean {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !isRemoteServerTarget(run.attackedServerId) || !accessed?.known)
    return false;
  const trashCost = remoteTrashCostForVisibleCard(accessed);
  if (trashCost === undefined) return false;
  const role = remoteTrashRoleForVisibleCard(accessed);
  if (role === "low_value" || role === "unknown") return false;
  return (
    input.playerView.own.credits < trashCost &&
    !input.legalActions.some((action) => action.type === "trash_accessed_card")
  );
}

export function runnerStealBlockedByCredits(
  input: AiDecisionInput,
  reserveTarget: number,
): boolean {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !accessed?.known || accessed.type !== "agenda") return false;
  return (
    !input.legalActions.some((action) => action.type === "steal_agenda") &&
    input.playerView.own.credits < reserveTarget
  );
}

export function runnerAdvancedRemoteContestContext(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): {
  opportunity: boolean;
  taken: boolean;
  skipped: boolean;
  centralWhileThreat: boolean;
  reserveAfterRun?: number;
} {
  if (input.side !== "runner") {
    return {
      opportunity: false,
      taken: false,
      skipped: false,
      centralWhileThreat: false,
    };
  }
  const advancedRemoteTargets = new Set(
    input.legalActions
      .filter(
        (candidate) =>
          candidate.type === "start_run" &&
          typeof candidate.payload?.serverId === "string" &&
          isRemoteServerTarget(candidate.payload.serverId) &&
          remoteServerHasScoreThreat(input, candidate.payload.serverId),
      )
      .map((candidate) => String(candidate.payload?.serverId)),
  );
  const opportunity = advancedRemoteTargets.size > 0;
  const taken =
    action.type === "start_run" &&
    targetServerId !== undefined &&
    advancedRemoteTargets.has(targetServerId);
  const centralWhileThreat =
    opportunity &&
    action.type === "start_run" &&
    (targetServerId === "hq" ||
      targetServerId === "rd" ||
      targetServerId === "archives");
  return {
    opportunity,
    taken,
    skipped: opportunity && !taken,
    centralWhileThreat,
    ...(action.type === "start_run" &&
    targetServerId !== undefined &&
    isRemoteServerTarget(targetServerId)
      ? {
          reserveAfterRun:
            input.playerView.own.credits - actionCreditCost(action),
        }
      : {}),
  };
}

export function hasRunnerRemoteTrashAction(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.side === "runner" &&
      action.type === "trash_accessed_card" &&
      isRemoteServerTarget(input.playerView.run?.attackedServerId),
  );
}
