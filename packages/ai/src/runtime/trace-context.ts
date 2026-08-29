import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import type {
  AiDecisionInput,
  CardDefinitionId,
  TraceRulesProfile,
} from "@netgrid/shared";

export type LatestTraceContext = {
  sourceDefinitionId?: string;
  traceLimit?: number;
  traceValue?: number;
  runnerLink?: number;
  /** Maximum visible pre-reveal strength the Runner can reach under the active profile. */
  runnerMaximumPreRevealStrength?: number;
  corpBid?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidTraceLinkBonus?: number;
  traceRulesProfile?: TraceRulesProfile;
  effectiveTraceLimit?: number;
};

type VisibleRunnerTraceEstimate = {
  runnerLink: number;
  maximumPreRevealStrength: number;
};

export function latestTraceContext(input: AiDecisionInput): LatestTraceContext {
  const visibleRunnerEstimate = visibleRunnerTraceEstimateAtCorpBid(input);
  const visibleRunnerLink = visibleRunnerEstimate.runnerLink;
  const visibleTrace = input.playerView.trace;
  const eventTrace = latestTraceContextFromEventTail(input, visibleRunnerLink);
  if (visibleTrace) {
    const matchingEventTrace =
      eventTrace.sourceDefinitionId === undefined ||
      eventTrace.sourceDefinitionId === visibleTrace.sourceDefinitionId
        ? eventTrace
        : {};
    const corpBid = visibleTrace.corpBid ?? matchingEventTrace.corpBid;
    const traceValue =
      visibleTrace.corpStrength ?? matchingEventTrace.traceValue ?? corpBid;
    return {
      sourceDefinitionId: visibleTrace.sourceDefinitionId,
      traceLimit: visibleTrace.printedTrace ?? matchingEventTrace.traceLimit,
      effectiveTraceLimit:
        visibleTrace.effectiveTraceLimit ??
        matchingEventTrace.effectiveTraceLimit,
      traceRulesProfile: visibleTrace.profile,
      runnerLink:
        visibleTrace.runnerLink ??
        matchingEventTrace.runnerLink ??
        visibleRunnerLink,
      runnerMaximumPreRevealStrength:
        visibleRunnerEstimate.maximumPreRevealStrength,
      ...(corpBid !== undefined ? { corpBid } : {}),
      ...(traceValue !== undefined ? { traceValue } : {}),
      ...(visibleTrace.runnerBid !== undefined
        ? { runnerBid: visibleTrace.runnerBid }
        : {}),
      ...(visibleTrace.runnerStrength !== undefined
        ? { runnerStrength: visibleTrace.runnerStrength }
        : {}),
      ...(visibleTrace.postRevealLinkBonus !== undefined
        ? { postBidTraceLinkBonus: visibleTrace.postRevealLinkBonus }
        : {}),
    };
  }
  return {
    ...eventTrace,
    runnerMaximumPreRevealStrength:
      visibleRunnerEstimate.maximumPreRevealStrength,
  };
}

function latestTraceContextFromEventTail(
  input: AiDecisionInput,
  visibleRunnerLink: number,
): LatestTraceContext {
  for (const event of input.eventTail.slice().reverse()) {
    const traceLimit = event.publicPayload.traceLimit;
    const traceValue = event.publicPayload.traceValue;
    const runnerLink = event.publicPayload.runnerLink;
    const corpBid = event.publicPayload.corpBid;
    const runnerBid = event.publicPayload.runnerBid;
    const runnerStrength = event.publicPayload.runnerStrength;
    const postBidTraceLinkBonus = event.publicPayload.postBidTraceLinkBonus;
    const sourceDefinitionId = event.publicPayload.sourceDefinitionId;
    if (
      typeof traceLimit === "number" ||
      typeof traceValue === "number" ||
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
        ...(typeof traceLimit === "number" ? { traceLimit } : {}),
        ...(typeof traceValue === "number" ? { traceValue } : {}),
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

function visibleRunnerTraceEstimateAtCorpBid(
  input: AiDecisionInput,
): VisibleRunnerTraceEstimate {
  const profile =
    input.playerView.trace?.profile ?? input.playerView.traceRulesProfile;
  const identityLink = normalizedLink(
    input.side === "corp"
      ? input.playerView.opponent.identity.baseLink
      : input.playerView.own.identity.baseLink,
  );
  const runLinkBonus = normalizedLink(input.playerView.run?.runTraceLinkBonus);
  const runnerRig =
    input.side === "corp"
      ? (input.playerView.opponent.rig ?? [])
      : (input.playerView.own.rig ?? []);
  const runnerCredits = Math.max(
    0,
    Math.floor(
      input.side === "corp"
        ? input.playerView.opponent.credits
        : input.playerView.own.credits,
    ),
  );
  const paymentCapacity = Math.max(
    0,
    Math.floor(
      input.playerView.trace?.visibleOpponentBidCapacity ??
        (input.side === "runner"
          ? runnerCredits +
            (input.playerView.own.runnerTraceSupportQuote?.traceCreditPool ?? 0)
          : runnerCredits),
    ),
  );

  let bestStaticInstalledLink = 0;
  let bestBaseLink = 0;
  let maximumClassicStrength = identityLink + runLinkBonus;
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
        const baseLink = normalizedLink(quote.baseLinkValue);
        bestBaseLink = Math.max(bestBaseLink, baseLink);
        const modifier = quote.classicLinkModifier;
        const remainingPaymentCapacity = Math.max(
          0,
          paymentCapacity - quote.creditCost,
        );
        const modifierLink =
          modifier && modifier.creditCost > 0
            ? Math.floor(remainingPaymentCapacity / modifier.creditCost) *
              Math.max(0, modifier.linkDelta)
            : 0;
        maximumClassicStrength = Math.max(
          maximumClassicStrength,
          identityLink + runLinkBonus + baseLink + modifierLink,
        );
      }
      continue;
    }
    bestStaticInstalledLink = Math.max(
      bestStaticInstalledLink,
      normalizedLink(card.baseLink),
    );
  }

  const staticLink = identityLink + runLinkBonus + bestStaticInstalledLink;
  const selectedBaseLink = identityLink + runLinkBonus + bestBaseLink;
  const runnerLink = Math.max(staticLink, selectedBaseLink);
  maximumClassicStrength = Math.max(maximumClassicStrength, staticLink);
  const maximumPreRevealStrength =
    profile === "classic_blind" || profile === "classic_blind_corp_ties"
      ? maximumClassicStrength
      : runnerLink + paymentCapacity;
  return { runnerLink, maximumPreRevealStrength };
}

function normalizedLink(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
