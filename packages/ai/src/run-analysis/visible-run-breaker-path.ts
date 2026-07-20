import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import { RUNTIME_CARDS } from "../ai-hints";
import {
  breakerCardBlocksAccessReachability,
  estimateStructuredBreakerCostForIce,
  getStructuredBreakerProfileForCard,
  structuredBreakerProfileCoversIce,
} from "../breaker-ontology-consumer";
import type {
  BreakAssessment,
  BreakSubroutineAbilityLike,
  HardUnbrokenRunEffectKind,
  IceCardLike,
  KnownRezzedIcePathAssessment,
  MutableRunnerRunPathCreditBudget,
  PumpStrengthAbilityLike,
  RootCardLike,
  RunPathProjection,
  RunPathProjectionEffect,
  VisibleDeflectorContext,
} from "./visible-run-analysis-contracts";

const RUN_REMAINDER_STRENGTH_BREAKER_IDS = new Set(["onr_v1_030_grubb"]);

export function projectIceForRunPathEffects(
  ice: IceCardLike,
  effects: RunPathProjectionEffect[],
  iceIndex: number,
): IceCardLike {
  if (
    effects.length === 0 ||
    !ice.definitionId ||
    !ice.known ||
    ice.rezzed !== true
  )
    return ice;
  const quote = effectiveRunQuoteForIce(ice);
  const baseQuote: VisibleEffectiveIceRunQuote = quote ?? {
    iceInstanceId: `visible_path.${ice.definitionId}.${iceIndex}`,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      CARD_DEFINITIONS_BY_ID[ice.definitionId]?.subroutines?.map(
        (subroutine) => ({
          id: subroutine.id,
          type: subroutine.type,
          ...(subroutine.amount !== undefined
            ? { amount: subroutine.amount }
            : {}),
          ...(subroutine.baseTraceStrength !== undefined
            ? { baseTraceStrength: subroutine.baseTraceStrength }
            : {}),
          ...(subroutine.traceSuccessEffect
            ? { traceSuccessEffect: subroutine.traceSuccessEffect }
            : {}),
          ...(subroutine.runFutureStrengthCancelPaymentAmount !== undefined
            ? {
                runFutureStrengthCancelPaymentAmount:
                  subroutine.runFutureStrengthCancelPaymentAmount,
              }
            : {}),
          ...(subroutine.breakTags
            ? { breakTags: subroutine.breakTags.slice() }
            : {}),
        }),
      ) ?? [],
  };
  let effectiveStrength = baseQuote.effectiveStrength;
  let breakSubroutineAdditionalCostPerSubroutine =
    baseQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
  const subroutines = baseQuote.subroutines.map((subroutine) => ({
    ...subroutine,
  }));
  for (const effect of effects) {
    const addedEndTheRun = Math.max(
      0,
      Math.floor(effect.addsFutureEndTheRunSubroutines ?? 0),
    );
    for (let index = 0; index < addedEndTheRun; index += 1) {
      subroutines.push({
        id: `visible_projection.future_end_the_run.${iceIndex}.${index + 1}`,
        type: "end_the_run",
      });
    }
    effectiveStrength += Math.max(
      0,
      Math.floor(effect.increasesFutureIceStrength ?? 0),
    );
    breakSubroutineAdditionalCostPerSubroutine += Math.max(
      0,
      Math.floor(effect.increasesFutureBreakCostPerSubroutine ?? 0),
    );
  }
  return {
    ...ice,
    strength: effectiveStrength,
    effectiveRunQuote: {
      ...baseQuote,
      effectiveStrength,
      subroutines,
      ...(breakSubroutineAdditionalCostPerSubroutine > 0
        ? { breakSubroutineAdditionalCostPerSubroutine }
        : {}),
    },
  };
}

export function runPathEffectsPreventFutureBreaking(
  effects: RunPathProjectionEffect[],
): boolean {
  return effects.some((effect) => effect.preventsFutureBreaking === true);
}

