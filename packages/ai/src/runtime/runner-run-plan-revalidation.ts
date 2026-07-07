import type { AiDecisionInput } from "@netgrid/shared";

import { quoteRunnerRunPath } from "./runner-run-plan-path-quote";
import type {
  RunnerRunEncounterStateRef,
  RunnerRunPlan,
  RunnerRunPlanRevalidationStatus,
  RunnerRunPlanServerId,
} from "./runner-run-plan-types";

export function revalidateRunnerRunPlan(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): RunnerRunPlan {
  if (input.side !== "runner" || !input.playerView.run) return plan;
  const run = input.playerView.run;
  const currentTarget = isRunnerRunPlanServerId(run.attackedServerId)
    ? run.attackedServerId
    : undefined;
  const targetChanged =
    currentTarget !== undefined && currentTarget !== plan.targetServer.id;
  const pathQuote = targetChanged
    ? plan.pathQuote
    : quoteRunnerRunPath(input, plan);
  const nextEncounter = currentEncounterRef(input, plan.targetServer.id);
  const previousFingerprint = plan.revalidation.reasons.find((reason) =>
    reason.startsWith("fingerprint:"),
  );
  const nextFingerprint = `fingerprint:${runnerRunPlanRevalidationFingerprint(
    input,
    plan.targetServer.id,
  )}`;
  const fingerprintChanged =
    previousFingerprint !== undefined && previousFingerprint !== nextFingerprint;
  const pathQuoteChanged =
    pathQuote.totalKnownCost !== plan.pathQuote.totalKnownCost ||
    pathQuote.expectedRemainingCredits !==
      plan.pathQuote.expectedRemainingCredits ||
    pathQuote.reserveViolation !== plan.pathQuote.reserveViolation ||
    pathQuote.canReachAccess !== plan.pathQuote.canReachAccess ||
    pathQuote.cannotReachReason !== plan.pathQuote.cannotReachReason;
  const encounterChanged =
    JSON.stringify(nextEncounter ?? null) !==
    JSON.stringify(plan.currentEncounter ?? null);
  const reasons = [
    ...(targetChanged
      ? [
          "target_server_changed",
          `expected_target:${plan.targetServer.id}`,
          ...(currentTarget ? [`current_target:${currentTarget}`] : []),
        ]
      : []),
    ...(pathQuoteChanged ? ["path_quote_changed"] : []),
    ...(encounterChanged ? ["encounter_state_changed"] : []),
    ...(fingerprintChanged
      ? ["run_state_fingerprint_changed"]
      : previousFingerprint
        ? []
        : ["run_state_fingerprint_initialized"]),
    ...(pathQuote.reserveViolation ? ["reserve_violation"] : []),
    ...(!pathQuote.canReachAccess && pathQuote.cannotReachReason
      ? [`cannot_reach:${pathQuote.cannotReachReason}`]
      : []),
    nextFingerprint,
  ];
  const status = revalidationStatusFor({
    targetChanged,
    pathQuoteChanged,
    encounterChanged,
    fingerprintChanged,
    canReachAccess: pathQuote.canReachAccess,
  });
  return {
    ...plan,
    lifecycle: lifecycleForRevalidation(status, plan.lifecycle),
    pathQuote,
    ...(nextEncounter ? { currentEncounter: nextEncounter } : {}),
    revalidation: {
      status,
      reasons: reasons.length > 1 ? reasons : ["valid", nextFingerprint],
      checkedAtStateVersion: input.playerView.stateVersion,
    },
    updatedAtStateVersion: input.playerView.stateVersion,
  };
}

function revalidationStatusFor(params: {
  targetChanged: boolean;
  pathQuoteChanged: boolean;
  encounterChanged: boolean;
  fingerprintChanged: boolean;
  canReachAccess: boolean;
}): RunnerRunPlanRevalidationStatus {
  if (params.targetChanged) return "invalid";
  if (!params.canReachAccess) return "abort_recommended";
  if (
    params.pathQuoteChanged ||
    params.encounterChanged ||
    params.fingerprintChanged
  ) {
    return "adjusted";
  }
  return "valid";
}

function lifecycleForRevalidation(
  status: RunnerRunPlanRevalidationStatus,
  current: RunnerRunPlan["lifecycle"],
): RunnerRunPlan["lifecycle"] {
  if (status === "invalid") return "invalid";
  if (status === "abort_recommended") return "abort_recommended";
  if (status === "adjusted") return "adjusted";
  return current === "created" ? "active" : current;
}

function currentEncounterRef(
  input: AiDecisionInput,
  serverId: RunnerRunPlanServerId,
): RunnerRunEncounterStateRef | undefined {
  const run = input.playerView.run;
  if (!run) return undefined;
  const phase =
    run.phase === "approach_ice" ||
    run.phase === "encounter_ice" ||
    run.phase === "access"
      ? run.phase
      : "movement";
  const iceInstanceId =
    run.encounteredIce?.instanceId ?? run.approachedIce?.instanceId;
  return {
    server: serverId,
    phase,
    ...(iceInstanceId ? { iceInstanceId } : {}),
    ...(run.position?.kind === "ice" ? { iceIndex: run.position.iceIndex } : {}),
  };
}

function runnerRunPlanRevalidationFingerprint(
  input: AiDecisionInput,
  serverId: RunnerRunPlanServerId,
): string {
  const run = input.playerView.run;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const ice = (server?.ice ?? []).map((card) =>
    [
      card.instanceId,
      card.known,
      card.rezzed,
      card.definitionId ?? "unknown",
      card.strength ?? "na",
      card.effectiveRunQuote?.effectiveStrength ?? "na",
      card.effectiveRunQuote?.subroutines.length ?? "na",
    ].join("/"),
  );
  const root = (server?.root ?? []).map((card) =>
    [
      card.instanceId,
      card.known,
      card.rezzed,
      card.definitionId ?? "unknown",
      card.trashCost ?? "na",
      card.advancementCounters ?? "na",
    ].join("/"),
  );
  return [
    `state:${input.playerView.stateVersion}`,
    `credits:${input.playerView.own.credits}`,
    `server:${serverId}`,
    `phase:${run?.phase ?? "none"}`,
    `position:${run?.position ? JSON.stringify(run.position) : "none"}`,
    `ice:${ice.join(",")}`,
    `root:${root.join(",")}`,
  ].join("|");
}

function isRunnerRunPlanServerId(value: string): value is RunnerRunPlanServerId {
  return value === "hq" || value === "rd" || value === "archives" || /^remote_\d+$/.test(value);
}
