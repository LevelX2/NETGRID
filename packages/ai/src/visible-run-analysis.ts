import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type PublicGameEvent,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";

type IceCardLike = {
  definitionId?: string;
  rezzed?: boolean;
  known: boolean;
  subtypes?: string[];
  strength?: number;
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
};
type RootCardLike = { definitionId?: string; rezzed?: boolean; known: boolean };
type BreakAssessment = {
  cost: number;
  breakerInstanceId: string;
  endingStrength: number;
  carriesStrengthAcrossIce: boolean;
};
export type KnownRezzedIcePathAssessment = {
  blocked: boolean;
  visibleBreakCost?: number;
  canReachAccess: boolean;
  knownPathBlockedByUnbreakableIce: boolean;
  knownPathBlockedByMissingCoverage: boolean;
  knownPathBlockedByEtr: boolean;
  creditsAfterPath: number;
  canBreakNextIceButNotFullPath: boolean;
  unpayableIceIndex?: number;
  unbreakableIceIndex?: number;
  unbreakableIceTitle?: string;
  missingCoverage?: Array<
    "wall" | "code_gate" | "sentry" | "ap" | "trace" | "unknown_special"
  >;
  hasBypassOrSpecialAccessPlan: boolean;
  reachableAccessReason?: string;
  noAccessReason?:
    | "known_path_unpayable"
    | "known_path_unbreakable"
    | "missing_breaker_coverage"
    | "known_etr_without_breaker";
  creditsSpentBeforeUnpayableIce: number;
  unpayableReason?:
    | "ice_unbreakable"
    | "ice_unaffordable"
    | "later_ice_unaffordable_after_prior_ice_cost";
  assessedKnownIceCount: number;
};

const RUN_REMAINDER_STRENGTH_BREAKER_IDS = new Set([
  "onr_v1_030_grubb",
  "onr_v1_039_krash",
]);

export function serverIdFromEvent(event: PublicGameEvent): string | undefined {
  const candidate =
    event.publicPayload.serverId ??
    event.publicPayload.attackedServerId ??
    event.publicPayload.server ??
    event.publicPayload.targetServerId;
  if (typeof candidate === "string") return candidate;
  const label =
    typeof event.publicPayload.serverLabel === "string"
      ? event.publicPayload.serverLabel
      : undefined;
  if (!label) return undefined;
  if (label === "HQ") return "hq";
  if (label === "R&D" || label === "F&E (R&D)" || label === "F&E") return "rd";
  if (label === "Archives" || label === "Archive") return "archives";
  const remoteMatch = /^Remote\s+(\d+)$/i.exec(label);
  if (!remoteMatch) return undefined;
  return `remote_${remoteMatch[1]}`;
}

export function assessKnownRezzedIcePath(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: number,
  rootCards: RootCardLike[] = [],
): KnownRezzedIcePathAssessment {
  let visibleBreakCost = 0;
  let remainingCredits = runnerCredits;
  let assessedKnownIceCount = 0;
  let firstKnownIceBreakable = false;
  const breakerStrengths = new Map(
    rigCards.map((card) => [card.instanceId, card.strength ?? 0]),
  );
  void rootCards;
  for (const { ice, iceIndex } of iceCards
    .map((ice, iceIndex) => ({ ice, iceIndex }))
    .reverse()) {
    if (!ice.definitionId || !ice.known || ice.rezzed !== true) continue;
    const pathCostBeforeIce = visibleBreakCost;
    assessedKnownIceCount += 1;
    const quote = effectiveRunQuoteForIce(ice);
    const endTheRunCount = quote
      ? quote.subroutines.filter(
          (subroutine) => subroutine.type === "end_the_run",
        ).length
      : endTheRunSubroutineCount(ice.definitionId);
    const additionalBreakCostPerSubroutine =
      quote?.breakSubroutineAdditionalCostPerSubroutine ?? 0;
    if (endTheRunCount > 0) {
      const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
        effectiveIceForQuote(ice, quote),
        rigCards,
        endTheRunCount,
        breakerStrengths,
        additionalBreakCostPerSubroutine,
      );
      if (!breakAssessment) {
        return blockedPathAssessment(
          visibleBreakCost,
          remainingCredits,
          iceIndex,
          ice.definitionId,
          ice.subtypes,
          visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          "ice_unbreakable",
        );
      }
      if (breakAssessment.cost > remainingCredits) {
        return blockedPathAssessment(
          visibleBreakCost + breakAssessment.cost,
          remainingCredits - breakAssessment.cost,
          iceIndex,
          ice.definitionId,
          ice.subtypes,
          visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          visibleBreakCost > 0
            ? "later_ice_unaffordable_after_prior_ice_cost"
            : "ice_unaffordable",
        );
      }
      visibleBreakCost += breakAssessment.cost;
      remainingCredits -= breakAssessment.cost;
      firstKnownIceBreakable = true;
      if (breakAssessment.carriesStrengthAcrossIce) {
        breakerStrengths.set(
          breakAssessment.breakerInstanceId,
          breakAssessment.endingStrength,
        );
      }
    }
    const payOrEndSubroutines =
      quote?.subroutines.filter(
        (subroutine) => subroutine.type === "end_the_run_unless_runner_pays",
      ) ?? [];
    for (const subroutine of payOrEndSubroutines) {
      const payCost = Math.max(0, Math.floor(subroutine.amount ?? 0));
      const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
        effectiveIceForQuote(ice, quote),
        rigCards,
        1,
        breakerStrengths,
        additionalBreakCostPerSubroutine,
      );
      const handlingCost = Math.min(payCost, breakAssessment?.cost ?? payCost);
      if (handlingCost > remainingCredits) {
        return blockedPathAssessment(
          visibleBreakCost + handlingCost,
          remainingCredits - handlingCost,
          iceIndex,
          ice.definitionId,
          ice.subtypes,
          pathCostBeforeIce,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          pathCostBeforeIce > 0
            ? "later_ice_unaffordable_after_prior_ice_cost"
            : "ice_unaffordable",
        );
      }
      visibleBreakCost += handlingCost;
      remainingCredits -= handlingCost;
      firstKnownIceBreakable = true;
      if (
        breakAssessment &&
        handlingCost === breakAssessment.cost &&
        breakAssessment.carriesStrengthAcrossIce
      ) {
        breakerStrengths.set(
          breakAssessment.breakerInstanceId,
          breakAssessment.endingStrength,
        );
      }
    }
  }
  return {
    blocked: false,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    canReachAccess: true,
    knownPathBlockedByUnbreakableIce: false,
    knownPathBlockedByMissingCoverage: false,
    knownPathBlockedByEtr: false,
    creditsAfterPath: remainingCredits,
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    reachableAccessReason: "known_path_reachable",
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount,
  };
}

