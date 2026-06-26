import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
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

export function createDefinitionForSimulationAction(
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined,
) {
  return (input: AiDecisionInput, action: LegalAction) => {
    const definitionId = sourceDefinitionIdForAction(input, action);
    return definitionId
      ? (RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId])
      : undefined;
  };
}
