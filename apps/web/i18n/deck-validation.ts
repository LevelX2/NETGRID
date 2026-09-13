import {
  assertDeckValidationIssues,
  type DeckValidationIssueCode,
  type DeckValidationResult,
} from "@netgrid/decks";

export type DeckValidationTranslator = (
  code: DeckValidationIssueCode,
  values: Record<string, string | number>,
) => string;

export function localizedDeckValidationIssues(
  validation: DeckValidationResult,
  translate: DeckValidationTranslator,
): string[] {
  assertDeckValidationIssues(validation);
  return validation.issues.map((issue) => translate(issue.code, issue.params));
}
