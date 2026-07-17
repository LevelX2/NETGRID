import type { PublicGameEvent } from "@netgrid/shared";

export const WEATHER_TO_FINANCE_PIPE_DEFINITION_ID =
  "onr_v1_118_weather-to-finance-pipe";

export type SuccessfulRunOutcomePresentation = {
  eventId: string;
  sourceDefinitionId: string;
  sourceTitle: string;
  headline: string;
  resultText: string;
  creditLoss: number;
  serverLabel: string;
};

export function successfulRunOutcomePresentationFromEvent(
  event: PublicGameEvent,
): SuccessfulRunOutcomePresentation | null {
  const payload = event.publicPayload;
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  if (
    sourceDefinitionId !== WEATHER_TO_FINANCE_PIPE_DEFINITION_ID ||
    payload.accessReplacement !== "corp_lose_credits" ||
    payload.runSuccessful !== true ||
    payload.accessSkipped !== true
  )
    return null;
  const serverId = stringValue(payload.serverId);
  if (serverId !== "hq") return null;
  const creditLoss = nonNegativeInteger(payload.creditLoss);
  if (creditLoss === null) return null;
  const sourceTitle =
    stringValue(payload.sourceTitle) ?? "Weather-to-Finance Pipe";
  return {
    eventId: event.eventId,
    sourceDefinitionId,
    sourceTitle,
    headline: "Erfolgreicher HQ-Run",
    resultText: `Korp verliert ${creditLoss} ${creditLoss === 1 ? "Credit" : "Credits"}. Kein Karten-Access auf HQ.`,
    creditLoss,
    serverLabel: "HQ",
  };
}

export function latestSuccessfulRunOutcomePresentation(
  events: readonly PublicGameEvent[],
  dismissedEventId: string | null,
): SuccessfulRunOutcomePresentation | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    const presentation = successfulRunOutcomePresentationFromEvent(event);
    if (presentation)
      return presentation.eventId === dismissedEventId ? null : presentation;
  }
  return null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}
