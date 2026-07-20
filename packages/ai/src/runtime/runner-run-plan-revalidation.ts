import type { AiDecisionInput } from "@netgrid/shared";

import { projectKnownRemoteTrashCommitment } from "../decision/known-remote-access-commitment";
import {
  createRunnerRunDecisionFingerprint,
  rebaseRunnerRunCommitment,
} from "./runner-run-commitment";
import { runnerRunPlanAcceptsConditionalRoute } from "./runner-run-release";
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
  const currentPlan =
    targetChanged && currentTarget
      ? redirectedRunnerRunPlan(plan, currentTarget)
      : plan;
  const pathQuote = quoteRunnerRunPath(input, currentPlan);
  const currentAccessPayoff = revalidateCurrentRemoteAccessPayoff(
    input,
    currentPlan,
    pathQuote.expectedRemainingCredits,
  );
  const nextEncounter = currentEncounterRef(input, currentPlan.targetServer.id);
  const previousFingerprint =
    currentPlan.commitment?.decisionFingerprint.value ??
    plan.revalidation.reasons
      .find((reason) => reason.startsWith("fingerprint:"))
      ?.slice("fingerprint:".length);
  const nextDecisionFingerprint = createRunnerRunDecisionFingerprint(
    input,
    currentPlan,
  );
  const nextFingerprint = `fingerprint:${nextDecisionFingerprint.value}`;
  const fingerprintChanged =
    previousFingerprint !== undefined &&
    previousFingerprint !== nextDecisionFingerprint.value;
  const pathQuoteChanged =
    pathQuote.totalKnownCost !== plan.pathQuote.totalKnownCost ||
    pathQuote.expectedRemainingCredits !==
      plan.pathQuote.expectedRemainingCredits ||
    pathQuote.reserveViolation !== plan.pathQuote.reserveViolation ||
    pathQuote.canReachAccess !== plan.pathQuote.canReachAccess ||
    pathQuote.cannotReachReason !== plan.pathQuote.cannotReachReason;
  const encounterChanged = !sameEncounterRef(
    nextEncounter,
    plan.currentEncounter,
  );
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
    ...(currentAccessPayoff?.knownNoCurrentPayoff
      ? [
          "access_payoff_revalidated",
          "known_remote_access_payoff_unfunded",
          ...currentAccessPayoff.reasons.map(
            (reason) => `access_payoff_reason:${reason}`,
          ),
        ]
      : []),
    ...(runnerRunPlanAcceptsConditionalRoute(currentPlan)
      ? ["conditional_route_accepted"]
      : []),
    ...(!pathQuote.canReachAccess &&
    !runnerRunPlanAcceptsConditionalRoute(currentPlan) &&
    pathQuote.cannotReachReason
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
    conditionalRouteAccepted: runnerRunPlanAcceptsConditionalRoute(currentPlan),
    knownNoCurrentPayoff: currentAccessPayoff?.knownNoCurrentPayoff === true,
  });
  const nextCommitment = rebaseRunnerRunCommitment({
    input,
    plan: currentPlan,
    pathQuote,
  });
  return {
    ...currentPlan,
    lifecycle: lifecycleForRevalidation(status, plan.lifecycle),
    pathQuote,
    ...(nextCommitment ? { commitment: nextCommitment } : {}),
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
  conditionalRouteAccepted: boolean;
  knownNoCurrentPayoff: boolean;
}): RunnerRunPlanRevalidationStatus {
  if (!params.canReachAccess && !params.conditionalRouteAccepted)
    return "abort_recommended";
  if (params.knownNoCurrentPayoff) return "abort_recommended";
  if (
    params.targetChanged ||
    params.pathQuoteChanged ||
    params.encounterChanged ||
    params.fingerprintChanged
  ) {
    return "adjusted";
  }
  return "valid";
}

function revalidateCurrentRemoteAccessPayoff(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
  creditsAfterRemainingPath: number,
): { knownNoCurrentPayoff: true; reasons: string[] } | undefined {
  const serverId = plan.targetServer.id;
  const run = input.playerView.run;
  if (
    !serverId.startsWith("remote_") ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    run?.phase !== "movement" ||
    run.position?.kind !== "server" ||
    run.position.serverId !== serverId ||
    !input.legalActions.some((action) => action.type === "jack_out") ||
    plan.objective.kind === "run_card_effect" ||
    plan.objective.kind === "survival_or_win_pressure"
  ) {
    return undefined;
  }

  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.root.length === 0) return undefined;
  if (
    server.root.some(
      (card) =>
        !card.known ||
        !card.definitionId ||
        (card.type !== "asset" && card.type !== "upgrade") ||
        typeof card.trashCost !== "number",
    )
  ) {
    return undefined;
  }

  const projections = server.root.map((card) =>
    projectKnownRemoteTrashCommitment(input, {
      serverId,
      definitionId: card.definitionId!,
      rootType: card.type!,
      trashCost: card.trashCost!,
      creditsAfterPath: creditsAfterRemainingPath,
      visibleCard: card,
    }),
  );
  if (projections.some((projection) => !projection.knownNoCurrentPayoff)) {
    return undefined;
  }
  return {
    knownNoCurrentPayoff: true,
    reasons: [
      ...new Set(projections.flatMap((projection) => projection.reasons)),
    ],
  };
}

function redirectedRunnerRunPlan(
  plan: RunnerRunPlan,
  currentTarget: RunnerRunPlanServerId,
): RunnerRunPlan {
  return {
    ...plan,
    origin: "redirected_run",
    targetServer: { id: currentTarget },
    ...(plan.accessIntent
      ? {
          accessIntent: {
            ...plan.accessIntent,
            server: currentTarget,
          },
        }
      : {}),
    debug: {
      summary: `${plan.debug.summary} -> ${currentTarget}`,
      items: [
        ...plan.debug.items,
        "runner_run_plan_redirected:true",
        `runner_run_plan_redirect_target:${currentTarget}`,
      ],
    },
  };
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
    ...(run.position?.kind === "ice"
      ? { iceIndex: run.position.iceIndex }
      : {}),
  };
}

function sameEncounterRef(
  left: RunnerRunEncounterStateRef | undefined,
  right: RunnerRunEncounterStateRef | undefined,
): boolean {
  if (!left || !right) return left === right;
  return (
    left.server === right.server &&
    left.phase === right.phase &&
    left.iceInstanceId === right.iceInstanceId &&
    left.iceIndex === right.iceIndex
  );
}

function isRunnerRunPlanServerId(
  value: string,
): value is RunnerRunPlanServerId {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    /^remote_\d+$/.test(value)
  );
}
