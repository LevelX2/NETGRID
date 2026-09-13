import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import {
  runnerBreakerUpgradeRequiredRole,
  runnerVisibleBreakerUpgradeInstallRoute,
} from "./coverage-breaker-upgrades";
import type { RunnerCostEffectiveCoverageRecovery } from "./coverage-recovery";

/** A concrete remote preparation, not a claim that unknown ICE is passable. */
export function runnerRemoteBreakerPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  deck: DeckCapabilityProfile,
): RunnerCostEffectiveCoverageRecovery | undefined {
  if (
    evaluation.targetKind !== "remote" ||
    evaluation.runActionProjection?.sourceKind !== "basic_action" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoff === "known_low_value" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.score <= 0
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
        breaker.risks.length > 0 ||
        rig.some((c) => c.definitionId === card.definitionId)
      )
        return [];
      const role = runnerBreakerUpgradeRequiredRole(breaker, server);
      const install = runnerVisibleBreakerUpgradeInstallRoute(
        input,
        candidates,
        card,
      );
      if (
        !role ||
        !install ||
        !Number.isSafeInteger(card.memoryCost) ||
        card.memoryCost! + memoryUsed! > memoryLimit! ||
        input.playerView.own.credits < install.creditCost
      )
        return [];
      const path = assessKnownRezzedIcePath(
        server.ice,
        [...rig, card],
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
      if (
        input.playerView.own.clicks < install.clickCost + runClicks ||
        input.playerView.own.credits < total ||
        evaluation.stealOrTrashAffordable === false
      )
        return [];
      return [
        {
          requiredRole: role,
          totalRecoveryCost: total,
          visibleAnswer: { ...card, installCost: install.creditCost },
          deckHasAlternative: true,
          targetDefinitionId: breaker.cardId,
          recoveryMode: "install_visible_answer" as const,
          remotePreparation: true as const,
          evidenceCodes: [
            `remote_breaker_preparation:${server.id}`,
            `remote_breaker_preparation_current_known_cost:${currentCost}`,
            `remote_breaker_preparation_projected_known_cost:${cost}`,
            `remote_breaker_preparation_install_cost:${install.creditCost}`,
            `remote_breaker_preparation_total_known_cost:${total}`,
            `remote_breaker_preparation_unknown_ice:${server.ice.filter((c) => !c.known || !c.rezzed).length}`,
            "remote_breaker_preparation_same_turn_required:true",
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
