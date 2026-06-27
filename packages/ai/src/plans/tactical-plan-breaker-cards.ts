import type { VisibleCard } from "@netgrid/shared";
import type { RequiredCapabilityKind } from "./tactical-plan-types";

export function cardLooksLikeBreaker(card: VisibleCard): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      /breaker|icebreaker|fracter|decoder|killer/i.test(subtype),
    ) ||
      /breaker|icebreaker/i.test(card.title ?? "") ||
      /breaker|icebreaker/i.test(card.definitionId ?? ""))
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
  const text = cardCoverageSearchText(card);
  if (cardLooksLikeUniversalBreaker(text)) return true;
  switch (requiredCoverage) {
    case "breaker_wall":
      return /fracter|wall|barrier/.test(text);
    case "breaker_code_gate":
      return /decoder|code gate|codegate/.test(text);
    case "breaker_sentry":
      return /killer|sentry/.test(text);
    case "breaker_ap":
      return /\bap\b|anti-personnel/.test(text);
    case "breaker_trace":
      return /trace/.test(text);
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

function cardLooksLikeUniversalBreaker(text: string): boolean {
  return (
    /break (?:an? |one |\d+ )?ice subroutine/.test(text) ||
    (/break(?:s)? .*subroutine/.test(text) &&
      !/wall|barrier|code gate|codegate|sentry/.test(text))
  );
}
