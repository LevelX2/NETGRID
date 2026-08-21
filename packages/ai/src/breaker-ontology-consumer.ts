import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import type {
  AiHintBreakerProfile,
  AiHintCostProfile,
  KnownHintBreakerCoverage,
} from "./hint-ontology";

const AI_HINTS = createAiHintsByCard();
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
  cardId: string | undefined,
): AiHintBreakerProfile | undefined {
  if (!cardId) return undefined;
  return AI_HINTS.get(cardId)?.breakerProfile;
}

export function breakerCardBlocksAccessReachability(
  cardId: string | undefined,
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
  cardIdOrHint: string | AiCardHint | undefined,
): KnownHintBreakerCoverage[] {
  const hint =
    typeof cardIdOrHint === "string"
      ? AI_HINTS.get(cardIdOrHint)
      : cardIdOrHint;
  return sortedUnique(hint?.breakerProfile?.coverage ?? []);
}

export function estimateBreakerCostProfileFromOntology(
  cardIdOrHint: string | AiCardHint | undefined,
): StructuredBreakerCostProfile | undefined {
  const hint =
    typeof cardIdOrHint === "string"
      ? AI_HINTS.get(cardIdOrHint)
      : cardIdOrHint;
  const profile = hint?.breakerProfile;
  if (!profile) return undefined;
  const costProfile = hint?.costProfile;
  return {
    ...(finiteNumber(costProfile?.credits)
      ? { installCredits: costProfile?.credits }
      : {}),
    ...(finiteNumber(costProfile?.memory)
      ? { memory: costProfile?.memory }
      : {}),
    reserveRiskPenalty: riskPenalty(costProfile?.reserveRisk),
    opportunityCostPenalty: riskPenalty(costProfile?.opportunityCost),
    sideEffectPenalty: breakerSideEffectPenalty(profile),
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
      `structured_breaker_reserve_risk_penalty:${riskPenalty(costProfile?.reserveRisk)}`,
      `structured_breaker_opportunity_penalty:${riskPenalty(costProfile?.opportunityCost)}`,
      `structured_breaker_side_effect_penalty:${breakerSideEffectPenalty(profile)}`,
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
