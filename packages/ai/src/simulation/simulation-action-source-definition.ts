import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { sourceDefinitionIdForSimulationAction as sourceDefinitionIdForSimulationSource } from "../runtime/simulation-card-target";

export function createSourceDefinitionIdForSimulationAction(
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined,
): (input: AiDecisionInput, action: LegalAction) => string | undefined {
  return (input, action) =>
    sourceDefinitionIdForSimulationSource(action, (id) =>
      findVisibleCard(input, id),
    );
}
