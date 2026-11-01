import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "../../actions/risk-action-projection";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
import type { RunnerRunRiskContractSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import {
  currentEncounteredIceCard,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import { runnerTargetHasTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";

type Rescue = NonNullable<
  RunnerRunRiskContractSignal["terminalRandomBreakRescue"]
>;

/** A bounded last chance owned by the remote contest, not safe run coverage.
 * Only one random ETR break and otherwise zero damage / paid ETR tax are
 * certified. Hidden ICE, positive damage and alternative recovery stay out. */
export function terminalRandomBreakRescueForRun(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): Rescue | undefined {
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === evaluation.actionId,
  );
  const route = evaluation.routeQuote;
  if (
    input.side !== "runner" ||
    input.playerView.run ||
    input.playerView.timingPoint !== "runner_action.main" ||
    input.playerView.own.gripOrHq.length !== 0 ||
    input.playerView.own.stackOrRdCount !== 0 ||
    input.playerView.own.tags !== 0 ||
    !input.playerView.own.rig ||
    action?.type !== "start_run" ||
    action.source !== "basic_action" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.costs.some((cost) => (cost.credits ?? 0) !== 0) ||
    evaluation.targetKind !== "remote" ||
    !evaluation.scoreThreat ||
    !runnerTargetHasTerminalContestThreat(input, evaluation.targetServerId) ||
    evaluation.pathPassability !==
      "blocked_by_random_break_damage_hand_buffer" ||
    evaluation.randomBreakOrDamageRiskAssessment?.stableCoverageAvailable !==
      false ||
    evaluation.randomBreakOrDamageRiskAssessment.blockedByHandBuffer !== true ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    !evaluation.prerunReserveQuote ||
    evaluation.prerunReserveQuote.status === "blocked" ||
    route?.reachability !== "conditional_access" ||
    route.fundingGap !== 0 ||
    route.unknownIceCount !== 0 ||
    route.effects.length !== 0 ||
    route.conditionalReasons.length !== 1 ||
    route.conditionalReasons[0] !== "probabilistic_breaker_route" ||
    (route.conditionalRiskReasons?.length ?? 0) !== 0 ||
    (evaluation.unknownUnrezzedIceCount ?? 0) !== 0 ||
    evaluation.visibleDuringRunRezSupport === true ||
    evaluation.visibleTraceTagHazardUnavoidable === true ||
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) !== 0 ||
    input.legalActions.some(
      (candidate) =>
        candidate.type !== "start_run" &&
        candidate.type !== "end_turn" &&
        !(
          candidate.type === "gain_credit" &&
          candidate.source === "basic_action"
        ) &&
        !(
          candidate.type === "activated_card_ability" &&
          candidate.payload?.effectKind === "gain_credits" &&
          typeof candidate.payload.gainCreditsAmount === "number" &&
          candidate.payload.gainCreditsAmount > 0 &&
          candidate.payload.drawCardsAmount === undefined &&
          candidate.payload.drawAmount === undefined &&
          candidate.payload.drawCount === undefined
        ),
    )
  )
    return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === evaluation.targetServerId,
  );
  if (!server || server.ice.length === 0) return undefined;
  const path = pureKnownPath(input, server.id, server.ice);
  if (!path || path.stops.length !== 1) return undefined;
  const stop = path.stops[0]!;
  const breaker = input.playerView.own.rig.find((card) => {
    const profile = randomBreakOrDamageRiskProfileForDefinitionId(
      card.definitionId,
    );
    return (
      card.type === "program" &&
      card.definitionId !== undefined &&
      typeof card.strength === "number" &&
      card.strength >= stop.strength &&
      profile !== undefined &&
      profile.successProbabilityPerAttempt > 0 &&
      profile.successProbabilityPerAttempt < 1
    );
  });
  if (!breaker?.definitionId) return undefined;
  return {
    ownerModuleId: "runner.contest_remote",
    sourceActionId: action.actionId,
    serverId: server.id,
    observedAtStateVersion: input.playerView.stateVersion,
    breakerInstanceId: breaker.instanceId,
    breakerDefinitionId: breaker.definitionId,
    targetIceInstanceId: stop.iceInstanceId,
    targetSubroutineId: stop.subroutineId,
    successProbability: randomBreakOrDamageRiskProfileForDefinitionId(
      breaker.definitionId,
    )!.successProbabilityPerAttempt,
  };
}

