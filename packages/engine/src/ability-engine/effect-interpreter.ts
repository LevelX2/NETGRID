/**
 * Interprets declarative CardImplementation effects against the current state.
 *
 * Simple public effects such as credits, tags, and actions mutate state here.
 * Effects that require existing engine primitives, such as draw, damage,
 * hosted-credit mutation, or source trashing, are supplied through the execution
 * context so this module does not import index.ts or duplicate host rules.
 */
import type { GameState, ResolvedGameEffect } from "@netgrid/shared";
import type { CardEffectImplementation } from "./definition-types";
import { executeAdvancementEffect } from "./effect-families/advancement-effects";
import { executeAgendaScoringEffect } from "./effect-families/agenda-scoring-effects";
import { executeBadPublicityEffect } from "./effect-families/bad-publicity-effects";
import { executeContextualEffect } from "./effect-families/contextual-effect-dispatch";
import { executeCounterEffect } from "./effect-families/counter-effects";
import { executeCreditEffect } from "./effect-families/credit-effects";
import { executeDamageEffect } from "./effect-families/damage-effects";
import { executeDrawEffect } from "./effect-families/draw-effects";
import type { CardEffectFamilyRuntime } from "./effect-families/family-runtime";
import { executeHostedCreditEffect } from "./effect-families/hosted-credit-effects";
import { executeTagEffect } from "./effect-families/tag-effects";
import type {
  CardEffectExecutionContext,
  CardEffectExecutionResult,
} from "./effect-execution-types";
import {
  assertHiddenInfoBarrierVisibility,
  assertPositiveIntegerAmount,
  assertPublicVisibility,
  creditsForSide,
  dataFortServerIds,
  effectReason,
  loseCredits,
  loseGame,
  mergePublicPayload,
  publicEffectId,
  recipientSide,
  spendCreditsIfAvailable,
} from "./effect-runtime-helpers";

export type {
  CardEffectAdvancementChoiceResult,
  CardEffectAvoidTagResult,
  CardEffectCounterResult,
  CardEffectDamageResult,
  CardEffectDrawCardsResult,
  CardEffectExecutionContext,
  CardEffectExecutionResult,
  CardEffectHiddenInfoResult,
  CardEffectHostedCreditsResult,
  CardEffectMakeRunOptions,
  CardEffectMakeRunResult,
  CardEffectPrivateLookResult,
  CardEffectRemoveTagsResult,
  CardEffectReturnSourceResult,
  CardEffectTraceResult,
  CardEffectTrashSourceResult,
} from "./effect-execution-types";

/**
 * Executes ordered CardImplementation effects and returns public payload plus
 * redacted ResolvedEffects for event/chronicle consumers.
 *
 * This function is a mutating interpreter. It validates the small declarative
 * vocabulary, preserves effect order, and relies on injected host callbacks for
 * mechanics with their own revalidation or hidden-info contracts.
 */
export function executeCardImplementationEffects(
  state: GameState,
  context: CardEffectExecutionContext,
  effects: readonly CardEffectImplementation[],
): CardEffectExecutionResult {
  const publicPayload: Record<string, string | number | boolean> = {};
  const resolvedEffects: ResolvedGameEffect[] = [];
  let creditGainOrdinal = context.creditGainOrdinalOffset ?? 0;
  const familyRuntime: CardEffectFamilyRuntime = {
    recipientSide,
    gainCredits: (_state, side, amount, kind = "standard") => {
      if (!context.gainCredits)
        throw new Error(
          "Credit-Gain-Effekt braucht eine zentrale Gain-Runtime.",
        );
      if (kind === "standard" && amount > 0) creditGainOrdinal += 1;
      return context.gainCredits(side, amount, creditGainOrdinal, kind);
    },
    creditsForSide,
    loseCredits,
    spendCreditsIfAvailable,
    loseGame,
    publicEffectId,
    effectReason,
    assertPositiveIntegerAmount,
    assertPublicVisibility,
    assertHiddenInfoBarrierVisibility,
    mergePublicPayload,
    dataFortServerIds,
  };

  for (const [localIndex, effect] of effects.entries()) {
    const index = localIndex + (context.effectIndexOffset ?? 0);
    const familyInput = {
      state,
      context,
      effect,
      index,
      publicPayload,
      resolvedEffects,
      runtime: familyRuntime,
    };

    // The dispatcher preserves effect order. New reusable effect behavior should
    // live in a focused family module instead of extending this switch forever.
    const handled =
      executeCreditEffect(familyInput) ||
      executeBadPublicityEffect(familyInput) ||
      executeCounterEffect(familyInput) ||
      executeHostedCreditEffect(familyInput) ||
      executeAdvancementEffect(familyInput) ||
      executeDrawEffect(familyInput) ||
      executeTagEffect(familyInput) ||
      executeDamageEffect(familyInput);
    if (handled) {
      if (context.isEffectSuspended?.())
        return {
          publicPayload,
          resolvedEffects,
          creditGainOrdinal,
          suspendedAtEffectIndex: index,
        };
      continue;
    }

    if (executeAgendaScoringEffect(familyInput)) continue;

    executeContextualEffect(familyInput);
    if (context.isEffectSuspended?.())
      return {
        publicPayload,
        resolvedEffects,
        creditGainOrdinal,
        suspendedAtEffectIndex: index,
      };
  }

  return { publicPayload, resolvedEffects, creditGainOrdinal };
}
