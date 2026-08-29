import {
  traceBaseLinkCardImplementationQuotesForDefinition,
  traceRulesDefinition,
} from "@netgrid/engine";
import type {
  CardDefinitionId,
  TraceRulesProfile,
  VisibleEffectiveIceRunQuote,
  VisibleEffectiveSubroutine,
} from "@netgrid/shared";

export type VisibleClassicLinkModifier = {
  creditCost: number;
  linkDelta: number;
};

export function planningTraceRulesProfile(
  profile: TraceRulesProfile | undefined,
): TraceRulesProfile {
  return profile ?? "modern_open";
}

export function planningTraceCorpBaseStrength(
  subroutine: VisibleEffectiveSubroutine,
  profile: TraceRulesProfile | undefined,
): number | undefined {
  if (typeof subroutine.traceLimit !== "number") return undefined;
  const printedTrace = Math.max(0, Math.floor(subroutine.traceLimit));
  return traceRulesDefinition(planningTraceRulesProfile(profile))
    .corpBaseStrengthMode === "printed_trace"
    ? printedTrace
    : 0;
}

export function planningVisibleCorpTraceBidCapacity(
  quote: VisibleEffectiveIceRunQuote | undefined,
  subroutine: VisibleEffectiveSubroutine | undefined,
  visibleCorpCredits: number,
  profile: TraceRulesProfile | undefined,
): number {
  const available =
    Math.max(0, Math.floor(visibleCorpCredits)) +
    Math.max(0, Math.floor(quote?.encounterTemporaryTraceCredits ?? 0));
  const definition = traceRulesDefinition(planningTraceRulesProfile(profile));
  if (definition.corpBidLimitMode === "payment_capacity") return available;
  const printedLimit = subroutine?.traceLimit;
  return printedLimit === undefined
    ? available
    : Math.min(available, Math.max(0, Math.floor(printedLimit)));
}

export function planningRunnerNeedsStrictlyMore(
  profile: TraceRulesProfile | undefined,
): boolean {
  return (
    traceRulesDefinition(planningTraceRulesProfile(profile)).tieWinner === "corp"
  );
}

export function planningClassicLinkModifierForBaseLinkOption(option: {
  sourceDefinitionId?: string;
  activationCost: number;
}): VisibleClassicLinkModifier | undefined {
  if (!option.sourceDefinitionId) return undefined;
  const quotes = traceBaseLinkCardImplementationQuotesForDefinition(
    option.sourceDefinitionId as CardDefinitionId,
  ).filter(
    (quote) =>
      quote.creditCost === option.activationCost &&
      quote.classicLinkModifier !== undefined,
  );
  if (quotes.length !== 1) return undefined;
  const modifier = quotes[0]!.classicLinkModifier;
  if (!modifier) return undefined;
  return {
    creditCost: Math.max(0, Math.floor(modifier.creditCost)),
    linkDelta: Math.max(0, Math.floor(modifier.linkDelta)),
  };
}

export function planningDefinitionIsBaseLinkCard(
  sourceDefinitionId: string | undefined,
): boolean {
  if (!sourceDefinitionId) return false;
  return (
    traceBaseLinkCardImplementationQuotesForDefinition(
      sourceDefinitionId as CardDefinitionId,
    ).length > 0
  );
}

export function planningMinimumClassicLinkPayment(
  requiredLinkDelta: number,
  modifier: VisibleClassicLinkModifier | undefined,
): number | undefined {
  const required = Math.max(0, Math.floor(requiredLinkDelta));
  if (required === 0) return 0;
  if (!modifier || modifier.creditCost <= 0 || modifier.linkDelta <= 0) {
    return undefined;
  }
  return Math.ceil(required / modifier.linkDelta) * modifier.creditCost;
}