export function blockedPathAssessment(
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

export function hardUnbrokenEffectBlockedPathAssessment(params: {
  visibleBreakCost: number;
  creditsAfterPath: number;
  iceIndex: number;
  iceDefinitionId: string | undefined;
  iceSubtypes: string[] | undefined;
  creditsSpentBeforeUnpayableIce: number;
  firstKnownIceBreakable: boolean;
  assessedKnownIceCount: number;
  effectKinds: HardUnbrokenRunEffectKind[];
  unavoidableTraceRunLock?: boolean;
  unpayableReason: NonNullable<KnownRezzedIcePathAssessment["unpayableReason"]>;
}): KnownRezzedIcePathAssessment {
  const unbreakable = params.unpayableReason === "ice_unbreakable";
  const missingCoverage = unbreakable
    ? missingCoverageForIceSubtypes(params.iceSubtypes ?? [])
    : undefined;
  const title = params.iceDefinitionId
    ? (visibleRunCardDefinition(params.iceDefinitionId)?.title ??
      params.iceDefinitionId)
    : undefined;
  return {
    blocked: true,
    ...(params.visibleBreakCost > 0
      ? { visibleBreakCost: params.visibleBreakCost }
      : {}),
    canReachAccess: false,
    knownPathBlockedByUnbreakableIce: unbreakable,
    knownPathBlockedByMissingCoverage:
      unbreakable && Boolean(missingCoverage?.length),
    knownPathBlockedByEtr: false,
    knownPathBlockedByHardUnbrokenEffect: true,
    ...(params.unavoidableTraceRunLock
      ? { knownPathBlockedByUnavoidableTraceRunLock: true }
      : {}),
    hardUnbrokenRunEffects: [...new Set(params.effectKinds)].sort(),
    creditsAfterPath: params.creditsAfterPath,
    canBreakNextIceButNotFullPath:
      params.firstKnownIceBreakable &&
      params.creditsSpentBeforeUnpayableIce > 0 &&
      params.unpayableReason === "later_ice_unaffordable_after_prior_ice_cost",
    unpayableIceIndex: params.iceIndex,
    ...(unbreakable ? { unbreakableIceIndex: params.iceIndex } : {}),
    ...(unbreakable && title ? { unbreakableIceTitle: title } : {}),
    hardUnbrokenEffectIceIndex: params.iceIndex,
    ...(title ? { hardUnbrokenEffectIceTitle: title } : {}),
    ...(missingCoverage && missingCoverage.length > 0
      ? { missingCoverage }
      : {}),
    hasBypassOrSpecialAccessPlan: false,
    noAccessReason: "harmful_unbroken_run_effect",
    creditsSpentBeforeUnpayableIce: params.creditsSpentBeforeUnpayableIce,
    unpayableReason: params.unpayableReason,
    assessedKnownIceCount: params.assessedKnownIceCount,
  };
}

export function missingCoverageForIceSubtypes(
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

export function effectiveRunQuoteForIce(
  ice: IceCardLike,
): VisibleEffectiveIceRunQuote | undefined {
  const quote = ice.effectiveRunQuote;
  if (!quote || quote.iceDefinitionId !== ice.definitionId) return undefined;
  return quote;
}

export function runQuoteForIce(
  ice: IceCardLike,
  iceIndex: number,
): VisibleEffectiveIceRunQuote | undefined {
  const quote = effectiveRunQuoteForIce(ice);
  if (quote) return quoteWithFallbackUnbrokenRunEffects(quote);
  if (!ice.definitionId) return undefined;
  const definition = visibleRunCardDefinition(ice.definitionId);
  if (!definition || definition.type !== "ice") return undefined;
  return {
    iceInstanceId: `visible_path.${ice.definitionId}.${iceIndex}`,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      definition.subroutines?.map((subroutine) =>
        visibleSubroutineWithFallbackUnbrokenRunEffect({
          id: subroutine.id,
          type: subroutine.type,
          ...(subroutine.amount !== undefined
            ? { amount: subroutine.amount }
            : {}),
          ...(subroutine.baseTraceStrength !== undefined
            ? { baseTraceStrength: subroutine.baseTraceStrength }
            : {}),
          ...(subroutine.traceSuccessEffect
            ? { traceSuccessEffect: subroutine.traceSuccessEffect }
            : {}),
          ...(subroutine.breakTags
            ? { breakTags: subroutine.breakTags.slice() }
            : {}),
        }),
      ) ?? [],
  };
}

export function quoteWithFallbackUnbrokenRunEffects(
  quote: VisibleEffectiveIceRunQuote,
): VisibleEffectiveIceRunQuote {
  return {
    ...quote,
    subroutines: quote.subroutines.map(
      visibleSubroutineWithFallbackUnbrokenRunEffect,
    ),
  };
}

export function visibleSubroutineWithFallbackUnbrokenRunEffect(
  subroutine: VisibleEffectiveSubroutine,
): VisibleEffectiveSubroutine {
  const unbrokenRunEffect =
    subroutine.unbrokenRunEffect ??
    fallbackUnbrokenRunEffectForSubroutine(subroutine);
  return unbrokenRunEffect ? { ...subroutine, unbrokenRunEffect } : subroutine;
}

export function fallbackUnbrokenRunEffectForSubroutine(subroutine: {
  type: VisibleEffectiveSubroutine["type"];
  amount?: number;
  traceSuccessEffect?: TraceSuccessEffect;
}): RunPathProjectionEffect | undefined {
  const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
  const traceEffect =
    subroutine.type === "initiate_trace"
      ? fallbackUnbrokenRunEffectForTraceSuccess(subroutine.traceSuccessEffect)
      : undefined;
  if (traceEffect) return traceEffect;
  switch (subroutine.type) {
    case "set_run_future_end_the_run_subroutine":
      return { addsFutureEndTheRunSubroutines: 1 };
    case "set_run_break_subroutine_cost_modifier":
      return amount > 0
        ? { increasesFutureBreakCostPerSubroutine: amount }
        : undefined;
    case "set_run_future_strength_bonus":
      return amount > 0 ? { increasesFutureIceStrength: amount } : undefined;
    case "set_next_encounter_no_break_subroutines":
      return { preventsFutureBreaking: true };
    case "set_run_encounter_tax":
      return amount > 0 ? { addsFutureEncounterCost: amount } : undefined;
    case "set_run_jack_out_lock":
    case "set_next_encounter_lock":
      return { preventsJackOut: true };
    case "set_next_encounter_unless_fully_break_damage":
    case "set_run_pass_rezzed_ice_program_trash":
    case "set_run_active_ice_program_trash":
    case "do_damage":
    case "trash_installed_program":
      return { causesDamageOrProgramTrash: true };
    case "set_runner_run_lock_actions":
      return { createsRunLockOrActionTax: Math.max(1, amount) };
    case "set_runner_forgo_next_action":
      return { createsRunLockOrActionTax: 1 };
    default:
      return undefined;
  }
}

export function fallbackUnbrokenRunEffectForTraceSuccess(
  effect: TraceSuccessEffect | undefined,
): RunPathProjectionEffect | undefined {
  if (!effect || effect.type === "none") return undefined;
  switch (effect.type) {
    case "end_run_and_run_lock":
      return { createsRunLockOrActionTax: Math.max(1, effect.amount) };
    case "end_run_trash_program_and_run_lock":
      return { createsRunLockOrActionTax: Math.max(1, effect.amount) };
    default:
      return undefined;
  }
}

export function effectiveIceForQuote(
  ice: IceCardLike,
  quote: VisibleEffectiveIceRunQuote | undefined,
): IceCardLike {
  return quote ? { ...ice, strength: quote.effectiveStrength } : ice;
}

export function minimumCreditsToBreakVisibleSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  targetSubroutines: readonly VisibleEffectiveSubroutine[],
  breakerStrengths: Map<string, number>,
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) =>
      creditsToBreakVisibleSubroutinesWithBreaker(
        card,
        ice,
        targetSubroutines,
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

export function creditsToBreakVisibleSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  targetSubroutines: readonly VisibleEffectiveSubroutine[],
  currentBreakerStrength = breakerCard.strength ??
    cardDefinitionStrength(breakerCard.definitionId),
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  if (
    targetSubroutines.length <= 0 ||
    !breakerCard.known ||
    !breakerCard.definitionId ||
    !ice.definitionId
  )
    return undefined;
  if (breakerCardBlocksAccessReachability(breakerCard.definitionId)) {
    return undefined;
  }
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (
    !breakerDefinition ||
    !iceDefinition ||
    !hasSubtype(breakerDefinition.subtypes, "icebreaker")
  )
    return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const targetBreakTags = targetSubroutines.map(breakTagsForSubroutine);
  const explicitBreakAbilities =
    breakerDefinition.abilities?.filter(
      (ability) => ability.type === "break_subroutine",
    ) ?? [];
  const matchingBreakAbility = explicitBreakAbilities.find((ability) => {
    if (ability.iceSubtype && !hasSubtype(iceSubtypes, ability.iceSubtype)) {
      return false;
    }
    const abilityBreakTags = ability.subroutineBreakTags ?? [];
    if (abilityBreakTags.length === 0) return true;
    return targetBreakTags.every((tags) =>
      abilityBreakTags.some((tag) => tags.includes(subtypeKey(tag))),
    );
  });
  const structuredBreakAssessment = matchingBreakAbility
    ? undefined
    : structuredBreakerAssessment({
        breakerCard,
        breakerDefinition,
        ice,
        subroutineCount: targetSubroutines.length,
        currentBreakerStrength,
        additionalBreakCostPerSubroutine,
      });
  if (structuredBreakAssessment) return structuredBreakAssessment;
  const structuredProfile = getStructuredBreakerProfileForCard(
    breakerCard.definitionId,
  );
  if (
    !matchingBreakAbility &&
    (explicitBreakAbilities.length > 0 || structuredProfile)
  ) {
    return undefined;
  }
  const breakAbility =
    matchingBreakAbility ??
    textBreakSubroutineAbility(breakerDefinition, iceSubtypes);
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility =
    breakerDefinition.abilities?.find(
      (ability) => ability.type === "pump_strength",
    ) ?? textPumpStrengthAbility(breakerDefinition);
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
  const breakUses = Math.ceil(targetSubroutines.length / breakCount);
  return {
    cost:
      pumpCost +
      breakUses * (breakAbility.cost.credits ?? 0) +
      targetSubroutines.length * Math.max(0, additionalBreakCostPerSubroutine),
    breakerInstanceId: breakerCard.instanceId,
    breakerDefinitionId: breakerCard.definitionId,
    breakerSubtypes: breakerDefinition.subtypes.slice(),
    endingStrength,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(breakerDefinition),
    ...(breakAbility.postBreakStealthLoss
      ? {
          postBreakStealthLoss: breakUses * breakAbility.postBreakStealthLoss,
        }
      : {}),
  };
}

export function breakTagsForSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): string[] {
  const tags = new Set((subroutine.breakTags ?? []).map(subtypeKey));
  if (subroutine.type === "initiate_trace") tags.add("trace");
  if (subroutine.type === "end_the_run") tags.add("end_the_run");
  if (subroutine.type === "do_damage") tags.add("damage");
  return [...tags];
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
  if (breakerCardBlocksAccessReachability(breakerCard.definitionId)) {
    return undefined;
  }
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (
    !breakerDefinition ||
    !iceDefinition ||
    !hasSubtype(breakerDefinition.subtypes, "icebreaker")
  )
    return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const explicitBreakAbilities =
    breakerDefinition.abilities?.filter(
      (ability) => ability.type === "break_subroutine",
    ) ?? [];
  const matchingBreakAbility = explicitBreakAbilities.find(
    (ability) =>
      !ability.iceSubtype || hasSubtype(iceSubtypes, ability.iceSubtype),
  );
  const structuredBreakAssessment = matchingBreakAbility
    ? undefined
    : structuredBreakerAssessment({
        breakerCard,
        breakerDefinition,
        ice,
        subroutineCount: endTheRunCount,
        currentBreakerStrength,
        additionalBreakCostPerSubroutine,
      });
  if (structuredBreakAssessment) return structuredBreakAssessment;
  const structuredProfile = getStructuredBreakerProfileForCard(
    breakerCard.definitionId,
  );
  if (
    !matchingBreakAbility &&
    (explicitBreakAbilities.length > 0 || structuredProfile)
  ) {
    return undefined;
  }
  const breakAbility =
    matchingBreakAbility ??
    textBreakSubroutineAbility(breakerDefinition, iceSubtypes);
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility =
    breakerDefinition.abilities?.find(
      (ability) => ability.type === "pump_strength",
    ) ?? textPumpStrengthAbility(breakerDefinition);
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
    breakerDefinitionId: breakerCard.definitionId,
    breakerSubtypes: breakerDefinition.subtypes.slice(),
    endingStrength,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(breakerDefinition),
    ...(breakAbility.postBreakStealthLoss
      ? {
          postBreakStealthLoss: breakUses * breakAbility.postBreakStealthLoss,
        }
      : {}),
  };
}

