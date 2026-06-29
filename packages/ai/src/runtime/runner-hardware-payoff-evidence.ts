import { type VisibleCard } from "@netgrid/shared";

export function corpVisibleRunnerHardwarePayoffEvidence(
  card: VisibleCard,
): string[] {
  const tokens = hardwarePayoffTokens(
    `${card.title ?? ""} ${card.rulesText ?? ""}`,
  );
  const tokenSet = new Set(tokens);
  const hasMultiaccessPayoff =
    hardwarePayoffTokensIncludePhrase(tokens, ["additional", "card"]) ||
    hardwarePayoffTokensIncludePhrase(tokens, ["access", "1", "additional"]) ||
    tokenSet.has("multiaccess");
  return [
    `target_definition:${card.definitionId ?? "unknown"}`,
    ...(hasMultiaccessPayoff ? ["runner_hardware_payoff:multiaccess"] : []),
  ];
}

function hardwarePayoffTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .replace(/&/g, "and")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function hardwarePayoffTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((word, offset) => tokens[index + offset] === word),
  );
}
