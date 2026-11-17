import type { AiDecisionInput } from "@netgrid/shared";
import { runnerRunProjectionPreservesNormalAccess } from "../actions/run-action-projection";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { runnerAgendaStealCreditRequirement } from "../run-analysis/runner-agenda-steal-cost";
import { runnerTerminalContestThreat } from "../runtime/runner-terminal-contest-threat";
export const INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET = 1;

/** Shared central-parent admission, also consumed before paid preparation. */
export function runnerCostlyCentralRunIsBelowHandBuffer(
  handSize: number,
  minimumHandBuffer: number,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    handSize < minimumHandBuffer &&
    evaluation.pathCost > 0 &&
    evaluation.accessPayoff !== "agenda" &&
    evaluation.accessPayoff !== "score_threat"
  );
}

export function runPurposeForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
): "access" | "multiaccess" | "information" | "contest" {
  if (
    evaluation.runActionProjection.accessReplacement === "private_look_top_rd"
  ) {
    return "information";
  }
  if (evaluation.fortIceTrashObjective) return "access";
  if (evaluation.scoreThreat) return "contest";
  if (
    evaluation.runCommitment === "probe_only" &&
    evaluation.accessPayoff === "unknown"
  ) {
    return "information";
  }
  if (evaluation.multiaccessAvailable) return "multiaccess";
  if (
    evaluation.recommendation === "run_if_free" &&
    (evaluation.knownAccessState === "unknown" ||
      evaluation.knownAccessState === "fresh")
  ) {
    return "information";
  }
  return evaluation.targetKind === "remote" ? "contest" : "access";
}

export function runnerInformationProbeCanUseQuotedPath(
  evaluation: RunnerRunTargetEvaluation,
  directlyConvertible: boolean,
  terminalCentralAccess = false,
): boolean {
  if (
    evaluation.pathPassability !== "reachable" ||
    (evaluation.routeQuote?.fundingGap ?? 0) > 0
  ) {
    return false;
  }
  if (
    terminalCentralAccess ||
    evaluation.pathCost <= INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET
  ) {
    return true;
  }
  if (!directlyConvertible) return false;
  return runnerInformationProbeKnownPathIsAdmitted(evaluation);
}

/** Funding cannot change the purpose or known-cost limit of an information probe. */
export function runnerInformationProbeKnownPathIsAdmitted(
  evaluation: RunnerRunTargetEvaluation,
  terminalCentralAccess = false,
): boolean {
  return (
    terminalCentralAccess ||
    evaluation.pathCost <= INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET ||
    evaluation.evidence.some(
      (entry) =>
        entry === "central_memory_payoff:partial_known" ||
        entry === "remote_memory_payoff:partial_unknown",
    )
  );
}

