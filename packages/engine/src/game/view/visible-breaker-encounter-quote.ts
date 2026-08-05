import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export type VisibleBreakerConsequence =
  | {
      kind: "lose_stealth_credits";
      amount: number;
      trigger: "per_subroutine" | "per_ability_use";
      sourceMode: "single_stealth_card" | "any_stealth_cards";
      optionalIfUnavailable: boolean;
    }
  | { kind: "end_run_after_use" }
  | { kind: "lose_future_clicks"; amountPerStrength: number }
  | {
      kind: "increase_breaker_strength";
      amount: number;
      duration: "current_encounter" | "current_run" | "persistent";
    }
  | {
      kind: "set_next_matching_ice_free_break";
      iceSubtype: "sentry";
      amount: number;
      expiresIfNextIceDoesNotMatch: true;
    }
  | {
      kind: "random_break_attempt";
      successResults: number[];
      successProbability: number;
      expectedNetDamage: number;
      maximumNetDamage: number;
      failureDamageType: "net";
      failureDamageEqualsRoll: true;
      limit: "once_per_subroutine_per_encounter";
    }
  | {
      kind: "trash_breaker_check_after_pass";
      dieResultsCausingTrash: number[];
      trigger: "once_per_passed_ice_if_used";
    };

export type VisibleBreakerStateChange =
  | { kind: "add_run_strength"; breakerInstanceId: string; amount: number }
  | {
      kind: "increment_broken_subroutine_count";
      breakerInstanceId: string;
      amount: number;
    }
  | {
      kind: "set_pending_free_break";
      breakerInstanceId: string;
      iceSubtype: "sentry";
      remainingUses: 1;
      mustBeNextEncounteredIce: true;
    };

export type VisibleBreakerEncounterQuote = {
  breakerInstanceId: string;
  iceInstanceId?: string;
  effectiveStrength: number;
  pumpOptions: Array<{
    creditCost: number;
    strengthGain: number;
    duration: "current_encounter" | "current_run" | "persistent";
    consequences: VisibleBreakerConsequence[];
  }>;
  breakOptions: Array<{
    breakableSubroutineIndexes: number[];
    creditCost: number;
    maximumSubroutinesPerUse: number;
    consequences: VisibleBreakerConsequence[];
  }>;
  coverageStatus: "full" | "partial" | "none" | "requires_selection";
  randomRunStrength?: {
    minimumStrength: number;
    expectedStrength: number;
    maximumStrength: number;
  };
  stateChangesAfterUse: VisibleBreakerStateChange[];
};

