import { DEMO_CARDS_BY_ID, type VisibleCard } from "@netgrid/shared";
import {
  RUNTIME_CARDS,
  createAiHintsByCard,
  type AiCardHint,
} from "./ai-hints";
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

const COVERAGE_BY_ICE_SUBTYPE: Record<string, KnownHintBreakerCoverage> = {
  wall: "wall",
  barrier: "wall",
  code_gate: "code_gate",
  sentry: "sentry",
  ap: "ap",
  trace: "trace",
  watchdog: "watchdog",
  black_ice: "black_ice",
};

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

export type StructuredBreakerIceCostEstimate = {
  cost: number;
  coverage: KnownHintBreakerCoverage;
  sideEffectPenalty: number;
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

export function compareBreakerProfilesForCoverage(
  profileA: AiHintBreakerProfile | undefined,
  profileB: AiHintBreakerProfile | undefined,
  targetIceSubtype: string,
): number {
  const coverage = coverageForIceSubtype(targetIceSubtype);
  const aCovers = profileCoversCoverage(profileA, coverage);
  const bCovers = profileCoversCoverage(profileB, coverage);
  if (aCovers && !bCovers) return 1;
  if (!aCovers && bCovers) return -1;
  if (!aCovers && !bCovers) return 0;
  return (
    breakerProfileQualityScore(profileA) - breakerProfileQualityScore(profileB)
  );
}

export function structuredBreakerProfileCoversIce(
  breakerDefinitionId: string | undefined,
  iceDefinitionId: string | undefined,
): boolean {
  const profile = getStructuredBreakerProfileForCard(breakerDefinitionId);
  const coverage = structuredIceCoverageRequirements(iceDefinitionId);
  if (
    !profile ||
    coverage.length === 0 ||
    breakerProfileBlocksAccessReachability(profile)
  ) {
    return false;
  }
  return coverage.some((target) => profileCoversCoverage(profile, target));
}

export function estimateStructuredBreakerCostForIce(
  breakerDefinitionId: string | undefined,
  ice: Pick<VisibleCard, "definitionId" | "subtypes" | "strength">,
  subroutineCount = 1,
  currentBreakerStrength?: number,
  additionalBreakCostPerSubroutine = 0,
): StructuredBreakerIceCostEstimate | undefined {
  const profile = getStructuredBreakerProfileForCard(breakerDefinitionId);
  if (
    !profile ||
    !ice.definitionId ||
    breakerProfileBlocksAccessReachability(profile)
  ) {
    return undefined;
  }
  const coverage = structuredIceCoverageRequirements(ice.definitionId).find(
    (target) => profileCoversCoverage(profile, target),
  );
  if (!coverage) return undefined;
  const iceStrength = Math.max(
    0,
    Math.floor(ice.strength ?? cardStrength(ice.definitionId)),
  );
  const baseStrength = Math.max(
    0,
    Math.floor(currentBreakerStrength ?? profile.baseStrength ?? 0),
  );
  const missingStrength = Math.max(0, iceStrength - baseStrength);
  if (missingStrength > 0 && !finiteNumber(profile.pumpCost)) return undefined;
  const pumpCost =
    missingStrength * Math.max(0, Math.floor(profile.pumpCost ?? 0));
  const breakCost = Math.max(0, Math.floor(profile.breakCost ?? 0));
  const subroutines = Math.max(1, Math.floor(subroutineCount));
  const additionalCost =
    subroutines * Math.max(0, Math.floor(additionalBreakCostPerSubroutine));
  const cost = pumpCost + subroutines * breakCost + additionalCost;
  const sideEffectPenalty = breakerSideEffectPenalty(profile);
  return {
    cost,
    coverage,
    sideEffectPenalty,
    evidence: [
      "structured_breaker_ice_cost:true",
      `structured_breaker_coverage:${coverage}`,
      `structured_breaker_ice_strength:${iceStrength}`,
      `structured_breaker_cost:${cost}`,
      `structured_breaker_side_effect_penalty:${sideEffectPenalty}`,
    ],
  };
}

export function structuredIceCoverageRequirements(
  iceDefinitionId: string | undefined,
): KnownHintBreakerCoverage[] {
  const definition = cardDefinition(iceDefinitionId);
  const coverage = sortedUnique(
    (definition?.subtypes ?? [])
      .map(coverageForIceSubtype)
      .filter(
        (value): value is KnownHintBreakerCoverage => value !== undefined,
      ),
  );
  return coverage.length > 0 ? coverage : ["unknown_special"];
}

function coverageForIceSubtype(
  subtype: string | undefined,
): KnownHintBreakerCoverage | undefined {
  if (!subtype) return undefined;
  return COVERAGE_BY_ICE_SUBTYPE[subtypeKey(subtype)];
}

function profileCoversCoverage(
  profile: AiHintBreakerProfile | undefined,
  coverage: KnownHintBreakerCoverage | undefined,
): boolean {
  if (!profile || !coverage) return false;
  if (breakerProfileBlocksAccessReachability(profile)) return false;
  const profileCoverage = new Set(profile.coverage ?? []);
  return (
    profileCoverage.has("universal") || profileCoverage.has(coverage)
  );
}

function breakerProfileQualityScore(
  profile: AiHintBreakerProfile | undefined,
): number {
  if (!profile) return -1000;
  const breakCost = finiteNumber(profile.breakCost) ? profile.breakCost : 3;
  const pumpCost = finiteNumber(profile.pumpCost) ? profile.pumpCost : 2;
  const coverageCount = profile.coverage?.length ?? 0;
  return (
    coverageCount * 20 +
    Math.max(0, profile.baseStrength ?? 0) * 3 -
    breakCost * 8 -
    pumpCost * 4 -
    breakerSideEffectPenalty(profile)
  );
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

function cardDefinition(definitionId: string | undefined) {
  if (!definitionId) return undefined;
  const direct = DEMO_CARDS_BY_ID[definitionId];
  if (direct) return direct;
  const runtime = RUNTIME_CARDS[definitionId];
  if (!runtime) return undefined;
  return runtime.engineCardId
    ? DEMO_CARDS_BY_ID[runtime.engineCardId]
    : runtime;
}

function cardStrength(definitionId: string | undefined): number {
  const definition = cardDefinition(definitionId);
  if (!definition) return 0;
  const strength =
    "strength" in definition
      ? definition.strength
      : "numeric" in definition
        ? definition.numeric?.strength
        : undefined;
  return Math.max(0, Math.floor(strength ?? 0));
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function subtypeKey(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function sortedUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}
