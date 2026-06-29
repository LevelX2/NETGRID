import type { VisibleCard } from "@netgrid/shared";
import type { RequiredCapabilityKind } from "./tactical-plan-types";

const BREAKER_SUBTYPE_TOKENS = new Set([
  "breaker",
  "icebreaker",
  "fracter",
  "decoder",
  "killer",
]);

export function cardLooksLikeBreaker(card: VisibleCard): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      cardTokens(subtype).some((token) => BREAKER_SUBTYPE_TOKENS.has(token)),
    ) ||
      cardHasAnyToken(card.title, ["breaker", "icebreaker"]) ||
      cardHasAnyToken(card.definitionId, ["breaker", "icebreaker"]))
  );
}

export function cardProvidesBreakerCoverage(
  card: VisibleCard,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  if (!cardLooksLikeBreaker(card)) return false;
  if (
    requiredCoverage === "breaker_coverage" ||
    requiredCoverage === "breaker_universal"
  ) {
    return true;
  }
  const tokens = cardCoverageTokens(card);
  if (cardLooksLikeUniversalBreaker(tokens)) return true;
  switch (requiredCoverage) {
    case "breaker_wall":
      return tokensIncludeAny(tokens, ["fracter", "wall", "barrier"]);
    case "breaker_code_gate":
      return (
        tokensIncludeAny(tokens, ["decoder", "codegate"]) ||
        tokensIncludePhrase(tokens, ["code", "gate"])
      );
    case "breaker_sentry":
      return tokensIncludeAny(tokens, ["killer", "sentry"]);
    case "breaker_ap":
      return (
        tokensIncludeAny(tokens, ["ap"]) ||
        tokensIncludePhrase(tokens, ["anti", "personnel"])
      );
    case "breaker_trace":
      return tokensIncludeAny(tokens, ["trace"]);
    default:
      return false;
  }
}

export function cardCoverageSearchText(card: VisibleCard): string {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function cardCoverageTokens(card: VisibleCard): string[] {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ].flatMap((entry) => cardTokens(entry));
}

function cardTokens(value: string | undefined): string[] {
  return (value ?? "")
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function cardHasAnyToken(
  value: string | undefined,
  needles: readonly string[],
): boolean {
  return tokensIncludeAny(cardTokens(value), needles);
}

function tokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((word, offset) => tokens[index + offset] === word),
  );
}

function cardLooksLikeUniversalBreaker(tokens: readonly string[]): boolean {
  const hasGenericIceBreakPhrase = tokens.some((token, index) => {
    if (token !== "break" && token !== "breaks") return false;
    const nextTokens = tokens.slice(index + 1, index + 4);
    const iceIndex = nextTokens.findIndex((next) => next === "ice");
    return iceIndex >= 0 && nextTokens[iceIndex + 1] === "subroutine";
  });
  const tokenSet = new Set(tokens);
  return (
    hasGenericIceBreakPhrase ||
    ((tokenSet.has("break") || tokenSet.has("breaks")) &&
      tokenSet.has("subroutine") &&
      !tokensIncludeAny(tokens, ["wall", "barrier", "codegate", "sentry"]) &&
      !tokensIncludePhrase(tokens, ["code", "gate"]))
  );
}
