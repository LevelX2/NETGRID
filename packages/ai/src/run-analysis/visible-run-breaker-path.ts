import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import {
  cardImplementationForDefinitionId,
  icebreakerAbilitiesForDefinition,
  traceBaseLinkCardImplementationQuotesForDefinition,
  visibleBreakerEncounterQuote,
} from "@netgrid/engine";
import { RUNTIME_CARDS } from "../ai-hints";
import {
  breakerCardBlocksAccessReachability,
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
  VisibleRunBreakerState,
} from "./visible-run-analysis-contracts";

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
  pendingFreeBreaks: VisibleRunBreakerState["pendingFreeBreaks"] = [],
): BreakAssessment | undefined {
  const freeBreak = pendingFreeBreakAssessment(
    ice,
    rigCards,
    targetSubroutines.length,
    pendingFreeBreaks,
  );
  if (freeBreak) return freeBreak;
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
    icebreakerAbilitiesForDefinition(breakerDefinition).filter(
      (ability) => ability.type === "break_subroutine",
    );
  const engineBreakAssessment = structuredBreakerAssessment({
    breakerCard,
    breakerDefinition,
    ice,
    subroutineCount: targetSubroutines.length,
    subroutines: targetSubroutines,
    currentBreakerStrength,
    additionalBreakCostPerSubroutine,
  });
  if (engineBreakAssessment) return engineBreakAssessment;
  // Active breaker implementations are authoritative.  Do not silently
  // reinterpret their rules text when a structured quote is not applicable.
  if (
    cardImplementationForDefinitionId(breakerCard.definitionId)
      ?.icebreakerAbilities?.length
  ) {
    return undefined;
  }
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
  pendingFreeBreaks: VisibleRunBreakerState["pendingFreeBreaks"] = [],
  targetSubroutines?: readonly VisibleEffectiveSubroutine[],
): BreakAssessment | undefined {
  const freeBreak = pendingFreeBreakAssessment(
    ice,
    rigCards,
    endTheRunCount,
    pendingFreeBreaks,
  );
  if (freeBreak) return freeBreak;
  const costs = rigCards
    .map((card) =>
      creditsToBreakEndTheRunSubroutinesWithBreaker(
        card,
        ice,
        endTheRunCount,
        breakerStrengths.get(card.instanceId),
        additionalBreakCostPerSubroutine,
        targetSubroutines,
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
  targetSubroutines?: readonly VisibleEffectiveSubroutine[],
  allowRandomBreakAttempt = false,
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
  const explicitBreakAbilities = icebreakerAbilitiesForDefinition(
    breakerDefinition,
  ).filter((ability) => ability.type === "break_subroutine");
  const engineBreakAssessment = structuredBreakerAssessment({
    breakerCard,
    breakerDefinition,
    ice,
    subroutineCount: endTheRunCount,
    subroutines:
      targetSubroutines ??
      (iceDefinition.subroutines ?? [])
        .filter((subroutine) => subroutine.type === "end_the_run")
        .map((subroutine) => ({
          id: subroutine.id,
          type: subroutine.type,
          ...(subroutine.breakTags
            ? { breakTags: subroutine.breakTags.slice() }
            : {}),
        })),
    currentBreakerStrength,
    additionalBreakCostPerSubroutine,
    allowRandomBreakAttempt,
  });
  if (engineBreakAssessment) return engineBreakAssessment;
  if (
    cardImplementationForDefinitionId(breakerCard.definitionId)
      ?.icebreakerAbilities?.length
  ) {
    return undefined;
  }
  const matchingBreakAbility = explicitBreakAbilities.find(
    (ability) =>
      !ability.iceSubtype || hasSubtype(iceSubtypes, ability.iceSubtype),
  );
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
  ice: {
    instanceId?: string;
    definitionId?: string;
    subtypes?: string[];
    strength?: number;
  };
  subroutineCount: number;
  subroutines?: readonly VisibleEffectiveSubroutine[];
  currentBreakerStrength: number;
  additionalBreakCostPerSubroutine: number;
  allowRandomBreakAttempt?: boolean;
}): BreakAssessment | undefined {
  if (!params.breakerCard.definitionId || !params.ice.definitionId)
    return undefined;
  const quote = visibleBreakerEncounterQuote({
    breakerDefinitionId: params.breakerCard.definitionId,
    breakerInstanceId: params.breakerCard.instanceId,
    breakerStrength: params.currentBreakerStrength,
    ...(params.breakerCard.selectedTargetCardId
      ? { selectedTargetCardId: params.breakerCard.selectedTargetCardId }
      : {}),
    ...(params.breakerCard.selectedSubtype
      ? { selectedSubtype: params.breakerCard.selectedSubtype }
      : {}),
    iceDefinitionId: params.ice.definitionId,
    ...(params.ice.instanceId ? { iceInstanceId: params.ice.instanceId } : {}),
    ...(params.ice.subtypes ? { iceSubtypes: params.ice.subtypes } : {}),
    ...(params.subroutines ? { subroutines: params.subroutines } : {}),
  });
  if (!quote) return undefined;
  const remainingIndexes = new Set(
    Array.from(
      { length: Math.max(1, params.subroutineCount) },
      (_, index) => index,
    ),
  );
  let breakCost = 0;
  let postBreakStealthLoss = 0;
  let mayTrashBreakerAfterPass = false;
  while (remainingIndexes.size > 0) {
    const option = quote.breakOptions
      .filter(
        (candidate) =>
          !candidate.consequences.some(
            (effect) =>
              effect.kind === "end_run_after_use" ||
              (effect.kind === "random_break_attempt" &&
                !params.allowRandomBreakAttempt),
          ) &&
          candidate.breakableSubroutineIndexes.some((index) =>
            remainingIndexes.has(index),
          ),
      )
      .sort(
        (left, right) =>
          right.breakableSubroutineIndexes.filter((index) =>
            remainingIndexes.has(index),
          ).length -
            left.breakableSubroutineIndexes.filter((index) =>
              remainingIndexes.has(index),
            ).length || left.creditCost - right.creditCost,
      )[0];
    if (!option) return undefined;
    const coveredIndexes = option.breakableSubroutineIndexes.filter((index) =>
      remainingIndexes.has(index),
    );
    const uses = Math.ceil(
      coveredIndexes.length / option.maximumSubroutinesPerUse,
    );
    breakCost += uses * option.creditCost;
    const stealthLoss = option.consequences.find(
      (effect) => effect.kind === "lose_stealth_credits",
    );
    if (stealthLoss)
      postBreakStealthLoss +=
        (stealthLoss.trigger === "per_ability_use"
          ? uses
          : coveredIndexes.length) * stealthLoss.amount;
    if (
      option.consequences.some(
        (effect) => effect.kind === "trash_breaker_check_after_pass",
      )
    )
      mayTrashBreakerAfterPass = true;
    for (const index of coveredIndexes) remainingIndexes.delete(index);
  }
  const iceStrength =
    params.ice.strength ?? cardDefinitionStrength(params.ice.definitionId);
  const pumpOption = quote.pumpOptions.sort(
    (left, right) => left.creditCost - right.creditCost,
  )[0];
  const randomStrengthCanCover =
    quote.randomRunStrength !== undefined &&
    quote.randomRunStrength.maximumStrength >= iceStrength;
  if (
    quote.effectiveStrength < iceStrength &&
    !pumpOption &&
    !randomStrengthCanCover
  )
    return undefined;
  const pumpStrengthAmount = Math.max(
    1,
    Math.floor(pumpOption?.strengthGain ?? 1),
  );
  const requiredPumps = Math.max(
    0,
    Math.ceil(
      (iceStrength -
        Math.max(
          quote.effectiveStrength,
          quote.randomRunStrength?.expectedStrength ?? 0,
        )) /
        pumpStrengthAmount,
    ),
  );
  const runStrengthGain = quote.stateChangesAfterUse
    .filter((change) => change.kind === "add_run_strength")
    .reduce(
      (sum, change) =>
        sum + change.amount * Math.max(1, params.subroutineCount),
      0,
    );
  return {
    cost:
      requiredPumps * (pumpOption?.creditCost ?? 0) +
      breakCost +
      Math.max(1, params.subroutineCount) *
        Math.max(0, params.additionalBreakCostPerSubroutine),
    breakerInstanceId: params.breakerCard.instanceId,
    breakerDefinitionId: params.breakerCard.definitionId,
    breakerSubtypes: params.breakerDefinition.subtypes.slice(),
    endingStrength:
      quote.effectiveStrength +
      requiredPumps * pumpStrengthAmount +
      runStrengthGain,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(params.breakerDefinition) ||
      pumpOption?.duration === "current_run" ||
      runStrengthGain > 0,
    ...(runStrengthGain > 0 ? { runStrengthGain } : {}),
    ...(postBreakStealthLoss > 0 ? { postBreakStealthLoss } : {}),
    ...(quote.randomRunStrength && quote.effectiveStrength < iceStrength
      ? { conditionalAccessReason: "visible_random_breaker_strength" as const }
      : {}),
    ...(mayTrashBreakerAfterPass
      ? {
          conditionalRiskReason:
            "visible_breaker_may_trash_after_pass" as const,
        }
      : {}),
    ...(quote.stateChangesAfterUse.length > 0
      ? {
          stateChangesAfterUse: quote.stateChangesAfterUse.map((change) => {
            switch (change.kind) {
              case "add_run_strength":
              case "increment_broken_subroutine_count":
                return { kind: change.kind, amount: change.amount };
              case "set_pending_free_break":
                return {
                  kind: change.kind,
                  iceSubtype: change.iceSubtype,
                  remainingUses: change.remainingUses,
                  mustBeNextEncounteredIce: change.mustBeNextEncounteredIce,
                };
            }
          }),
        }
      : {}),
    ...(pumpOption?.consequences.find(
      (effect) => effect.kind === "lose_future_clicks",
    )
      ? {
          futureClicksLost:
            requiredPumps *
            (pumpOption.consequences.find(
              (effect) => effect.kind === "lose_future_clicks",
            )?.amountPerStrength ?? 0),
        }
      : {}),
  };
}

function pendingFreeBreakAssessment(
  ice: { definitionId?: string; subtypes?: string[] },
  rigCards: VisibleCard[],
  subroutineCount: number,
  pendingFreeBreaks: VisibleRunBreakerState["pendingFreeBreaks"],
): BreakAssessment | undefined {
  if (subroutineCount !== 1 || !ice.definitionId) return undefined;
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  const iceSubtypes = ice.subtypes ?? iceDefinition?.subtypes ?? [];
  if (!hasSubtype(iceSubtypes, "sentry")) return undefined;
  const pending = pendingFreeBreaks.find(
    (entry) => entry.iceSubtype === "sentry" && entry.remainingUses > 0,
  );
  if (!pending) return undefined;
  const breaker = rigCards.find(
    (card) => card.instanceId === pending.sourceBreakerInstanceId && card.known,
  );
  if (!breaker?.definitionId) return undefined;
  const definition = visibleRunCardDefinition(breaker.definitionId);
  if (!definition) return undefined;
  return {
    cost: 0,
    breakerInstanceId: breaker.instanceId,
    breakerDefinitionId: breaker.definitionId,
    breakerSubtypes: definition.subtypes.slice(),
    endingStrength: breaker.strength ?? cardDefinitionStrength(breaker.definitionId),
    carriesStrengthAcrossIce: false,
    consumedPendingFreeBreak: true,
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
  const explicitBreakAbilities = icebreakerAbilitiesForDefinition(
    breakerDefinition,
  ).filter((ability) => ability.type === "break_subroutine");
  if (
    explicitBreakAbilities.some(
      (ability) =>
        (!ability.iceSubtype ||
          hasSubtype(iceDefinition.subtypes, ability.iceSubtype)) &&
        (!ability.iceDefinitionIds?.length ||
          ability.iceDefinitionIds.includes(iceDefinitionId)),
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
  return (definition.mechanics ?? []).includes("run_remainder_strength_bonus");
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
