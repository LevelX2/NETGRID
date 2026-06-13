import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDeckDoctrineProfile,
  type AiDecisionDebug,
  type AiDecisionInput,
} from "@netgrid/shared";
import { beliefDebugSummary, reconstructBeliefState } from "../belief-state";

export function buildLegacyBaselineDecisionDebug(
  input: AiDecisionInput,
): AiDecisionDebug {
  const beliefSummary = beliefDebugSummary(reconstructBeliefState(input));
  const opponentModel =
    input.side === "runner"
      ? toRecord(beliefSummary.runnerOpponentModel)
      : toRecord(beliefSummary.corpOpponentModel);
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 1,
    memoryVersion: String(beliefSummary.memoryVersion ?? ""),
    facts: toStringArray(beliefSummary.facts),
    hypotheses: toStringArray(beliefSummary.hypotheses),
    uncertainty: toStringArray(beliefSummary.uncertainty),
    invalidations: toStringArray(beliefSummary.invalidations),
    ...(input.ownDeckDoctrine
      ? { ownDeckDoctrine: deckDoctrineDebug(input.ownDeckDoctrine) }
      : {}),
    ...(opponentModel ? { opponentModel } : {}),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function deckDoctrineDebug(
  profile: AiDeckDoctrineProfile,
): NonNullable<AiDecisionDebug["ownDeckDoctrine"]> {
  return {
    schemaVersion: profile.schemaVersion,
    side: profile.side,
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(0, 4),
    riskFlags: profile.riskFlags.slice(0, 6),
  };
}
