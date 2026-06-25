import { type AiDecisionInput, type LegalAction, type VisibleCard } from "@netgrid/shared";

export type ActionRoleLookupDependencies = {
  readonly findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  readonly rolesForCardId: (cardId: string | undefined) => string[];
};

export function rolesForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: ActionRoleLookupDependencies,
): string[] {
  if (action.source === "basic_action" || action.source === "game_rule")
    return [];
  const visible = dependencies.findVisibleCard(input, action.source);
  return dependencies.rolesForCardId(visible?.definitionId);
}