export function structuredBreakerAssessment(params: {
  breakerCard: VisibleCard;
  breakerDefinition: CardDefinition;
  ice: { definitionId?: string; subtypes?: string[]; strength?: number };
  subroutineCount: number;
  currentBreakerStrength: number;
  additionalBreakCostPerSubroutine: number;
}): BreakAssessment | undefined {
  const profile = getStructuredBreakerProfileForCard(
    params.breakerCard.definitionId,
  );
  if (!profile) return undefined;
  const estimate = estimateStructuredBreakerCostForIce(
    params.breakerCard.definitionId,
    params.ice,
    params.subroutineCount,
    params.currentBreakerStrength,
    params.additionalBreakCostPerSubroutine,
  );
  if (!estimate) return undefined;
  const iceStrength =
    params.ice.strength ?? cardDefinitionStrength(params.ice.definitionId);
  const pumpStrengthAmount = Math.max(
    1,
    Math.floor(profile.pumpStrengthAmount ?? 1),
  );
  const requiredPumps = Math.max(
    0,
    Math.ceil(
      (iceStrength - params.currentBreakerStrength) / pumpStrengthAmount,
    ),
  );
  return {
    cost: estimate.cost,
    breakerInstanceId: params.breakerCard.instanceId,
    breakerDefinitionId:
      params.breakerCard.definitionId ?? params.breakerDefinition.id,
    breakerSubtypes: params.breakerDefinition.subtypes.slice(),
    endingStrength:
      params.currentBreakerStrength + requiredPumps * pumpStrengthAmount,
    carriesStrengthAcrossIce: breakerCarriesStrengthAcrossIce(
      params.breakerDefinition,
    ),
  };
}

