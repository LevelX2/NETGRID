import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import type { AiDecisionInput, CardDefinitionId } from "@netgrid/shared";

export type LatestTraceContext = {
  sourceDefinitionId?: string;
  baseTraceStrength?: number;
  traceStrength?: number;
  runnerLink?: number;
  corpBid?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidTraceLinkBonus?: number;
};

export function latestTraceContext(input: AiDecisionInput): LatestTraceContext {
  const visibleRunnerLink = visibleRunnerLinkAtCorpBid(input);
  for (const event of input.eventTail.slice().reverse()) {
    const baseTraceStrength = event.publicPayload.baseTraceStrength;
    const traceStrength =
      event.publicPayload.traceStrength ??
      baseTraceStrength;
    const runnerLink = event.publicPayload.runnerLink;
    const corpBid = event.publicPayload.corpBid;
    const runnerBid = event.publicPayload.runnerBid;
    const runnerStrength = event.publicPayload.runnerStrength;
    const postBidTraceLinkBonus = event.publicPayload.postBidTraceLinkBonus;
    const sourceDefinitionId = event.publicPayload.sourceDefinitionId;
    if (
      typeof traceStrength === "number" ||
      typeof runnerLink === "number" ||
      typeof corpBid === "number" ||
      typeof runnerBid === "number" ||
      typeof runnerStrength === "number" ||
      typeof postBidTraceLinkBonus === "number"
    ) {
      return {
        ...(typeof sourceDefinitionId === "string" &&
        sourceDefinitionId.length > 0
          ? { sourceDefinitionId }
          : {}),
        ...(typeof baseTraceStrength === "number"
          ? { baseTraceStrength }
          : {}),
        ...(typeof traceStrength === "number" ? { traceStrength } : {}),
        ...(typeof runnerLink === "number"
          ? { runnerLink }
          : { runnerLink: visibleRunnerLink }),
        ...(typeof corpBid === "number" ? { corpBid } : {}),
        ...(typeof runnerBid === "number" ? { runnerBid } : {}),
        ...(typeof runnerStrength === "number" ? { runnerStrength } : {}),
        ...(typeof postBidTraceLinkBonus === "number"
          ? { postBidTraceLinkBonus }
          : {}),
      };
    }
  }
  return { runnerLink: visibleRunnerLink };
}

function visibleRunnerLinkAtCorpBid(input: AiDecisionInput): number {
  const identityLink = normalizedLink(
    input.side === "corp"
      ? input.playerView.opponent.identity.baseLink
      : input.playerView.own.identity.baseLink,
  );
  const runnerRig =
    input.side === "corp"
      ? (input.playerView.opponent.rig ?? [])
      : (input.playerView.own.rig ?? []);
  const runnerCredits =
    input.side === "corp"
      ? input.playerView.opponent.credits
      : input.playerView.own.credits;
  let bestInstalledLink = 0;
  for (const card of runnerRig) {
    if (card.known === false) continue;
    const quotes = card.definitionId
      ? traceBaseLinkCardImplementationQuotesForDefinition(
          card.definitionId as CardDefinitionId,
        )
      : [];
    if (quotes.length > 0) {
      for (const quote of quotes) {
        if (quote.creditCost > runnerCredits) continue;
        bestInstalledLink = Math.max(
          bestInstalledLink,
          normalizedLink(quote.baseLinkValue),
        );
      }
      continue;
    }
    bestInstalledLink = Math.max(
      bestInstalledLink,
      normalizedLink(card.baseLink),
    );
  }
  return identityLink + bestInstalledLink;
}

function normalizedLink(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
