import { type AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../../runtime/public-event-history";
import { runnerCoverageGapIsTerminalRemoteThreat } from "../rig-coverage/coverage-support";
export function runnerTerminalRemoteLastChanceKnownPathFundingGap(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): number | undefined {
  const routeFundingGap = evaluation.routeQuote?.fundingGap;
  if (
    !runnerCoverageGapIsTerminalRemoteThreat(input, evaluation) ||
    evaluation.pathPassability !== "blocked_unpayable" ||
    evaluation.recommendation !== "gain_credits_first" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.visibleTraceTagHazardUnavoidable === true ||
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) > 0 ||
    !Number.isSafeInteger(routeFundingGap) ||
    (routeFundingGap ?? 0) <= 0 ||
    evaluation.creditsAfterRun + (routeFundingGap ?? 0) < 0
  ) {
    return undefined;
  }
  return routeFundingGap;
}

export function runnerGuaranteedUrgentRemoteCanSpendToZero(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const routeQuote = evaluation.routeQuote;
  return (
    evaluation.accessTargetKind === "remote" &&
    evaluation.scoreThreat &&
    evaluation.pathPassability === "reachable" &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    evaluation.accessPayoffContestable !== false &&
    evaluation.creditsAfterRun >= 0 &&
    routeQuote?.reachability === "guaranteed_access" &&
    routeQuote.fundingGap === 0 &&
    routeQuote.unknownIceCount === 0 &&
    routeQuote.effects.length === 0 &&
    routeQuote.conditionalReasons.length === 0 &&
    (routeQuote.conditionalRiskReasons?.length ?? 0) === 0 &&
    (evaluation.unknownUnrezzedIceCount ?? 0) === 0 &&
    (evaluation.visibleIceRunHazards?.length ?? 0) === 0 &&
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
    evaluation.visibleTraceTagHazardUnavoidable !== true
  );
}

export function runnerTerminalRemoteContestIsDirectlyMandatory(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const nonLethalDamageFloorLastChance =
    runnerTerminalRemoteContestIsNonlethalDamageFloorLastChance(evaluation);
  return (
    runnerCoverageGapIsTerminalRemoteThreat(input, evaluation) &&
    !runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn(
      input,
      evaluation,
    ) &&
    (evaluation.pathPassability === "reachable" ||
      nonLethalDamageFloorLastChance) &&
    (nonLethalDamageFloorLastChance ||
      evaluation.routeQuote?.reachability !== "no_access") &&
    (nonLethalDamageFloorLastChance ||
      (evaluation.routeQuote?.fundingGap ?? 0) <= 0) &&
    evaluation.creditsAfterRun >= 0 &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    evaluation.accessPayoffContestable !== false &&
    evaluation.visibleTraceTagHazardUnavoidable !== true &&
    ((evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 ||
      nonLethalDamageFloorLastChance)
  );
}

function runnerTerminalRemoteContestIsNonlethalDamageFloorLastChance(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.pathPassability === "blocked_by_visible_damage_hand_buffer" &&
    evaluation.routeQuote !== undefined &&
    (evaluation.routeQuote.reachability !== "no_access" ||
      evaluation.routeQuote.noAccessReason === "harmful_unbroken_run_effect") &&
    evaluation.routeQuote.fundingGap <= 0 &&
    evaluation.evidence.some(
      (entry) =>
        entry.startsWith(
          "runner_visible_ice_damage_below_required_hand_floor|",
        ) &&
        entry.includes("immediate_flatline:false") &&
        entry.includes("cleanup_flatline:false"),
    )
  );
}

export function runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (
    !runnerTerminalRemoteContestIsNonlethalDamageFloorLastChance(evaluation) ||
    !Number.isSafeInteger(input.playerView.turnSerial)
  ) {
    return false;
  }
  const currentTurnSerial = input.playerView.turnSerial as number;
  let targetRunActive = false;
  let targetRunReachedAccess = false;
  let latestTargetRunFailedWithoutAccess = false;
  for (const event of mergedPublicHistory(input)) {
    if (event.turnSerial !== currentTurnSerial) continue;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (
      event.publicPayload.actor === "runner" &&
      (actionType === "start_run" || event.type === "run_started")
    ) {
      targetRunActive = serverIdFromEvent(event) === evaluation.targetServerId;
      targetRunReachedAccess = false;
      if (targetRunActive) latestTargetRunFailedWithoutAccess = false;
      continue;
    }
    if (!targetRunActive) continue;
    if (
      event.publicPayload.actor === "runner" &&
      actionType === "access_card"
    ) {
      targetRunReachedAccess = true;
      latestTargetRunFailedWithoutAccess = false;
      continue;
    }
    const runEndedWithoutAccess =
      (event.publicPayload.actor === "runner" && actionType === "jack_out") ||
      event.type === "run_ended" ||
      (event.publicPayload.actor === "runner" &&
        actionType === "continue_run" &&
        (event.publicPayload.result === "ended" ||
          event.publicPayload.encounterWillEndRun === true));
    if (!runEndedWithoutAccess) continue;
    latestTargetRunFailedWithoutAccess = !targetRunReachedAccess;
    targetRunActive = false;
    targetRunReachedAccess = false;
  }
  return (
    latestTargetRunFailedWithoutAccess ||
    (targetRunActive &&
      !targetRunReachedAccess &&
      (input.playerView.run === null || input.playerView.run === undefined))
  );
}

export function runnerTerminalRemoteContestVisibleHazardFundingGap(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): number | undefined {
  if (
    !runnerCoverageGapIsTerminalRemoteThreat(input, evaluation) ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.recommendation !== "gain_credits_first" ||
    evaluation.visibleTraceTagHazardUnavoidable !== true
  ) {
    return undefined;
  }
  const gap = Math.max(
    0,
    ...(evaluation.visibleIceRunHazards ?? []).map((hazard) =>
      hazard.unavoidable &&
      hazard.visibleCorpMaxTraceAvoidanceCost !== undefined
        ? Math.max(
            0,
            hazard.visibleCorpMaxTraceAvoidanceCost -
              hazard.runnerTraceCapacity,
          )
        : 0,
    ),
  );
  return gap > 0 ? gap : undefined;
}
