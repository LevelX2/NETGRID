import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  type RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerCoverageServices } from "./coverage-services";
import { runnerAgendaStealCreditRequirement } from "../../run-analysis/runner-agenda-steal-cost";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerBreakerUpgradeRequiredRole } from "./coverage-breaker-upgrades";
import { runnerSameTurnInstallProjection } from "./coverage-same-turn-install-projection";
import type { RunnerCostEffectiveCoverageRecovery } from "./coverage-recovery";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { getStructuredBreakerProfileForCard } from "../../breaker-ontology-consumer";
import { visibleRunnerRunPathCreditBudgetForRig } from "../../run-analysis/visible-run-credit-budget";

/** A concrete parent preparation, not a claim that unknown ICE is passable. */
export function runnerSameTurnBreakerPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  deck: DeckCapabilityProfile,
  services: Pick<
    RunnerCoverageServices,
    | "runnerRunTargetCanConvertNow"
    | "runnerRunFundingSupport"
    | "runnerCentralPressureHasMaterialMarginalValue"
    | "runnerCentralPressureCadence"
    | "assessProgramInstallTarget"
  >,
): RunnerCostEffectiveCoverageRecovery | undefined {
  const currentRouteIsCostBlocked =
    evaluation.pathPassability === "blocked_unpayable" ||
    (evaluation.pathPassability === "blocked_by_visible_damage_hand_buffer" &&
      Number.isSafeInteger(evaluation.pathCost) &&
      evaluation.pathCost > input.playerView.own.credits);
  const central = evaluation.targetKind !== "remote";
  if (
    evaluation.runActionProjection?.sourceKind !== "basic_action" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoff === "known_low_value" ||
    (!currentRouteIsCostBlocked &&
      (evaluation.accessPayoffContestable === false || evaluation.score <= 0))
  )
    return undefined;
  if (
    central &&
    (!["hq", "rd"].includes(evaluation.targetServerId) ||
      (!currentRouteIsCostBlocked &&
        (evaluation.pathPassability !== "reachable" ||
          (evaluation.recommendation !== "run_now" &&
            evaluation.recommendation !== "run_if_free") ||
          !services.runnerCentralPressureHasMaterialMarginalValue(
            input,
            evaluation,
          ) ||
          (evaluation.prerunReserveQuote?.status !== "satisfied" &&
            evaluation.prerunReserveQuote?.status !== "not_required"))) ||
      !services.runnerCentralPressureCadence(
        input,
        evaluation.targetServerId as "hq" | "rd",
      ).routeAvailable)
  )
    return undefined;
  const server = input.playerView.servers.find(
    (s) => s.id === evaluation.targetServerId,
  );
  const runAction = input.legalActions.find(
    (a) => a.actionId === evaluation.actionId,
  );
  if (!server || !runAction || !server.ice.some((c) => c.known && c.rezzed))
    return undefined;
  const rig = input.playerView.own.rig ?? [];
  const currentPath = assessKnownRezzedIcePath(
    server.ice,
    rig,
    Number.MAX_SAFE_INTEGER,
    server.root,
    input.playerView.opponent.credits,
  );
  const currentCost = currentPath.visibleBreakCost;
  if (
    !currentPath.canReachAccess ||
    !Number.isSafeInteger(currentCost) ||
    currentCost! <= 0
  )
    return undefined;
  const runClicks = runAction.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
  const runCredits = runAction.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  if (!Number.isSafeInteger(memoryUsed) || !Number.isSafeInteger(memoryLimit))
    return undefined;
  return input.playerView.own.gripOrHq
    .flatMap((card) => {
      const breaker = deck.runner?.breakerInventory.find(
        (b) => b.cardId === card.definitionId,
      );
      if (
        !card.known ||
        !breaker ||
        breaker.confidence !== "high" ||
        breaker.restrictions.length > 0 ||
        breakerPreparationHasCurrentLiability(input, breaker) ||
        rig.some((c) => c.definitionId === card.definitionId)
      )
        return [];
      const role = runnerBreakerUpgradeRequiredRole(breaker, server);
      const projection = runnerSameTurnInstallProjection(
        input,
        candidates,
        card,
        services,
      );
      const install = projection?.install;
      if (
        !role ||
        !projection ||
        !install ||
        input.playerView.own.credits < install.creditCost
      )
        return [];
      const path = assessKnownRezzedIcePath(
        server.ice,
        projection.rig,
        Number.MAX_SAFE_INTEGER,
        server.root,
        input.playerView.opponent.credits,
      );
      const cost = path.visibleBreakCost;
      if (
        !path.canReachAccess ||
        path.blocked ||
        (path.futureClicksLost ?? 0) > 0 ||
        !Number.isSafeInteger(cost) ||
        cost! < 0
      )
        return [];
      const savings = currentCost! - cost!;
      const total = install.creditCost + cost! + runCredits;
      // Preserve the cost envelope of the existing route. Unseen encounters and
      // access reserves are still evaluated by the parent after installation.
      if (savings <= 0 || install.creditCost + cost! > currentCost!) return [];
      // A new central preparation must also beat its forgone basic-credit
      // clicks on this one known path, without assuming a second future run.
      if (central && savings <= install.creditCost + install.clickCost)
        return [];
      if (
        input.playerView.own.clicks < install.clickCost + runClicks ||
        input.playerView.own.credits < total ||
        (!currentRouteIsCostBlocked &&
          evaluation.stealOrTrashAffordable === false)
      )
        return [];
      let sameTurnRunConversion: RunnerCostEffectiveCoverageRecovery["sameTurnRunConversion"];
      if (currentRouteIsCostBlocked || central) {
        // Current liquidity is not a veto on a cheaper, complete same-turn
        // route. Requote that exact basic run after the native installation.
        // Unknown encounters retain the parent's reserve and hand-buffer
        // requirements. They do not veto savings on the visible path.
        const projectedInput: AiDecisionInput = {
          ...input,
          playerView: {
            ...input.playerView,
            own: {
              ...input.playerView.own,
              credits: input.playerView.own.credits - install.creditCost,
              clicks: input.playerView.own.clicks - install.clickCost,
              memoryUsed: projection.memoryUsed,
              gripOrHq: input.playerView.own.gripOrHq.filter(
                (entry) => entry.instanceId !== card.instanceId,
              ),
              rig: projection.rig.map((c) =>
                c.instanceId === card.instanceId ? { ...c, rezzed: true } : c,
              ),
            },
          },
        };
        const targetParams = { input: projectedInput, deckCapabilities: deck };
        // A cheaper central route must retain the current damage buffer after
        // spending the held card. Breaking the ICE does not replenish grip.
        if (
          central &&
          currentRouteIsCostBlocked &&
          projectedInput.playerView.own.gripOrHq.length <
            runnerDamageThreatAssessment(projectedInput).flatlineRisk
              .recommendedHandFloor
        )
          return [];
        const projectedTarget = evaluateRunnerRunTargets(targetParams).find(
          (target) =>
            target.actionId === evaluation.actionId &&
            target.targetServerId === server.id,
        );
        const projectedCandidates = candidates.filter(
          (candidate) => candidate.actionId !== install.actionId,
        );
        const projectedEconomy = buildRunnerEconomyPosture(targetParams);
        const projectedFunding =
          !central && projectedTarget
            ? services.runnerRunFundingSupport(
                projectedInput,
                projectedEconomy,
                projectedTarget,
                evaluateRunnerRunTargets(targetParams),
                projectedCandidates,
              )
            : undefined;
        const fundedConversion =
          projectedFunding !== undefined &&
          projectedFunding.routeActionIds.length > 0 &&
          projectedFunding.routeAssessment.status === "covered_guaranteed" &&
          projectedFunding.routeAssessment.horizon === "same_turn" &&
          projectedFunding.routeAssessment.projectedGap === 0 &&
          projectedFunding.routeAssessment.totalClickCost + runClicks <=
            projectedInput.playerView.own.clicks;
        // Preserve the admitted parent's actual budget. A generic desired
        // post-run top-up is not an additional requirement on a preparation
        // that leaves more cash after the same known path and access.
        const parentBudgetPreserved =
          central &&
          projectedTarget !== undefined &&
          projectedTarget.pathPassability === "reachable" &&
          (projectedTarget.recommendation === "run_now" ||
            projectedTarget.recommendation === "run_if_free") &&
          (projectedTarget.prerunReserveQuote?.status === "satisfied" ||
            projectedTarget.prerunReserveQuote?.status === "not_required") &&
          services.runnerCentralPressureHasMaterialMarginalValue(
            projectedInput,
            projectedTarget,
          ) &&
          projectedTarget.creditsAfterRun >= evaluation.creditsAfterRun &&
          projectedTarget.prerunReserveQuote.creditsAfterKnownPath >=
            evaluation.prerunReserveQuote!.creditsAfterKnownPath;
        if (
          !projectedTarget ||
          projectedTarget.score <= 0 ||
          projectedTarget.accessPayoffContestable === false ||
          projectedTarget.knownAccessState === "known_no_current_payoff" ||
          projectedTarget.stealOrTrashAffordable === false ||
          !(central
            ? parentBudgetPreserved
            : fundedConversion ||
              services.runnerRunTargetCanConvertNow(
                projectedInput,
                projectedEconomy,
                projectedTarget,
                projectedCandidates,
              ))
        )
          return [];
        const agendaIds = projectedTarget.accessFacts?.knownTargetDefinitionIds;
        const stealCredits = runnerAgendaStealCreditRequirement(
          projectedInput,
          server.id,
          agendaIds?.length ? agendaIds : undefined,
        );
        if (
          stealCredits === undefined ||
          input.playerView.own.credits < total + stealCredits
        )
          return [];
        if (currentRouteIsCostBlocked)
          sameTurnRunConversion = {
            targetRunActionId: evaluation.actionId,
            requiredCredits: fundedConversion
              ? input.playerView.own.credits + projectedFunding!.gap
              : total + stealCredits,
            requiredClicksAfterFunding: install.clickCost + runClicks,
            projectedKnownPathCost: cost!,
            postRunCreditFloor:
              projectedTarget.prerunReserveQuote?.requiredCredits ?? 0,
            ...(central
              ? { projectedCentralPressureValue: projectedTarget.score }
              : {}),
            installProjection: "current_legal_action",
          };
      }
      return [
        {
          requiredRole: role,
          totalRecoveryCost: total,
          visibleAnswer: { ...card, installCost: install.creditCost },
          deckHasAlternative: true,
          targetDefinitionId: breaker.cardId,
          recoveryMode: "install_visible_answer" as const,
          sameTurnPreparation: true as const,
          ...(sameTurnRunConversion ? { sameTurnRunConversion } : {}),
          evidenceCodes: [
            ...projection.removedIds.map(
              (id) => `same_turn_breaker_preparation_memory_sacrifice:${id}`,
            ),
            `same_turn_breaker_preparation:${server.id}`,
            `same_turn_breaker_preparation_current_known_cost:${currentCost}`,
            `same_turn_breaker_preparation_projected_known_cost:${cost}`,
            `same_turn_breaker_preparation_install_cost:${install.creditCost}`,
            `same_turn_breaker_preparation_total_known_cost:${total}`,
            `same_turn_breaker_preparation_unknown_ice:${server.ice.filter((c) => !c.known || !c.rezzed).length}`,
            "same_turn_breaker_preparation_same_turn_required:true",
          ],
        },
      ];
    })
    .sort(
      (a, b) =>
        a.totalRecoveryCost - b.totalRecoveryCost ||
        a.visibleAnswer.instanceId.localeCompare(b.visibleAnswer.instanceId),
    )[0];
}

/** An optional loss from an empty Stealth pool cannot consume run funding. */
export function breakerPreparationHasCurrentLiability(
  input: AiDecisionInput,
  breaker: NonNullable<
    DeckCapabilityProfile["runner"]
  >["breakerInventory"][number],
): boolean {
  if (breaker.risks.length === 0) return false;
  const profile = getStructuredBreakerProfileForCard(breaker.cardId);
  return !(
    breaker.risks.includes("stealth_loss") &&
    breaker.risks.every(
      (risk) => risk === "stealth_loss" || risk === "side_effect_penalty",
    ) &&
    profile?.sideEffects?.length === 1 &&
    profile.sideEffects[0] === "stealth_loss" &&
    visibleRunnerRunPathCreditBudgetForRig(input.playerView.own.rig ?? [])
      .stealthNonNoisyIcebreakerCredits === 0
  );
}