export function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return (
    visibleRunCardDefinition(iceDefinitionId)?.subroutines?.filter(
      (subroutine) => subroutine.type === "end_the_run",
    ).length ?? 0
  );
}

export function textBreakSubroutineAbility(
  breakerDefinition: CardDefinition,
  iceSubtypes: readonly string[],
): BreakSubroutineAbilityLike | undefined {
  const clauses = visibleDefinitionRulesClauses(breakerDefinition);
  for (const clause of clauses) {
    if (!/\bbreak(?:s)?\b/.test(clause) || !/\bsubroutine/.test(clause)) {
      continue;
    }
    const iceSubtype = textBreakIceSubtype(clause);
    if (iceSubtype && !hasSubtype([...iceSubtypes], iceSubtype)) {
      continue;
    }
    return {
      cost: { credits: visibleTextActionCost(clause) ?? 1 },
      count: visibleTextBreakCount(clause),
      ...(iceSubtype ? { iceSubtype } : {}),
    };
  }
  return undefined;
}

export function textPumpStrengthAbility(
  breakerDefinition: CardDefinition,
): PumpStrengthAbilityLike | undefined {
  const clause = visibleDefinitionRulesClauses(breakerDefinition).find((part) =>
    /\+\s*\d+\s+strength\b/.test(part),
  );
  if (!clause) return undefined;
  const amount = Number.parseInt(
    clause.match(/\+\s*(\d+)\s+strength\b/)?.[1] ?? "",
    10,
  );
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return {
    cost: { credits: visibleTextActionCost(clause) ?? 1 },
    amount,
  };
}

