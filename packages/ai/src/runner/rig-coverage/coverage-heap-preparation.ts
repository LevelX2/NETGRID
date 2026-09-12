import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { visibleCardCoversRequiredCoverage } from "./runner-search-coverage-need";

/** A bounded projection only. Every subsequent recovery, install and run must
 * be rematerialized from the next Engine LegalActions. */
export function runnerCoverageHeapPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): RunnerCoverageGapSignal["heapRecoveryPreparation"] | undefined {
  if (
    input.playerView.timingPoint !== "runner_action.main" ||
    evaluation.targetKind !== "remote" ||
    !evaluation.scoreThreat ||
    evaluation.accessPayoffContestable === false ||
    evaluation.pathPassability !== "blocked_missing_coverage"
  )
    return undefined;
  const server = input.playerView.servers.find(
    (s) => s.id === evaluation.targetServerId,
  );
  const runAction = input.legalActions.find(
    (a) => a.actionId === evaluation.actionId,
  );
  if (
    !server ||
    !runAction ||
    server.ice.length === 0 ||
    server.ice.some((c) => !c.known || c.rezzed !== true)
  )
    return undefined;
  const heap = input.playerView.own.heapOrArchives;
  const fromTop = [...heap]
    .reverse()
    .findIndex(
      (c) =>
        c.known &&
        visibleCardCoversRequiredCoverage(c, requiredRole, (id) =>
          rolesForDeckDoctrineCard(id ?? ""),
        ),
    );
  const targetIndex = fromTop < 0 ? -1 : heap.length - 1 - fromTop;
  const depth = heap.length - targetIndex;
  if (
    targetIndex < 0 ||
    depth < 2 ||
    heap.slice(targetIndex).some((c) => !c.known)
  )
    return undefined;
  const answer = heap[targetIndex]!;
  const definition = answer.definitionId
    ? CARD_DEFINITIONS_BY_ID[answer.definitionId]
    : undefined;
  const memoryUsed = input.playerView.own.memoryUsed,
    memoryLimit = input.playerView.own.memoryLimit;
  if (
    definition?.type !== "program" ||
    !Number.isSafeInteger(definition.installCost) ||
    definition.installCost! < 0 ||
    !Number.isSafeInteger(definition.memoryCost) ||
    !Number.isSafeInteger(memoryUsed) ||
    !Number.isSafeInteger(memoryLimit) ||
    memoryUsed! + definition.memoryCost! > memoryLimit!
  )
    return undefined;
  const runClicks = runAction.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
  const runCredits = runAction.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  if (runClicks <= 0) return undefined;
  for (const candidate of candidates) {
    const action = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    if (
      action?.type !== "activated_card_ability" ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      action.payload?.cardImplementationEffectKind !==
        "move_top_trash_to_grip" ||
      action.payload.targetCardId !== heap.at(-1)?.instanceId
    )
      continue;
    const source = input.playerView.own.rig?.find(
      (c) => c.instanceId === action.source,
    );
    const ability = source?.definitionId
      ? cardImplementationForDefinitionId(source.definitionId)?.abilities?.find(
          (a) =>
            "capabilityKey" in a &&
            a.capabilityKey === action.payload?.cardImplementationAbilityKey,
        )
      : undefined;
    if (
      ability?.kind !== "activated" ||
      ability.timing !== "runner_main" ||
      ability.condition ||
      ability.limit ||
      ability.effects.length !== 1 ||
      ability.effects[0]?.kind !== "move_top_trash_to_grip" ||
      ability.effects[0].recipient !== "runner" ||
      ability.costs.some((c) => c.kind !== "credit" && c.kind !== "action")
    )
      continue;
    const clickCost = action.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
    const creditCost = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
    const requiredClicks = depth * clickCost + 1 + runClicks;
    const upfrontCredits =
      depth * creditCost + definition.installCost! + runCredits;
    if (
      clickCost <= 0 ||
      requiredClicks > input.playerView.own.clicks ||
      upfrontCredits > input.playerView.own.credits
    )
      continue;
    const rig = [...(input.playerView.own.rig ?? []), answer];
    const path = assessKnownRezzedIcePath(
      server.ice,
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(
        input.playerView.own.credits - upfrontCredits,
        rig,
      ),
      server.root,
      input.playerView.opponent.credits,
    );
    if (
      !path.canReachAccess ||
      path.blocked ||
      (path.futureClicksLost ?? 0) > 0 ||
      (path.unavoidableVisibleIceHazardCount ?? 0) > 0 ||
      path.visibleTraceTagHazardUnavoidable ||
      (path.conditionalAccessReasons?.length ?? 0) > 0 ||
      (path.conditionalRiskReasons?.length ?? 0) > 0 ||
      path.preRunPreparation
    )
      continue;
    return {
      actionId: action.actionId,
      sourceCardInstanceId: action.source,
      currentTopCardInstanceId: heap.at(-1)!.instanceId,
      targetCardInstanceId: answer.instanceId,
      targetDefinitionId: answer.definitionId!,
      recoveryCount: depth,
      requiredClicks,
      upfrontCredits,
      projectedKnownPathCost: path.visibleBreakCost ?? 0,
      stateVersion: input.playerView.stateVersion,
    };
  }
  return undefined;
}
