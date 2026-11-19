import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessRunnerAccessTrashImpactFromPlanningCard,
  type RunnerAccessTrashImpactAssessment,
} from "../../access/runner-access-trash-impact";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import {
  remoteTrashActionTotalCost,
  remoteTrashQuotedDedicatedCredits,
} from "../../runtime/remote-trash-cost";

export function assessRunnerAccessTrashImpact(params: {
  input: AiDecisionInput;
  trashAction: LegalAction;
  economyReserve: number;
  parentReservedCredits?: number;
}): RunnerAccessTrashImpactAssessment | undefined {
  const { input, trashAction } = params;
  if (
    input.side !== "runner" ||
    !actionMatchesCurrentDecision(input, trashAction) ||
    trashAction.type !== "trash_accessed_card"
  )
    return undefined;
  const accessed = input.playerView.run?.accessedCard;
  if (
    accessed?.known !== true ||
    !accessed.definitionId ||
    trashAction.source !== accessed.instanceId
  )
    return undefined;
  const planningCard = planningCardByDefinitionId(
    accessed.definitionId,
  );
  if (!planningCard || planningCard.side !== "corp") return undefined;
  const trashCost = remoteTrashActionTotalCost(params.trashAction);
  const dedicatedTrashCredits = remoteTrashQuotedDedicatedCredits(
    trashAction,
    accessed,
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
