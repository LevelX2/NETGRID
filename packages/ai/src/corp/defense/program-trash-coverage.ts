import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

type CoverageLoss = { lostAffordableIce: number; additionalCredits: number };

/** Compare current visible responses, not future draws or a guaranteed whole-run result. */
export function programTrashCoverageLosses(
  input: AiDecisionInput,
  targets: readonly VisibleCard[],
): Map<string, CoverageLoss> {
  const rig = input.playerView.opponent.rig ?? [];
  const losses = new Map(
    targets.map((card) => [
      card.instanceId,
      { lostAffordableIce: 0, additionalCredits: 0 },
    ]),
  );
  for (const server of input.playerView.servers) {
    for (const ice of server.ice) {
      if (!ice.known || ice.rezzed !== true) continue;
      const quote = ice.effectiveRunQuote;
      if (
        !quote ||
        quote.iceInstanceId !== ice.instanceId ||
        quote.iceDefinitionId !== ice.definitionId
      ) {
        throw new PlanResolutionFailure("missing_action_semantics", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((a) => a.type),
          unresolvedActionIds: input.legalActions.map((a) => a.actionId),
          owner: "rules_contract",
          removalCondition:
            "Program-trash coverage requires the exact Engine run quote of each known rezzed ICE.",
        });
      }
      const assess = (remaining: VisibleCard[]) =>
        assessKnownRezzedIcePath(
          [ice],
          remaining,
          runnerRunPathCreditBudgetWithVisiblePools(
            input.playerView.opponent.credits,
            remaining,
          ),
          server.root,
          input.playerView.own.credits,
          { targetServerId: server.id },
        );
      const before = assess(rig);
      // Conditional/special routes do not prove a coverage loss. Never promote
      // an already blocked ICE merely because another breaker was removed.
      if (
        !before.canReachAccess ||
        before.hasBypassOrSpecialAccessPlan ||
        before.conditionalAccessReasons?.length ||
        before.conditionalRiskReasons?.length
      )
        continue;
      for (const target of targets) {
        const after = assess(
          rig.filter((card) => card.instanceId !== target.instanceId),
        );
        if (
          after.hasBypassOrSpecialAccessPlan ||
          after.conditionalAccessReasons?.length ||
          after.conditionalRiskReasons?.length
        )
          continue;
        const loss = losses.get(target.instanceId)!;
        if (!after.canReachAccess) loss.lostAffordableIce++;
        else
          loss.additionalCredits += Math.max(
            0,
            before.creditsAfterPath - after.creditsAfterPath,
          );
      }
    }
  }
  return losses;
}
