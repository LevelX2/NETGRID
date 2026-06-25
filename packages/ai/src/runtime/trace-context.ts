import type { AiDecisionInput } from "@netgrid/shared";

export type LatestTraceContext = {
  traceStrength?: number;
  runnerLink?: number;
  corpBid?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidTraceLinkBonus?: number;
};

export function latestTraceContext(
  input: AiDecisionInput,
): LatestTraceContext {
  for (const event of input.eventTail.slice().reverse()) {
    const traceStrength = event.publicPayload.traceStrength;
    const runnerLink = event.publicPayload.runnerLink;
    const corpBid = event.publicPayload.corpBid;
    const runnerBid = event.publicPayload.runnerBid;
    const runnerStrength = event.publicPayload.runnerStrength;
    const postBidTraceLinkBonus = event.publicPayload.postBidTraceLinkBonus;
    if (
      typeof traceStrength === "number" ||
      typeof runnerLink === "number" ||
      typeof corpBid === "number" ||
      typeof runnerBid === "number" ||
      typeof runnerStrength === "number" ||
      typeof postBidTraceLinkBonus === "number"
    ) {
      return {
        ...(typeof traceStrength === "number" ? { traceStrength } : {}),
        ...(typeof runnerLink === "number" ? { runnerLink } : {}),
        ...(typeof corpBid === "number" ? { corpBid } : {}),
        ...(typeof runnerBid === "number" ? { runnerBid } : {}),
        ...(typeof runnerStrength === "number" ? { runnerStrength } : {}),
        ...(typeof postBidTraceLinkBonus === "number"
          ? { postBidTraceLinkBonus }
          : {}),
      };
    }
  }
  return {};
}