export function textBreakIceSubtype(clause: string): string | undefined {
  if (/\bwalls?\b/.test(clause)) return "wall";
  if (/\bbarriers?\b/.test(clause)) return "barrier";
  if (/\bcode\s*gates?\b|\bcodegates?\b/.test(clause)) return "code_gate";
  if (/\bsentries\b|\bsentry\b/.test(clause)) return "sentry";
  if (/\bice\b/.test(clause)) return undefined;
  return undefined;
}

export function visibleTextActionCost(clause: string): number | undefined {
  const bracketCost = clause.match(/\[(\d+)\]\s*:/)?.[1];
  const colonCost = clause.match(
    /\b(\d+)\s*(?:credit|credits|bit|bits)?\s*:/,
  )?.[1];
  const cost = Number.parseInt(bracketCost ?? colonCost ?? "", 10);
  return Number.isFinite(cost) && cost >= 0 ? cost : undefined;
}

export function visibleTextBreakCount(clause: string): number {
  const count = Number.parseInt(
    clause.match(/\bbreak(?:s)?\s+(\d+)\b/)?.[1] ?? "",
    10,
  );
  return Number.isFinite(count) && count > 0 ? count : 1;
}

export function visibleDefinitionRulesClauses(
  definition: CardDefinition,
): string[] {
  const runtimeText = RUNTIME_CARDS[definition.id]?.text;
  return [definition.rulesText, runtimeText]
    .filter((text): text is string => typeof text === "string")
    .flatMap((text) =>
      text
        .toLocaleLowerCase("en-US")
        .split(/[.;\n]+/)
        .map((clause) => clause.trim())
        .filter(Boolean),
    );
}