function blockedPathAssessment(
  visibleBreakCost: number,
  creditsAfterPath: number,
  unpayableIceIndex: number,
  unpayableIceDefinitionId: string | undefined,
  unpayableIceSubtypes: string[] | undefined,
  creditsSpentBeforeUnpayableIce: number,
  firstKnownIceBreakable: boolean,
  assessedKnownIceCount: number,
  unpayableReason: NonNullable<KnownRezzedIcePathAssessment["unpayableReason"]>,
): KnownRezzedIcePathAssessment {
  const missingCoverage =
    unpayableReason === "ice_unbreakable"
      ? missingCoverageForIceSubtypes(unpayableIceSubtypes ?? [])
      : undefined;
  const unbreakable = unpayableReason === "ice_unbreakable";
  return {
    blocked: true,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    canReachAccess: false,
    knownPathBlockedByUnbreakableIce: unbreakable,
    knownPathBlockedByMissingCoverage: unbreakable,
    knownPathBlockedByEtr: true,
    creditsAfterPath,
    canBreakNextIceButNotFullPath:
      firstKnownIceBreakable &&
      creditsSpentBeforeUnpayableIce > 0 &&
      unpayableReason === "later_ice_unaffordable_after_prior_ice_cost",
    unpayableIceIndex,
    ...(unbreakable ? { unbreakableIceIndex: unpayableIceIndex } : {}),
    ...(unbreakable && unpayableIceDefinitionId
      ? {
          unbreakableIceTitle:
            visibleRunCardDefinition(unpayableIceDefinitionId)?.title ??
            unpayableIceDefinitionId,
        }
      : {}),
    ...(missingCoverage && missingCoverage.length > 0
      ? { missingCoverage }
      : {}),
    hasBypassOrSpecialAccessPlan: false,
    noAccessReason: unbreakable
      ? missingCoverage && missingCoverage.length > 0
        ? "missing_breaker_coverage"
        : "known_etr_without_breaker"
      : "known_path_unpayable",
    creditsSpentBeforeUnpayableIce,
    assessedKnownIceCount,
    unpayableReason,
  };
}

function missingCoverageForIceSubtypes(
  subtypes: string[],
): NonNullable<KnownRezzedIcePathAssessment["missingCoverage"]> {
  const normalized = new Set(subtypes.map(subtypeKey));
  const coverage: NonNullable<KnownRezzedIcePathAssessment["missingCoverage"]> =
    [];
  if (normalized.has("wall")) coverage.push("wall");
  if (normalized.has("code_gate")) coverage.push("code_gate");
  if (normalized.has("sentry")) coverage.push("sentry");
  if (
    normalized.has("ap") ||
    normalized.has("black_ice") ||
    normalized.has("killer")
  )
    coverage.push("ap");
  if (normalized.has("trace")) coverage.push("trace");
  if (coverage.length === 0) coverage.push("unknown_special");
  return [...new Set(coverage)].sort();
}

