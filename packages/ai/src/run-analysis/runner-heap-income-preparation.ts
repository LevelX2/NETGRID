import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { exactBasicLiquidCreditCandidate } from "../actions/action-candidate-facts";
import type {
  RunnerFundingRouteAssessment,
  RunnerFundingRouteContract,
} from "../plans/runner-funding-contracts";
import { runnerDebtFinancingProfile } from "../runtime/runner-canonical-card-facts";
import { createDeckCapabilitiesContext } from "../runtime/deck-capabilities-context";
import { runnerHeapRecoveryActionContract } from "../runner/hand-development/development-search-targets";
import {
  quoteRunnerRunTarget,
  type RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { runnerTerminalRemoteContestIsDirectlyMandatory } from "../runner/remote-contest/remote-contest-admission";

function exactTopHeapIncomeSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
) {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const target = input.playerView.own.heapOrArchives.at(-1);
  const source = input.playerView.own.rig?.find(
    (card) => card.instanceId === action?.source,
  );
  const contract = runnerHeapRecoveryActionContract(input, candidate);
  const projection = candidate.economyProjection;
  const ability = source?.definitionId
    ? cardImplementationForDefinitionId(source.definitionId)?.abilities?.find(
        (entry) =>
          "capabilityKey" in entry &&
          entry.capabilityKey === action?.payload?.cardImplementationAbilityKey,
      )
    : undefined;
  if (
    input.playerView.timingPoint !== "runner_action.main" ||
    action?.type !== "activated_card_ability" ||
    action.side !== "runner" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.payload?.cardImplementationEffectKind !== "move_top_trash_to_grip" ||
    (action.choiceRequirements?.length ?? 0) !== 0 ||
    !target?.known ||
    target.type !== "resource" ||
    !target.definitionId ||
    contract?.exactTargetCardId !== target.instanceId ||
    action.payload.targetDefinitionId !== target.definitionId ||
    !source ||
    ability?.kind !== "activated" ||
    ability.timing !== "runner_main" ||
    ability.condition ||
    ability.limit ||
    ability.effects.length !== 1 ||
    ability.effects[0]?.kind !== "move_top_trash_to_grip" ||
    ability.effects[0].recipient !== "runner" ||
    ability.costs.some(
      (cost) => cost.kind !== "credit" && cost.kind !== "action",
    ) ||
    projection?.source !== "legal_action_payload" ||
    projection.reliability !== "guaranteed" ||
    projection.confidence !== "high" ||
    projection.cardsConsumed !== 0 ||
    projection.cardsDrawn !== 0 ||
    projection.netHandDelta !== 1 ||
    candidate.costProfile.costKnownStatus !== "known" ||
    candidate.costProfile.additionalCosts.length !== 0
  )
    return undefined;
  const clickCost = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const creditCost = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const debt = runnerDebtFinancingProfile(target.definitionId);
  if (
    !debt ||
    !Number.isSafeInteger(clickCost) ||
    clickCost <= 0 ||
    !Number.isSafeInteger(creditCost) ||
    creditCost < 0 ||
    projection.clickCost !== clickCost ||
    projection.creditCost !== creditCost
  )
    return undefined;
  return { action, target, source, clickCost, creditCost, debt };
}

/** Bounded preparation of a fully known last-chance run. The future install
 * is canonical resource arithmetic, never a manufactured LegalAction.
 * Only the current, exact heap-return action can be materialized here. */
