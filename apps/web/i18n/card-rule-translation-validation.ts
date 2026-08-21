export type CardRuleTranslationSource = Readonly<{
  definitionId: string;
  title: string;
  englishRulesText: string;
}>;

export type CardRuleTranslationIssue = Readonly<{
  code:
    | "empty_translation"
    | "bracket_tokens_changed"
    | "digits_changed"
    | "action_markers_changed"
    | "subroutine_markers_changed"
    | "card_title_changed";
  detail: string;
}>;

export function cardRuleTranslationIssues(
  source: CardRuleTranslationSource,
  translation: string,
): readonly CardRuleTranslationIssue[] {
  const issues: CardRuleTranslationIssue[] = [];
  if (!translation.trim()) {
    issues.push({ code: "empty_translation", detail: "Translation is empty." });
    return issues;
  }

  compareMultiset(
    "bracket_tokens_changed",
    "Bracket tokens",
    tokens(source.englishRulesText, /\[[^\]\r\n]+\]/g),
    tokens(translation, /\[[^\]\r\n]+\]/g),
    issues,
  );
  compareMultiset(
    "digits_changed",
    "Digit sequences",
    tokens(source.englishRulesText, /\d+(?:\.\d+)?/g),
    tokens(translation, /\d+(?:\.\d+)?/g),
    issues,
  );
  compareCount(
    "action_markers_changed",
    "A: markers",
    occurrences(source.englishRulesText, /\bA:/g),
    occurrences(translation, /\bA:/g),
    issues,
  );
  compareCount(
    "subroutine_markers_changed",
    "Subroutine markers",
    occurrences(source.englishRulesText, /\*/g),
    occurrences(translation, /\*/g),
    issues,
  );

  if (
    source.englishRulesText.includes(source.title) &&
    !translation.includes(source.title)
  ) {
    issues.push({
      code: "card_title_changed",
      detail: `Card title ${JSON.stringify(source.title)} is missing.`,
    });
  }
  return issues;
}

function tokens(value: string, pattern: RegExp): string[] {
  return [...value.matchAll(pattern)].map(([token]) => token).sort();
}

function occurrences(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function compareMultiset(
  code: CardRuleTranslationIssue["code"],
  label: string,
  source: readonly string[],
  translation: readonly string[],
  issues: CardRuleTranslationIssue[],
) {
  if (JSON.stringify(source) === JSON.stringify(translation)) return;
  issues.push({
    code,
    detail: `${label} differ: ${JSON.stringify(source)} -> ${JSON.stringify(translation)}.`,
  });
}

function compareCount(
  code: CardRuleTranslationIssue["code"],
  label: string,
  source: number,
  translation: number,
  issues: CardRuleTranslationIssue[],
) {
  if (source === translation) return;
  issues.push({
    code,
    detail: `${label} differ: ${source} -> ${translation}.`,
  });
}
