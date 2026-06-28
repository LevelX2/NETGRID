import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import {
  cardCoverageSearchText,
  cardProvidesBreakerCoverage,
} from "./tactical-plan-breaker-cards";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";
import type { RequiredCapabilityKind } from "./tactical-plan-types";

export function recoveryTargetDefinitionId(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const payload = action.payload ?? {};
  const direct =
    payload.targetCardDefinitionId ??
    payload.returnedCardDefinitionId ??
    payload.cardDefinitionId ??
    payload.targetDefinitionId;
  if (typeof direct === "string") return direct;
  const targetCard = recoveryTargetVisibleCard(input, action);
  return targetCard?.definitionId;
}

export function recoveryTargetVisibleCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const payload = action.payload ?? {};
  const targetId =
    payload.targetCardId ??
    payload.cardImplementationTopTrashTargetId ??
    payload.returnedCardId;
  return typeof targetId === "string"
    ? visibleCardByInstanceId(input.playerView, targetId)
    : undefined;
}

export function cardPlanRoleForCoverageSearch(card: VisibleCard): string {
  if (cardProvidesBreakerCoverage(card, "breaker_coverage")) return "breaker";
  const tokens = cardCoverageRoleTokens(cardCoverageSearchText(card));
  if (tokensIncludeAny(tokens, ["search", "tutor"])) return "search";
  if (tokensIncludeAny(tokens, ["draw"])) return "draw";
  if (
    tokensIncludeAny(tokens, ["credit", "credits", "economy"]) ||
    tokensIncludeGainAmount(tokens)
  ) {
    return "economy";
  }
  return card.type ?? "unknown";
}

export function cardDefinitionPlanRoleForCoverageSearch(definitionId: string): string {
  if (cardDefinitionProvidesBreakerCoverage(definitionId, "breaker_coverage"))
    return "breaker";
  const definition = DEMO_CARDS_BY_ID[definitionId];
  const tokens = cardCoverageRoleTokens(
    [
      definition?.title,
      definition?.type,
      ...(definition?.subtypes ?? []),
      definition?.rulesText,
      ...(definition?.mechanics ?? []),
    ].filter(Boolean).join(" "),
  );
  if (tokensIncludeAny(tokens, ["search", "tutor"])) return "search";
  if (tokensIncludeAny(tokens, ["draw"])) return "draw";
  if (
    tokensIncludeAny(tokens, ["credit", "credits", "economy", "gain_credits"]) ||
    tokensIncludePhrase(tokens, ["gain", "credits"]) ||
    tokensIncludeGainAmount(tokens)
  ) {
    return "economy";
  }
  return definition?.type ?? "unknown";
}

export function coveragePlanRoleMatches(
  role: string | undefined,
  needles: readonly string[],
): boolean {
  if (!role) return false;
  return needles.some((needle) =>
    role
      .split(/[.:-]+/)
      .some((segment) => coveragePlanRoleSegmentMatches(segment, needle)),
  );
}

function coveragePlanRoleSegmentMatches(segment: string, needle: string): boolean {
  return (
    segment === needle ||
    segment.startsWith(`${needle}_`) ||
    segment.endsWith(`_${needle}`) ||
    segment.includes(`_${needle}_`)
  );
}

function cardCoverageRoleTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length > 0);
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

function tokensIncludeGainAmount(tokens: readonly string[]): boolean {
  return tokens.some(
    (token, index) => token === "gain" && tokenIsDigits(tokens[index + 1]),
  );
}

function tokenIsDigits(token: string | undefined): boolean {
  return (
    token !== undefined &&
    token.length > 0 &&
    [...token].every((character) => character >= "0" && character <= "9")
  );
}

export function cardDefinitionProvidesBreakerCoverage(
  definitionId: string,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  if (!definition) return false;
  return cardProvidesBreakerCoverage(
    {
      instanceId: definitionId,
      definitionId,
      title: definition.title,
      owner: "runner",
      controller: "runner",
      type: definition.type,
      known: true,
      subtypes: definition.subtypes,
      rulesText: definition.rulesText,
    },
    requiredCoverage,
  );
}
