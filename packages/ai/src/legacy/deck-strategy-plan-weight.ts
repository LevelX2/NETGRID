import type { AiDecisionInput, Side } from "@netgrid/shared";

type DeckStrategyScoreLike = {
  finalScore?: number;
  confidence?: string;
  runtimeStatus?: string;
};

type DeckStrategyProfileLike = {
  side?: Side;
  primaryStrategies?: readonly string[];
  secondaryStrategies?: readonly string[];
  strategyScores?: Record<string, DeckStrategyScoreLike | undefined>;
};

type DeckStrategyInput = AiDecisionInput & {
  ownDeckStrategyProfile?: DeckStrategyProfileLike;
};

export function deckStrategyPlanWeightFor(
  input: AiDecisionInput,
  side: Side,
  strategyIds: readonly string[],
): number {
  const profile = (input as DeckStrategyInput).ownDeckStrategyProfile;
  if (!profile || profile.side !== side) return 0;
  const primarySet = new Set(profile.primaryStrategies ?? []);
  const secondarySet = new Set(profile.secondaryStrategies ?? []);
  let best = 0;
  for (const strategyId of strategyIds) {
    const score = profile.strategyScores?.[strategyId];
    const finalScore =
      score &&
      typeof score.finalScore === "number" &&
      Number.isFinite(score.finalScore)
        ? score.finalScore
        : 0;
    if (finalScore <= 0) continue;
    const roleFactor = primarySet.has(strategyId)
      ? 1
      : secondarySet.has(strategyId)
        ? 0.75
        : 0.5;
    const runtimeFactor = score?.runtimeStatus === "productive" ? 1 : 0.4;
    const confidenceFactor =
      score?.confidence === "high"
        ? 1
        : score?.confidence === "medium"
          ? 0.75
          : 0.5;
    best = Math.max(
      best,
      Math.round(
        (finalScore / 8) * roleFactor * runtimeFactor * confidenceFactor,
      ),
    );
  }
  return Math.max(0, Math.min(14, best));
}

export function deckStrategyHasAny(
  input: AiDecisionInput,
  side: Side,
  strategyIds: readonly string[],
): boolean {
  const profile = (input as DeckStrategyInput).ownDeckStrategyProfile;
  if (!profile || profile.side !== side) return false;
  const active = new Set([
    ...(profile.primaryStrategies ?? []),
    ...(profile.secondaryStrategies ?? []),
  ]);
  return strategyIds.some((strategyId) => active.has(strategyId));
}
