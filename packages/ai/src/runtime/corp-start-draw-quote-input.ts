import type { Side, VisibleChoiceRequest } from "@netgrid/shared";

export function sanitizeCorpStartDrawQuote(
  choice: VisibleChoiceRequest,
  stateVersion: number,
  side: Side,
): VisibleChoiceRequest["corpStartDrawQuote"] {
  const quote = choice.corpStartDrawQuote;
  if (
    !quote ||
    side !== "corp" ||
    choice.side !== "corp" ||
    choice.stateVersion !== stateVersion ||
    quote.observedAtStateVersion !== stateVersion ||
    typeof quote.sourceCardInstanceId !== "string" ||
    choice.source !==
      `scored_agenda.start_draw_choice:${quote.sourceCardInstanceId}:${stateVersion}` ||
    ![
      quote.additionalDrawCount,
      quote.committedDrawCount,
      quote.mandatoryDrawCount,
    ].every((n) => Number.isSafeInteger(n) && n > 0) ||
    quote.committedDrawCount < quote.mandatoryDrawCount
  )
    return undefined;
  return {
    sourceCardInstanceId: quote.sourceCardInstanceId,
    observedAtStateVersion: stateVersion,
    additionalDrawCount: quote.additionalDrawCount,
    committedDrawCount: quote.committedDrawCount,
    mandatoryDrawCount: quote.mandatoryDrawCount,
  };
}