function effectiveRunQuoteForIce(
  ice: IceCardLike,
): VisibleEffectiveIceRunQuote | undefined {
  const quote = ice.effectiveRunQuote;
  if (!quote || quote.iceDefinitionId !== ice.definitionId) return undefined;
  return quote;
}

function effectiveIceForQuote(
  ice: IceCardLike,
  quote: VisibleEffectiveIceRunQuote | undefined,
): IceCardLike {
  return quote ? { ...ice, strength: quote.effectiveStrength } : ice;
}

export function minimumCreditsToBreakEndTheRunSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  endTheRunCount: number,
  breakerStrengths: Map<string, number>,
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) =>
      creditsToBreakEndTheRunSubroutinesWithBreaker(
        card,
        ice,
        endTheRunCount,
        breakerStrengths.get(card.instanceId),
        additionalBreakCostPerSubroutine,
      ),
    )
    .filter((cost): cost is BreakAssessment => cost !== undefined)
    .sort(
      (left, right) =>
        left.cost - right.cost ||
        left.breakerInstanceId.localeCompare(right.breakerInstanceId),
    );
  return costs[0];
}

export function creditsToBreakEndTheRunSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  endTheRunCount: number,
  currentBreakerStrength = breakerCard.strength ??
    cardDefinitionStrength(breakerCard.definitionId),
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  if (!breakerCard.known || !breakerCard.definitionId || !ice.definitionId)
    return undefined;
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (
    !breakerDefinition ||
    !iceDefinition ||
    !breakerDefinition.subtypes.includes("icebreaker")
  )
    return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const breakAbility = breakerDefinition.abilities?.find(
    (ability) =>
      ability.type === "break_subroutine" &&
      (!ability.iceSubtype || hasSubtype(iceSubtypes, ability.iceSubtype)),
  );
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility = breakerDefinition.abilities?.find(
    (ability) => ability.type === "pump_strength",
  );
  let pumpCost = 0;
  let endingStrength = currentBreakerStrength;
  if (endingStrength < iceStrength) {
    if (!pumpAbility || (pumpAbility.amount ?? 0) <= 0) return undefined;
    const requiredPumps = Math.ceil(
      (iceStrength - endingStrength) / Math.max(1, pumpAbility.amount ?? 1),
    );
    pumpCost = requiredPumps * (pumpAbility.cost.credits ?? 0);
    endingStrength += requiredPumps * Math.max(1, pumpAbility.amount ?? 1);
  }
  const breakCount = Math.max(1, breakAbility.count ?? 1);
  const breakUses = Math.ceil(endTheRunCount / breakCount);
  return {
    cost:
      pumpCost +
      breakUses * (breakAbility.cost.credits ?? 0) +
      endTheRunCount * Math.max(0, additionalBreakCostPerSubroutine),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(breakerDefinition),
  };
}

export function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return (
    visibleRunCardDefinition(iceDefinitionId)?.subroutines?.filter(
      (subroutine) => subroutine.type === "end_the_run",
    ).length ?? 0
  );
}

export function canBreakerDefinitionBreakIce(
  breakerDefinitionId: string,
  iceDefinitionId: string,
): boolean {
  const breakerDefinition = visibleRunCardDefinition(breakerDefinitionId);
  const iceDefinition = visibleRunCardDefinition(iceDefinitionId);
  if (!breakerDefinition || !iceDefinition) return false;
  return Boolean(
    breakerDefinition.abilities?.some(
      (ability) =>
        ability.type === "break_subroutine" &&
        (!ability.iceSubtype ||
          hasSubtype(iceDefinition.subtypes, ability.iceSubtype)),
    ),
  );
}

export function iceHasEndTheRun(iceDefinitionId: string): boolean {
  return endTheRunSubroutineCount(iceDefinitionId) > 0;
}

export function cardDefinitionStrength(
  definitionId: string | undefined,
): number {
  if (!definitionId) return 0;
  return (
    visibleRunCardDefinition(definitionId)?.strength ??
    RUNTIME_CARDS[definitionId]?.numeric.strength ??
    0
  );
}

function visibleRunCardDefinition(
  definitionId: string | undefined,
): CardDefinition | undefined {
  if (!definitionId) return undefined;
  const directDefinition = DEMO_CARDS_BY_ID[definitionId];
  if (directDefinition) return directDefinition;
  const runtimeEngineId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return runtimeEngineId ? DEMO_CARDS_BY_ID[runtimeEngineId] : undefined;
}

export function breakerCarriesStrengthAcrossIce(
  definition: CardDefinition,
): boolean {
  return (
    RUN_REMAINDER_STRENGTH_BREAKER_IDS.has(definition.id) ||
    (definition.mechanics ?? []).includes("run_remainder_strength_bonus")
  );
}

function hasSubtype(subtypes: string[], expectedSubtype: string): boolean {
  const expected = subtypeKey(expectedSubtype);
  return subtypes.some((subtype) => subtypeKey(subtype) === expected);
}

function subtypeKey(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