export function visibleBreakerEncounterQuote(params: {
  breakerDefinitionId: CardDefinitionId;
  breakerInstanceId: string;
  breakerStrength: number;
  selectedTargetCardId?: CardInstanceId;
  selectedSubtype?: string;
  iceDefinitionId: CardDefinitionId;
  iceInstanceId?: string;
  iceSubtypes?: readonly string[];
  subroutines?: readonly VisibleEffectiveSubroutine[];
}): VisibleBreakerEncounterQuote | undefined {
  const breaker = CARD_DEFINITIONS_BY_ID[params.breakerDefinitionId];
  const ice = CARD_DEFINITIONS_BY_ID[params.iceDefinitionId];
  if (!breaker || !ice || breaker.type !== "program" || ice.type !== "ice")
    return undefined;
  const abilities = icebreakerAbilitiesForDefinition(breaker);
  const subroutines = params.subroutines ?? [];
  const breakAbilities = abilities.filter(
    (ability) => ability.type === "break_subroutine",
  );
  const breakOptions = breakAbilities.flatMap((ability) => {
    const indexes = subroutines
      .map((subroutine, index) =>
        breakAbilityMatches(
          ability,
          params.selectedSubtype,
          params.iceDefinitionId,
          params.iceSubtypes ?? ice.subtypes,
          subroutine,
        )
          ? index
          : -1,
      )
      .filter((index) => index >= 0);
    const matchesIce =
      subroutines.length > 0
        ? indexes.length > 0
        : breakAbilityMatches(
            ability,
            params.selectedSubtype,
            params.iceDefinitionId,
            params.iceSubtypes ?? ice.subtypes,
          );
    if (!matchesIce) return [];
    return [
      {
        breakableSubroutineIndexes: indexes,
        creditCost: ability.cost.credits ?? 0,
        maximumSubroutinesPerUse: Math.max(1, ability.count ?? 1),
        consequences: consequencesFor(ability),
      },
    ];
  });
  const unresolvedSelection =
    !params.selectedSubtype &&
    breakAbilities.some((ability) => ability.selectedIceSubtypeFromBreaker);
  const breakable = new Set(
    breakOptions.flatMap((option) => option.breakableSubroutineIndexes),
  );
  const coverageStatus = unresolvedSelection
    ? "requires_selection"
    : breakOptions.length === 0
      ? "none"
      : subroutines.length > 0 && breakable.size < subroutines.length
        ? "partial"
        : "full";
  const pumpOptions = abilities
    .filter((ability) => ability.type === "pump_strength")
    .map((ability) => ({
      creditCost: ability.cost.credits ?? 0,
      strengthGain: Math.max(1, ability.amount ?? 1),
      duration: durationFor(ability.strengthDuration),
      consequences: [
        {
          kind: "increase_breaker_strength" as const,
          amount: Math.max(1, ability.amount ?? 1),
          duration: durationFor(ability.strengthDuration),
        },
        ...(ability.pumpConsequences ?? []).map((consequence) => ({
          kind: consequence.kind,
          amountPerStrength: consequence.amountPerStrength,
        })),
      ],
    }));
  const stateChangesAfterUse = stateChangesFor(
    params.breakerInstanceId,
    breakAbilities,
  );
  const hasRunStartRandomStrength = abilities.some((ability) =>
    ability.specialEffects?.some(
      (effect) => effect.kind === "run_start_random_strength_bonus",
    ),
  );
  return {
    breakerInstanceId: params.breakerInstanceId,
    ...(params.iceInstanceId ? { iceInstanceId: params.iceInstanceId } : {}),
    effectiveStrength: effectiveStrength(params),
    pumpOptions,
    breakOptions,
    coverageStatus,
    ...(hasRunStartRandomStrength
      ? {
          randomRunStrength: {
            minimumStrength: 1,
            expectedStrength: 3.5,
            maximumStrength: 6,
          },
        }
      : {}),
    stateChangesAfterUse,
  };
}

function effectiveStrength(params: {
  breakerDefinitionId: CardDefinitionId;
  breakerStrength: number;
  selectedTargetCardId?: CardInstanceId;
  iceInstanceId?: string;
}): number {
  const bonus = cardImplementationForDefinitionId(
    params.breakerDefinitionId,
  )?.icebreakerEncounterStrengthBonus;
  return Math.max(
    0,
    Math.floor(params.breakerStrength) +
      (bonus?.kind === "against_selected_installed_ice" &&
      params.selectedTargetCardId === params.iceInstanceId
        ? bonus.amount
        : 0),
  );
}

function breakAbilityMatches(
  ability: ReturnType<typeof icebreakerAbilitiesForDefinition>[number],
  selectedSubtype: string | undefined,
  iceDefinitionId: CardDefinitionId,
  iceSubtypes: readonly string[],
  subroutine?: VisibleEffectiveSubroutine,
): boolean {
  if (ability.type !== "break_subroutine") return false;
  if (ability.selectedIceSubtypeFromBreaker)
    return (
      selectedSubtype !== undefined && hasSubtype(iceSubtypes, selectedSubtype)
    );
  if (ability.iceSubtype && !hasSubtype(iceSubtypes, ability.iceSubtype))
    return false;
  if (
    ability.iceDefinitionIds &&
    !ability.iceDefinitionIds.includes(iceDefinitionId)
  )
    return false;
  if (
    ability.iceSubtypes &&
    !ability.iceSubtypes.some((subtype) => hasSubtype(iceSubtypes, subtype))
  )
    return false;
  if (ability.subroutineBreakTags) {
    if (!subroutine) return false;
    const tags = new Set(
      [
        ...(subroutine.breakTags ?? []),
        ...(subroutine.type === "initiate_trace" ? ["trace"] : []),
      ].map(key),
    );
    return ability.subroutineBreakTags.some((tag) => tags.has(key(tag)));
  }
  return true;
}