export function runnerHeapIncomePreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  target: RunnerRunTargetEvaluation,
): (RunnerFundingRouteContract & { targetCredits: number }) | undefined {
  if (
    target.accessTargetKind !== "remote" ||
    target.routeQuote?.unknownIceCount !== 0 ||
    target.knownAccessState === "known_no_current_payoff"
  )
    return undefined;
  const run = input.legalActions.find(
    (action) => action.actionId === target.actionId,
  );
  if (
    !run ||
    run.type !== "start_run" ||
    run.source !== "basic_action" ||
    run.expiresAtStateVersion !== input.playerView.stateVersion ||
    run.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) !== 1 ||
    run.costs.some((cost) => (cost.credits ?? 0) !== 0)
  )
    return undefined;
  const basic = candidates.find(exactBasicLiquidCreditCandidate);
  for (const candidate of candidates) {
    const recovery = exactTopHeapIncomeSource(input, candidate);
    if (!recovery) continue;
    const { debt } = recovery;
    const afterRecovery = input.playerView.own.credits - recovery.creditCost;
    if (afterRecovery < debt.installCost) continue;
    // Ordinary resource installation consumes one action. This is a bounded
    // forecast; its actual LegalAction must exist after the real recovery.
    const maximumBasics =
      input.playerView.own.clicks - recovery.clickCost - 1 - 1;
    for (
      let basicCreditCount = 0;
      basicCreditCount <= maximumBasics;
      basicCreditCount++
    ) {
      if (
        basicCreditCount > 0 &&
        (!basic ||
          basic.costProfile.clickCost !== 1 ||
          basic.economyProjection?.netLiquidCreditGain !== 1)
      )
        continue;
      const totalClickCost = recovery.clickCost + 1 + basicCreditCount;
      const credits =
        afterRecovery -
        debt.installCost +
        debt.installCreditGain +
        basicCreditCount;
      const fundedInput: AiDecisionInput = {
        ...input,
        playerView: {
          ...input.playerView,
          own: {
            ...input.playerView.own,
            credits,
            clicks: input.playerView.own.clicks - totalClickCost,
            // Recovery adds this one known card; its later install consumes it.
            heapOrArchives: input.playerView.own.heapOrArchives.slice(0, -1),
          },
        },
      };
      const funded = quoteRunnerRunTarget({
        input: fundedInput,
        deckCapabilities:
          createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
        runActionId: target.actionId,
        targetServerId: target.targetServerId,
      })?.target;
      if (
        !funded ||
        !runnerTerminalRemoteContestIsDirectlyMandatory(fundedInput, funded) ||
        funded.pathPassability !== "reachable" ||
        funded.routeQuote?.reachability !== "guaranteed_access" ||
        funded.routeQuote.unknownIceCount !== 0 ||
        funded.routeQuote.fundingGap !== 0 ||
        funded.routeQuote.conditionalReasons.length !== 0 ||
        funded.visibleTraceTagHazardUnavoidable ||
        (funded.unavoidableVisibleIceHazardCount ?? 0) > 0 ||
        funded.creditsAfterRun < 0
      )
        continue;
      return {
        targetCredits: funded.routeQuote.knownCost,
        routeActionIds: [candidate.actionId],
        routeAssessment: {
          stateVersion: input.playerView.stateVersion,
          routeId: `heap-income:${candidate.actionId}:${target.actionId}`,
          status: "covered_guaranteed",
          reliability: "guaranteed",
          horizon: "same_turn",
          projectedGap: 0,
          totalClickCost,
          firstStepActionId: candidate.actionId,
          heapIncomePreparation: {
            stateVersion: input.playerView.stateVersion,
            recoveryActionId: candidate.actionId,
            sourceCardInstanceId: recovery.source.instanceId,
            targetCardInstanceId: recovery.target.instanceId,
            targetDefinitionId: recovery.target.definitionId!,
            recoveryClickCost: recovery.clickCost,
            recoveryCreditCost: recovery.creditCost,
            runActionId: target.actionId,
            targetServerId: target.targetServerId,
            basicCreditCount,
            projectedRunCredits: credits,
            completeKnownPathCost: funded.routeQuote.knownCost,
          },
          evidenceCodes: [
            `runner_terminal_known_heap_income_target:${recovery.target.instanceId}`,
            `runner_terminal_heap_income_complete_known_cost:${funded.routeQuote.knownCost}`,
            `runner_terminal_heap_income_run_credits:${credits}`,
            `runner_terminal_heap_income_basic_credits:${basicCreditCount}`,
            "runner_heap_income_requires_engine_rematerialization_after_recovery",
          ],
        },
      };
    }
  }
  return undefined;
}

export function runnerHeapIncomePreparationMatchesCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  preparation: NonNullable<
    RunnerFundingRouteAssessment["heapIncomePreparation"]
  >,
): boolean {
  const recovery = exactTopHeapIncomeSource(input, candidate);
  return (
    recovery !== undefined &&
    preparation.stateVersion === input.playerView.stateVersion &&
    preparation.recoveryActionId === candidate.actionId &&
    preparation.sourceCardInstanceId === recovery.source.instanceId &&
    preparation.targetCardInstanceId === recovery.target.instanceId &&
    preparation.targetDefinitionId === recovery.target.definitionId &&
    preparation.recoveryClickCost === recovery.clickCost &&
    preparation.recoveryCreditCost === recovery.creditCost &&
    input.legalActions.some(
      (action) =>
        action.actionId === preparation.runActionId &&
        action.payload?.serverId === preparation.targetServerId &&
        action.expiresAtStateVersion === preparation.stateVersion,
    )
  );
}
