import type { PublicGameEvent } from "@netgrid/shared";

/**
 * Collapses a purely presentational sequence of AI breaker pumps. The original
 * events stay unchanged in the server event log, replay and undo history.
 */
export function coalesceAiPumpPresentationEvents(
  events: readonly PublicGameEvent[],
): PublicGameEvent[] {
  const coalesced: PublicGameEvent[] = [];

  for (let index = 0; index < events.length; index += 1) {
    const first = events[index];
    if (!first) continue;
    const firstPump = aiPumpPresentationFacts(first);
    if (!firstPump) {
      coalesced.push(first);
      continue;
    }

    let last = first;
    let lastPump = firstPump;
    let count = 1;
    let totalStrength = firstPump.amount;
    let totalCredits = firstPump.creditCost;
    let nextIndex = index + 1;

    while (nextIndex < events.length) {
      const next = events[nextIndex];
      if (!next) break;
      const nextPump = aiPumpPresentationFacts(next);
      if (
        !nextPump ||
        nextPump.actor !== firstPump.actor ||
        nextPump.breakerId !== firstPump.breakerId ||
        nextPump.strengthAfter - nextPump.amount !== lastPump.strengthAfter
      )
        break;
      last = next;
      lastPump = nextPump;
      count += 1;
      totalStrength += nextPump.amount;
      totalCredits += nextPump.creditCost;
      nextIndex += 1;
    }

    if (count === 1) {
      coalesced.push(first);
      continue;
    }

    coalesced.push({
      ...first,
      stateVersionAfter: last.stateVersionAfter,
      stateHashAfter: last.stateHashAfter,
      publicPayload: {
        ...first.publicPayload,
        aiPumpPresentation: true,
        pumpCount: count,
        pumpStrengthStart: firstPump.strengthAfter - firstPump.amount,
        pumpStrengthTotal: totalStrength,
        breakerStrengthAfter: lastPump.strengthAfter,
        pumpCreditCostTotal: totalCredits,
      },
    });
    index = nextIndex - 1;
  }

  return coalesced;
}

type AiPumpPresentationFacts = {
  actor: "corp" | "runner";
  breakerId: string;
  amount: number;
  strengthAfter: number;
  creditCost: number;
};

function aiPumpPresentationFacts(
  event: PublicGameEvent,
): AiPumpPresentationFacts | null {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  if (
    actionType !== "pump_breaker" ||
    !hasAiPresentation(payload) ||
    hasVisibleSideEffect(payload)
  )
    return null;
  const actor = sideValue(payload.actor);
  const breakerId = stringValue(payload.pumpBreakerId);
  const amount = positiveFiniteNumber(payload.pumpStrengthAmount);
  const strengthAfter = finiteNumber(payload.breakerStrengthAfter);
  const creditCost =
    nonNegativeFiniteNumber(payload.pumpBreakerCreditCost) ?? 0;
  if (
    !actor ||
    !breakerId ||
    amount === undefined ||
    strengthAfter === undefined
  )
    return null;
  return { actor, breakerId, amount, strengthAfter, creditCost };
}

function hasAiPresentation(payload: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(payload.aiExplanation) || stringValue(payload.aiReasonCode),
  );
}

function hasVisibleSideEffect(payload: Record<string, unknown>): boolean {
  return (
    Array.isArray(payload.resolvedEffects) && payload.resolvedEffects.length > 0
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function sideValue(value: unknown): "corp" | "runner" | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function positiveFiniteNumber(value: unknown): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function nonNegativeFiniteNumber(value: unknown): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && number >= 0 ? number : undefined;
}