/** Revalidate the same bound source and remaining route after every action. */
export function boundTerminalRandomBreakRescue(
  input: AiDecisionInput,
  origin: RunnerRunOrigin | undefined,
): Rescue | undefined {
  const proof = origin?.runRiskContract?.terminalRandomBreakRescue;
  const run = input.playerView.run;
  if (
    !proof ||
    proof.ownerModuleId !== "runner.contest_remote" ||
    !run ||
    proof.serverId !== run.attackedServerId ||
    origin?.runRiskContract?.serverId !== proof.serverId ||
    proof.observedAtStateVersion >= input.playerView.stateVersion ||
    origin.accessCommitment?.payoff !== "score_threat" ||
    input.playerView.own.gripOrHq.length !== 0 ||
    input.playerView.own.stackOrRdCount !== 0 ||
    input.playerView.own.tags !== 0 ||
    !input.playerView.own.rig ||
    !runnerTargetHasTerminalContestThreat(input, proof.serverId)
  )
    return undefined;
  const breaker = input.playerView.own.rig.find(
    (card) =>
      card.instanceId === proof.breakerInstanceId &&
      card.definitionId === proof.breakerDefinitionId,
  );
  if (
    !breaker ||
    randomBreakOrDamageRiskProfileForDefinitionId(breaker.definitionId)
      ?.successProbabilityPerAttempt !== proof.successProbability
  )
    return undefined;
  const encountered = currentEncounteredIceCard(input);
  const remaining = [
    ...new Map(
      [
        ...currentRunRemainingIce(input),
        ...(run.phase === "encounter_ice" && encountered ? [encountered] : []),
      ].map((card) => [card.instanceId, card]),
    ).values(),
  ];
  const path = pureKnownPath(input, proof.serverId, remaining);
  if (
    !path ||
    path.stops.length > 1 ||
    path.stops.some(
      (stop) =>
        stop.iceInstanceId !== proof.targetIceInstanceId ||
        stop.subroutineId !== proof.targetSubroutineId ||
        typeof breaker.strength !== "number" ||
        breaker.strength < stop.strength,
    )
  )
    return undefined;
  return proof;
}

export function boundTerminalRandomBreakRescueBreak(
  input: AiDecisionInput,
  origin: RunnerRunOrigin | undefined,
  action: LegalAction,
): boolean {
  const proof = boundTerminalRandomBreakRescue(input, origin);
  const ice = currentEncounteredIceCard(input);
  const index = action.payload?.subroutineIndex;
  return (
    proof !== undefined &&
    action.type === "break_subroutine" &&
    action.source === proof.breakerInstanceId &&
    action.payload?.iceId === proof.targetIceInstanceId &&
    ice?.instanceId === proof.targetIceInstanceId &&
    typeof index === "number" &&
    ice.effectiveRunQuote?.subroutines[index]?.id ===
      proof.targetSubroutineId &&
    ice.effectiveRunQuote.subroutines[index]?.type === "end_the_run" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.costs.every((cost) => (cost.credits ?? 0) === 0)
  );
}

function pureKnownPath(
  input: AiDecisionInput,
  serverId: string,
  ice: readonly VisibleCard[],
) {
  const server = input.playerView.servers.find((s) => s.id === serverId);
  const steal = server?.runnerAgendaStealCostQuote;
  if (
    !server ||
    !steal?.complete ||
    steal.stateVersion !== input.playerView.stateVersion ||
    steal.serverId !== serverId ||
    !Number.isFinite(steal.minimumCreditCost) ||
    steal.minimumCreditCost < 0 ||
    server.statuses?.some((s) => s.kind === "during_run_ice_rez_support")
  )
    return undefined;
  let requiredCredits = steal.minimumCreditCost;
  const stops: {
    iceInstanceId: string;
    subroutineId: string;
    strength: number;
  }[] = [];
  for (const card of ice) {
    const quote = card.effectiveRunQuote;
    if (
      card.known !== true ||
      card.rezzed !== true ||
      !quote ||
      quote.iceInstanceId !== card.instanceId ||
      typeof quote.encounterStrength !== "number" ||
      !Number.isFinite(quote.encounterStrength)
    )
      return undefined;
    for (const subroutine of quote.subroutines) {
      if (subroutine.type === "do_damage" && subroutine.amount === 0) continue;
      if (
        subroutine.type === "end_the_run_unless_runner_pays" &&
        typeof subroutine.amount === "number" &&
        Number.isFinite(subroutine.amount) &&
        subroutine.amount >= 0
      ) {
        requiredCredits += subroutine.amount;
        continue;
      }
      if (subroutine.type !== "end_the_run") return undefined;
      stops.push({
        iceInstanceId: card.instanceId,
        subroutineId: subroutine.id,
        strength: quote.encounterStrength,
      });
    }
  }
  return input.playerView.own.credits >= requiredCredits
    ? { stops, requiredCredits }
    : undefined;
}
