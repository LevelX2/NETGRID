import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessRunnerAccessTrashImpactFromPlanningCard,
  type RunnerAccessTrashImpactAssessment,
} from "../access/runner-access-trash-impact";
import { remoteTrashActionTotalCost } from "./remote-trash-cost";

export function assessRunnerAccessTrashImpact(params: {
  input: AiDecisionInput;
  trashAction: LegalAction;
  economyReserve: number;
  parentReservedCredits?: number;
}): RunnerAccessTrashImpactAssessment | undefined {
  if (params.trashAction.type !== "trash_accessed_card") return undefined;
  const accessed = params.input.playerView.run?.accessedCard;
  if (!accessed?.known || !accessed.definitionId) return undefined;
  const planningCard = cardSpecPlanningCardByDefinitionId(
    accessed.definitionId,
  );
  if (!planningCard || planningCard.planning.side !== "corp") return undefined;
  const trashCost = remoteTrashActionTotalCost(params.trashAction);
  const dedicatedTrashCredits = exactQuotedDedicatedTrashCredits(
    params.trashAction,
    trashCost,
  );
  return assessRunnerAccessTrashImpactFromPlanningCard({
    planningCard,
    accessed,
    trashCost,
    dedicatedTrashCredits,
    runnerCredits: params.input.playerView.own.credits,
    economyReserve: params.economyReserve,
    parentReservedCredits: params.parentReservedCredits ?? 0,
  });
}

function exactQuotedDedicatedTrashCredits(
  action: LegalAction,
  totalCost: number,
): number {
  const quoted = [
    action.payload?.upgradeTrashRecurringCreditsAvailable,
    action.payload?.poltergeistRecurringCreditsAvailable,
  ].reduce<number>(
    (sum, value) =>
      sum +
      (typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0),
    0,
  );
  return Math.min(totalCost, quoted);
}