export function canBreakerDefinitionBreakIce(
  breakerDefinitionId: string,
  iceDefinitionId: string,
): boolean {
  if (breakerCardBlocksAccessReachability(breakerDefinitionId)) return false;
  const breakerDefinition = visibleRunCardDefinition(breakerDefinitionId);
  const iceDefinition = visibleRunCardDefinition(iceDefinitionId);
  if (!breakerDefinition || !iceDefinition) return false;
  const explicitBreakAbilities =
    breakerDefinition.abilities?.filter(
      (ability) => ability.type === "break_subroutine",
    ) ?? [];
  if (
    explicitBreakAbilities.some(
      (ability) =>
        !ability.iceSubtype ||
        hasSubtype(iceDefinition.subtypes, ability.iceSubtype),
    )
  ) {
    return true;
  }
  if (explicitBreakAbilities.length > 0) return false;
  return structuredBreakerProfileCoversIce(
    breakerDefinitionId,
    iceDefinitionId,
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

export function visibleRunCardDefinition(
  definitionId: string | undefined,
): CardDefinition | undefined {
  if (!definitionId) return undefined;
  const directDefinition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (directDefinition) return directDefinition;
  const runtimeEngineId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return runtimeEngineId ? CARD_DEFINITIONS_BY_ID[runtimeEngineId] : undefined;
}

export function breakerCarriesStrengthAcrossIce(
  definition: CardDefinition,
): boolean {
  return (
    RUN_REMAINDER_STRENGTH_BREAKER_IDS.has(definition.id) ||
    (definition.mechanics ?? []).includes("run_remainder_strength_bonus")
  );
}

export function hasSubtype(
  subtypes: string[],
  expectedSubtype: string,
): boolean {
  const expected = subtypeKey(expectedSubtype);
  return subtypes.some((subtype) => subtypeKey(subtype) === expected);
}

export function subtypeKey(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