export function runnerFinalClickCentralAccessBeforeTerminalScore(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
  protectedLiquidFloor: number,
): boolean {
  const view = input.playerView;
  const quote = evaluation.routeQuote;
  if (
    input.side !== "runner" ||
    view.own.clicks !== 1 ||
    (evaluation.accessTargetKind !== "hq" &&
      evaluation.accessTargetKind !== "rd") ||
    !runnerRunProjectionPreservesNormalAccess(
      input,
      evaluation.runActionProjection,
    ) ||
    (evaluation.runActionProjection.postRunSelfDamage ?? 0) > 0 ||
    (evaluation.runActionProjection.successfulRunSelfTags ?? 0) > 0 ||
    evaluation.pathPassability !== "reachable" ||
    !quote ||
    quote.reachability === "no_access" ||
    quote.fundingGap !== 0 ||
    quote.effects.length !== 0 ||
    quote.conditionalReasons.some(
      (reason) => reason !== "unknown_ice_on_route",
    ) ||
    (quote.conditionalRiskReasons?.length ?? 0) !== 0 ||
    (evaluation.prerunReserveQuote?.status !== "not_required" &&
      evaluation.prerunReserveQuote?.status !== "satisfied") ||
    (evaluation.fundingNeed.reason !== "post_run_floor_gap" &&
      evaluation.recommendation !== "run_now" &&
      evaluation.recommendation !== "run_if_free") ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false
  )
    return false;
  const stealCost = runnerAgendaStealCreditRequirement(
    input,
    evaluation.accessServerId,
    evaluation.accessPayoff === "agenda"
      ? evaluation.accessFacts.knownTargetDefinitionIds
      : undefined,
  );
  if (
    stealCost === undefined ||
    evaluation.creditsAfterRun - stealCost < protectedLiquidFloor
  )
    return false;

  const currentActions = input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.expiresAtStateVersion === view.stateVersion,
  );
  const currentRun = currentActions.some(
    (action) =>
      action.actionId === evaluation.actionId &&
      action.type === evaluation.runActionProjection.actionType &&
      (action.type === "start_run" || action.type === "play_event") &&
      action.payload?.serverId === evaluation.targetServerId &&
      action.costs.reduce((clicks, cost) => clicks + (cost.clicks ?? 0), 0) ===
        1,
  );
  // A free preparation might still enable a contest without using this click.
  if (
    !currentRun ||
    currentActions.some(
      (action) =>
        action.type !== "end_turn" &&
        action.costs.every((cost) => (cost.clicks ?? 0) === 0),
    )
  )
    return false;

  const threat = runnerTerminalContestThreat(input);
  const pointsNeeded = view.agendaPointsToWin - view.own.agendaPoints;
  if (
    !threat?.remoteServerIds.length ||
    pointsNeeded <= 0 ||
    ![...view.own.scoreArea, ...(view.opponent.scoreArea ?? [])].some(
      (card) =>
        card.known &&
        card.type === "agenda" &&
        typeof card.agendaPoints === "number" &&
        card.agendaPoints >= pointsNeeded,
    )
  )
    return false;

  const legalIds = new Set(currentActions.map((action) => action.actionId));
  const remoteRoutes = runTargets.filter(
    (target) => target.targetKind === "remote" && legalIds.has(target.actionId),
  );
  const remoteRunBlocked = (target: RunnerRunTargetEvaluation) =>
    target.pathPassability !== "reachable" ||
    !target.routeQuote ||
    target.routeQuote.reachability === "no_access" ||
    target.routeQuote.fundingGap > 0 ||
    target.prerunReserveQuote?.status === "blocked" ||
    target.accessPayoffContestable === false ||
    target.visibleTraceTagHazardUnavoidable === true ||
    (target.unavoidableVisibleIceHazardCount ?? 0) > 0;
  return (
    !remoteRoutes.some(
      (target) =>
        target.knownAccessState !== "known_no_current_payoff" &&
        !remoteRunBlocked(target),
    ) &&
    threat.remoteServerIds.every((serverId) =>
      remoteRoutes.some((target) => target.targetServerId === serverId),
    )
  );
}

export function runnerTerminalRemoteUnreachableCentralLastChance(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  if (
    !runnerRunProjectionPreservesNormalAccess(
      input,
      evaluation.runActionProjection,
    ) ||
    input.playerView.own.agendaPoints <
      input.playerView.agendaPointsToWin - 1 ||
    (evaluation.targetServerId !== "hq" &&
      evaluation.targetServerId !== "rd") ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.routeQuote?.reachability === "no_access" ||
    evaluation.prerunReserveQuote?.status === "blocked" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.creditsAfterRun < 0 ||
    evaluation.visibleTraceTagHazardUnavoidable === true ||
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) > 0
  ) {
    return false;
  }
  const threat = runnerTerminalContestThreat(input);
  if (!threat || threat.remoteServerIds.length === 0) return false;

  // A blocked scoring fort does not make centrals the last available access.
  // Other live remotes keep their own current route and access-risk admission;
  // their hidden contents are never presumed to contain an agenda.
  if (
    runTargets.some(
      (candidate) =>
        candidate.targetKind === "remote" &&
        input.legalActions.some(
          (action) =>
            action.actionId === candidate.actionId &&
            action.side === "runner" &&
            action.expiresAtStateVersion === input.playerView.stateVersion,
        ) &&
        candidate.pathPassability === "reachable" &&
        candidate.routeQuote?.reachability === "guaranteed_access" &&
        candidate.routeQuote.fundingGap === 0 &&
        candidate.prerunReserveQuote?.status !== "blocked" &&
        candidate.knownAccessState !== "known_no_current_payoff" &&
        candidate.accessPayoffContestable !== false &&
        candidate.creditsAfterRun >= 0 &&
        candidate.visibleTraceTagHazardUnavoidable !== true &&
        (candidate.unavoidableVisibleIceHazardCount ?? 0) === 0,
    )
  )
    return false;

  return threat.remoteServerIds.every((serverId) => {
    const remoteEvaluations = runTargets.filter(
      (candidate) =>
        candidate.targetKind === "remote" &&
        candidate.targetServerId === serverId,
    );
    return (
      remoteEvaluations.length > 0 &&
      remoteEvaluations.every(
        (candidate) => candidate.pathPassability !== "reachable",
      )
    );
  });
}
