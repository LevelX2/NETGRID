import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { rolesMatch } from "./role-match";

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

const SOURCE_SEARCH_TOKENS = [
  "runner.search.breaker",
  "program_search",
  "search_stack",
  "stack_search",
  "search",
  "tutor",
];

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
  const mechanics = definitionDisplay?.mechanics ?? [];
  if (rolesMatch(roles, ["search", "tutor"])) return "search";
  if (rolesMatch(mechanics, ["search", "tutor"])) return "search";
  if (rolesMatch(roles, ["draw"])) return "draw";
  if (rolesMatch(mechanics, ["draw"])) return "draw";
  const tokens = sourceAnswerTokens([
    sourceCard?.title,
    sourceCard?.type,
    ...(sourceCard?.subtypes ?? []),
    sourceCard?.rulesText,
    definitionDisplay?.title,
    definitionDisplay?.type,
    ...(definitionDisplay?.subtypes ?? []),
    definitionDisplay?.rulesText,
  ]);
  if (sourceAnswerTokensIncludeAny(tokens, SOURCE_SEARCH_TOKENS)) {
    return "search";
  }
  if (sourceAnswerTokensIncludeAny(tokens, ["draw", "draw_card"])) return "draw";
  return undefined;
}

function sourceAnswerTokens(values: readonly (string | undefined)[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) =>
      value
        .toLocaleLowerCase("en-US")
        .split(/[^a-z0-9_.]+/)
        .filter((token) => token.length > 0),
    );
}

function sourceAnswerTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}
