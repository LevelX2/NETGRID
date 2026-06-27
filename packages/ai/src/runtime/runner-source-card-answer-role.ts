import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

type RunnerSourceCardMetadata = {
  title?: string;
  type?: string;
  subtypes?: string[];
  rulesText?: string;
  definitionId?: string;
};

type RunnerSourceDefinitionMetadata = {
  title?: string;
  type?: string;
  subtypes?: string[];
  rulesText?: string;
  mechanics?: string[];
};

export type RunnerSourceCardAnswerRoleDependencies = {
  visibleSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerSourceCardMetadata | undefined;
  sourceDefinitionId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  rolesForCardId: (cardId: string | undefined) => string[];
  sourceDefinition: (
    definitionId: string | undefined,
  ) => RunnerSourceDefinitionMetadata | undefined;
};

export function runnerSourceCardAnswerRole(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerSourceCardAnswerRoleDependencies,
): "search" | "draw" | undefined {
  const sourceCard = dependencies.visibleSourceCard(input, action);
  const sourceDefinitionId =
    sourceCard?.definitionId || dependencies.sourceDefinitionId(input, action);
  const roles = dependencies.rolesForCardId(sourceDefinitionId);
  const definitionDisplay = dependencies.sourceDefinition(sourceDefinitionId);
  const text = [
    sourceCard?.title,
    sourceCard?.type,
    ...(sourceCard?.subtypes ?? []),
    sourceCard?.rulesText,
    definitionDisplay?.title,
    definitionDisplay?.type,
    ...(definitionDisplay?.subtypes ?? []),
    definitionDisplay?.rulesText,
    ...(definitionDisplay?.mechanics ?? []),
    ...roles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    /runner\.search\.breaker|program_search|search_stack|stack_search|search|tutor/.test(
      text,
    )
  ) {
    return "search";
  }
  if (/draw|draw_card/.test(text)) return "draw";
  return undefined;
}
