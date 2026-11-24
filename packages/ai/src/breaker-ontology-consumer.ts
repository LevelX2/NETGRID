import type { CardDefinitionId } from "@netgrid/shared";
import { AI_HINTS_BY_CARD as AI_HINTS, type AiCardHint } from "./ai-hints";
import type {
  AiHintBreakerProfile,
  AiHintCostProfile,
  KnownHintBreakerCoverage,
} from "./hint-ontology";

const ACCESS_BLOCKING_BREAKER_RESTRICTIONS = new Set([
  "not_access_enabling_breaker",
  "not_reachability_coverage",
  "constraint.not_access_enabling_breaker",
  "constraint.not_reachability_coverage",
]);

export type StructuredBreakerCostProfile = {
  installCredits?: number;
  memory?: number;
  reserveRiskPenalty: number;
  opportunityCostPenalty: number;
  sideEffectPenalty: number;
  pumpCost?: number;
  breakCost?: number;
  evidence: string[];
};

export function getStructuredBreakerProfileForCard(
  cardId: CardDefinitionId | undefined,
): AiHintBreakerProfile | undefined {
  if (!cardId) return undefined;
  return AI_HINTS.get(cardId)?.breakerProfile;
}

export function breakerCardBlocksAccessReachability(
  cardId: CardDefinitionId | undefined,
): boolean {
  return breakerProfileBlocksAccessReachability(
    getStructuredBreakerProfileForCard(cardId),
  );
}

export function breakerProfileBlocksAccessReachability(
  profile: AiHintBreakerProfile | undefined,
): boolean {
  if (!profile) return false;
  const sideEffects = new Set(profile.sideEffects ?? []);
  if (sideEffects.has("ends_run_after_use")) return true;
  return (profile.restrictions ?? []).some((restriction) =>
    ACCESS_BLOCKING_BREAKER_RESTRICTIONS.has(restriction),
  );
}

export function classifyBreakerCoverageFromOntology(
  cardIdOrHint: CardDefinitionId | AiCardHint | undefined,
): KnownHintBreakerCoverage[] {
  const hint =
    typeof cardIdOrHint === "number"
      ? AI_HINTS.get(cardIdOrHint)
      : cardIdOrHint;
  return sortedUnique(hint?.breakerProfile?.coverage ?? []);
}

export function estimateBreakerCostProfileFromOntology(
  cardIdOrHint: CardDefinitionId | AiCardHint | undefined,
): StructuredBreakerCostProfile | undefined {
  const hint =
    typeof cardIdOrHint === "number"
      ? AI_HINTS.get(cardIdOrHint)
      : cardIdOrHint;
  const profile = hint?.breakerProfile;
  if (!profile) return undefined;
  const costProfile = hint?.costProfile;
  const reserveRiskPenalty = riskPenalty(costProfile?.reserveRisk);
  const opportunityCostPenalty = riskPenalty(costProfile?.opportunityCost);
  const sideEffectPenalty = breakerSideEffectPenalty(profile);
  return {
    ...(finiteNumber(costProfile?.credits)
      ? { installCredits: costProfile?.credits }
      : {}),
    ...(finiteNumber(costProfile?.memory)
      ? { memory: costProfile?.memory }
      : {}),
    reserveRiskPenalty,
    opportunityCostPenalty,
    sideEffectPenalty,
    ...(finiteNumber(profile.pumpCost) ? { pumpCost: profile.pumpCost } : {}),
    ...(finiteNumber(profile.breakCost)
      ? { breakCost: profile.breakCost }
      : {}),
    evidence: [
      "structured_breaker_cost_profile:true",
      ...(finiteNumber(costProfile?.credits)
        ? [`structured_breaker_install_credits:${costProfile?.credits}`]
        : []),
      ...(finiteNumber(costProfile?.memory)
        ? [`structured_breaker_memory:${costProfile?.memory}`]
        : []),
      `structured_breaker_reserve_risk_penalty:${reserveRiskPenalty}`,
      `structured_breaker_opportunity_penalty:${opportunityCostPenalty}`,
      `structured_breaker_side_effect_penalty:${sideEffectPenalty}`,
    ],
  };
}

function breakerSideEffectPenalty(profile: AiHintBreakerProfile): number {
  return (profile.sideEffects ?? []).reduce((sum, effect) => {
    switch (effect) {
      case "forgo_actions":
        return sum + 12;
      case "credit_intensive_pump":
        return sum + 10;
      case "program_trash_risk":
        return sum + 9;
      case "random_failure":
      case "ends_run_after_use":
        return sum + 16;
      case "temporary_strength":
      case "stealth_loss":
      case "once_per_subroutine":
        return sum + 5;
      default:
        return sum;
    }
  }, 0);
}

function riskPenalty(risk: AiHintCostProfile["reserveRisk"]): number {
  switch (risk) {
    case "high":
      return 16;
    case "medium":
      return 8;
    case "low":
    case undefined:
      return 0;
  }
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sortedUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}