function consequencesFor(
  ability: RuntimeIcebreakerAbility,
): VisibleBreakerConsequence[] {
  const result: VisibleBreakerConsequence[] = [];
  if (ability.postBreakStealthLoss !== undefined)
    result.push({
      kind: "lose_stealth_credits",
      amount: ability.postBreakStealthLoss,
      trigger:
        ability.count && ability.count > 1
          ? "per_ability_use"
          : "per_subroutine",
      sourceMode:
        ability.postBreakStealthLossMode === "total_if_available"
          ? "any_stealth_cards"
          : "single_stealth_card",
      optionalIfUnavailable: true,
    });
  if (ability.onUseEndRun) result.push({ kind: "end_run_after_use" });
  for (const effect of ability.specialEffects ?? []) {
    if (effect.kind === "set_next_sentry_free_break_after_fully_breaking_wall")
      result.push({
        kind: "set_next_matching_ice_free_break",
        iceSubtype: "sentry",
        amount: 1,
        expiresIfNextIceDoesNotMatch: true,
      });
    if (effect.kind === "random_break_or_damage")
      result.push({
        kind: "random_break_attempt",
        successResults: [...effect.successDieResults],
        successProbability: effect.successDieResults.length / 6,
        expectedNetDamage: expectedFailureDamage(effect.successDieResults, 6),
        maximumNetDamage: effect.maxFailureDamage,
        failureDamageType: "net",
        failureDamageEqualsRoll: true,
        limit: "once_per_subroutine_per_encounter",
      });
    if (effect.kind === "post_encounter_self_trash_check")
      result.push({
        kind: "trash_breaker_check_after_pass",
        dieResultsCausingTrash: [...effect.trashDieResults],
        trigger: "once_per_passed_ice_if_used",
      });
  }
  return result;
}

function expectedFailureDamage(
  successResults: readonly number[],
  dieSides: number,
): number {
  const success = new Set(successResults);
  return Array.from({ length: dieSides }, (_, index) => index + 1).reduce(
    (sum, result) => sum + (success.has(result) ? 0 : result / dieSides),
    0,
  );
}

function stateChangesFor(
  breakerInstanceId: string,
  abilities: readonly RuntimeIcebreakerAbility[],
): VisibleBreakerStateChange[] {
  const effects = abilities.flatMap((ability) => ability.specialEffects ?? []);
  const changes: VisibleBreakerStateChange[] = [];
  if (
    effects.some(
      (effect) =>
        effect.kind === "strength_bonus_per_successful_break_this_run",
    )
  )
    changes.push(
      { kind: "add_run_strength", breakerInstanceId, amount: 1 },
      {
        kind: "increment_broken_subroutine_count",
        breakerInstanceId,
        amount: 1,
      },
    );
  if (
    effects.some(
      (effect) =>
        effect.kind === "set_next_sentry_free_break_after_fully_breaking_wall",
    )
  )
    changes.push({
      kind: "set_pending_free_break",
      breakerInstanceId,
      iceSubtype: "sentry",
      remainingUses: 1,
      mustBeNextEncounteredIce: true,
    });
  return changes;
}

function durationFor(
  duration: "current_encounter" | "current_run" | "current_turn" | undefined,
): "current_encounter" | "current_run" | "persistent" {
  return duration === "current_run"
    ? "current_run"
    : duration === "current_turn"
      ? "persistent"
      : "current_encounter";
}
function key(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
function hasSubtype(subtypes: readonly string[], expected: string): boolean {
  return subtypes.some((subtype) => key(subtype) === key(expected));
}
