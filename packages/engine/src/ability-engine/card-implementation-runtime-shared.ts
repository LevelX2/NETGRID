import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import type {
  CardAbilityImplementation,
  CardConditionImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";
import {
  actionCapacityLegalActionPayloadForEffects,
  type ActionCapacityLegalActionPayload,
} from "./card-implementation-action-capacity";

export function isPrintedCostOnPlayAbility(
  ability: CardAbilityImplementation,
): ability is OnPlayCardAbilityImplementation {
  return (
    ability.kind === "on_play" &&
    (ability.costs === "printed" || ability.costs.kind === "printed")
  );
}

export function onPlayCardImplementationClickCost(
  ability: OnPlayCardAbilityImplementation,
): number {
  return ability.costs === "printed" ? 1 : 1 + ability.costs.additionalClicks;
}

export function printedCostOnPlayImplementation(
  definition: CardDefinition,
): OnPlayCardAbilityImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.abilities?.find(
    isPrintedCostOnPlayAbility,
  );
}

/**
 * Projects direct controller resources from a declarative printed-cost
 * on-play ability into its LegalAction payload. State-bound effects participate
 * only when their payout is completely determined while the action is built.
 *
 * Consumers must use these structured facts instead of inferring economy
 * values from card text. Nested, variable and delayed effects deliberately do
 * not participate here because their payout is not guaranteed by selecting
 * the action alone.
 */
export function deterministicOnPlayResourcePayload(
  definition: CardDefinition,
  controller: "corp" | "runner",
  state?: GameState,
): ActionCapacityLegalActionPayload &
  Record<string, string | number | boolean> {
  const cardImplementation = cardImplementationForDefinitionId(definition.id);
  const implementation = printedCostOnPlayImplementation(definition);

  let gainCreditsAmount = 0;
  let drawCardsAmount = 0;
  let badPublicityAdded = 0;
  const selfDamageEffects = [] as Extract<
    NonNullable<typeof implementation>["effects"][number],
    { kind: "damage" }
  >[];
  for (const effect of implementation?.effects ?? []) {
    if (effect.kind === "add_bad_publicity") {
      badPublicityAdded += Math.max(0, effect.amount);
    }
    if (
      controller === "runner" &&
      effect.kind === "damage" &&
      effect.recipient === "runner"
    ) {
      selfDamageEffects.push(effect);
    }
    const recipientMatchesController =
      "recipient" in effect &&
      (effect.recipient === "controller" || effect.recipient === controller);
    if (!recipientMatchesController) continue;
    if (effect.kind === "gain_credits") {
      gainCreditsAmount += Math.max(0, effect.amount);
    } else if (
      effect.kind === "gain_credits_for_runner_trash_history" &&
      controller === "runner" &&
      state !== undefined
    ) {
      gainCreditsAmount +=
        state.runnerTurnFlags?.trashedAdvertisementThisTurn === true
          ? Math.max(0, effect.advertisementAmount)
          : state.runnerTurnFlags?.trashedTransactionsThisTurn === true
            ? Math.max(0, effect.transactionsAmount)
            : 0;
    } else if (effect.kind === "draw_cards") {
      drawCardsAmount += Math.max(0, effect.amount);
    }
  }

  const actionCapacityPayload = implementation
    ? actionCapacityLegalActionPayloadForEffects(
        implementation.effects,
        controller,
      )
    : {};
  const removeTagsEffect = implementation?.effects.find(
    (effect) => effect.kind === "remove_tags",
  );
  const advancementDistribution = implementation?.effects.find(
    (effect) => effect.kind === "distribute_advancement_counters",
  );
  const makeRunEffect = implementation?.effects.find(
    (effect) => effect.kind === "make_run",
  );
  const utility = cardImplementation?.corpUtility;
  const restrictedCorpInstallPayload =
    controller === "corp" &&
    utility?.kind === "gain_restricted_install_actions" &&
    utility.amount > 0
      ? {
          gainActionsAmount: Math.floor(utility.amount),
          actionCapacityTiming: "immediate" as const,
          actionCapacityRestriction: "install_only" as const,
          actionCapacityAllowedActionType: "install_card",
          actionCapacityReliability: "guaranteed" as const,
          actionCapacityExpiresAt: "side_turn_end" as const,
        }
      : {};
  const selfDamage =
    selfDamageEffects.length > 0 &&
    selfDamageEffects.every(
      (effect) =>
        effect.damageType === selfDamageEffects[0]!.damageType &&
        effect.preventable === selfDamageEffects[0]!.preventable,
    )
      ? {
          damageAmount: selfDamageEffects.reduce(
            (sum, effect) => sum + Math.max(0, effect.amount),
            0,
          ),
          damageType: selfDamageEffects[0]!.damageType,
          preventableDamage: selfDamageEffects[0]!.preventable,
          unpreventableDamage: selfDamageEffects[0]!.preventable === false,
        }
      : undefined;

  return {
    ...(gainCreditsAmount > 0 ? { gainCreditsAmount } : {}),
    ...(drawCardsAmount > 0 ? { drawCardsAmount } : {}),
    ...(badPublicityAdded > 0 ? { badPublicityAdded } : {}),
    ...(selfDamage?.damageAmount ? selfDamage : {}),
    ...(removeTagsEffect
      ? {
          cardImplementationEffectKind: "remove_tags",
          cardImplementationTagMode: removeTagsEffect.mode,
          cardImplementationTagAmount:
            removeTagsEffect.mode === "all"
              ? ("all" as const)
              : (removeTagsEffect.amount ?? 1),
        }
      : {}),
    ...(advancementDistribution
      ? {
          cardImplementationEffectKind: "distribute_advancement_counters",
          advancementCounterAmount: advancementDistribution.amount,
          advancementCounterChoiceMode: advancementDistribution.distribution,
          scoreConversionCapability: "place_advancement",
          scoreConversionAdvancementAmount: advancementDistribution.amount,
          scoreConversionAdvancementMode: advancementDistribution.distribution,
          scoreConversionTargetMode: advancementDistribution.target,
          scoreConversionTiming: "immediate",
        }
      : {}),
    ...(makeRunEffect?.kind === "make_run" &&
    makeRunEffect.followupRunOnEnd === "optional"
      ? { followupRunOnEnd: "optional" }
      : {}),
    ...(makeRunEffect?.kind === "make_run"
      ? {
          ...(makeRunEffect.bypassFirstIce !== undefined
            ? { bypassFirstIce: makeRunEffect.bypassFirstIce }
            : {}),
          ...(makeRunEffect.prohibitNoisyIcebreakers !== undefined
            ? { noNoisyBreakers: makeRunEffect.prohibitNoisyIcebreakers }
            : {}),
          ...(makeRunEffect.runTraceLinkBonus !== undefined
            ? { runTraceLinkBonus: makeRunEffect.runTraceLinkBonus }
            : {}),
          ...(makeRunEffect.corpRezCostSurcharge !== undefined
            ? {
                corpRezCostSurchargeKind:
                  makeRunEffect.corpRezCostSurcharge.kind,
              }
            : {}),
          ...(makeRunEffect.runnerCreditGainOnCorpRez !== undefined
            ? {
                runnerCreditGainOnCorpRez:
                  makeRunEffect.runnerCreditGainOnCorpRez,
              }
            : {}),
          ...(makeRunEffect.damagePreventionPool !== undefined
            ? { damagePreventionPool: makeRunEffect.damagePreventionPool }
            : {}),
          ...(makeRunEffect.eventApproachIceExposeBeforeRez
            ? { eventApproachIceExposeBeforeRez: true }
            : {}),
          ...(makeRunEffect.runTemporaryCredits
            ? { runTemporaryCredits: makeRunEffect.runTemporaryCredits.amount }
            : {}),
          ...(makeRunEffect.afterRunCompletedUnpreventableCoreDamage !==
          undefined
            ? {
                afterRunUnpreventableCoreDamage:
                  makeRunEffect.afterRunCompletedUnpreventableCoreDamage,
              }
            : {}),
        }
      : {}),
    ...actionCapacityPayload,
    ...restrictedCorpInstallPayload,
  };
}

/**
 * Projects direct, unconditional controller credit gains from the canonical
 * on-install lifecycle into the exact install LegalAction. This keeps the
 * Rules Engine as the source of the quote while allowing planners to bind a
 * guaranteed funding step before the card is installed.
 */
export function deterministicOnInstallResourcePayload(
  definition: CardDefinition,
  controller: "corp" | "runner",
): Record<string, number> {
  const effects =
    cardImplementationForDefinitionId(definition.id)?.lifecycle?.on_install ??
    [];
  const gainCreditsAmount = effects.reduce((sum, effect) => {
    if (
      effect.kind !== "gain_credits" ||
      (effect.recipient !== "controller" && effect.recipient !== controller) ||
      !Number.isSafeInteger(effect.amount) ||
      effect.amount <= 0
    ) {
      return sum;
    }
    return sum + effect.amount;
  }, 0);
  return gainCreditsAmount > 0 ? { gainCreditsAmount } : {};
}

/**
 * Evaluates the small declarative condition vocabulary used by migrated cards.
 *
 * Conditions are checked during LegalAction generation and revalidation;
 * unsupported condition kinds fail closed instead of silently becoming legal.
 */
export function cardImplementationConditionMet(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  condition: CardConditionImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  switch (condition.kind) {
    case "runner_is_tagged":
      return state.runner.tags > 0;
    case "source_has_hosted_credits":
      return Boolean(
        sourceCardId &&
        state.cardInstances[sourceCardId] &&
        deps.cardCounter(state, sourceCardId, "bit") > 0,
      );
    case "source_has_advancement_counters":
      return Boolean(
        sourceCardId &&
        state.cardInstances[sourceCardId] &&
        Math.floor(state.cardInstances[sourceCardId].advancementCounters) >=
          condition.minimum,
      );
    case "runner_attempted_run_last_turn":
      return (
        deps.runnerRunAttemptsLastTurn(state) >=
        Math.max(0, condition.minimumRuns)
      );
    case "runner_attempted_run_this_game":
      return (
        deps.runnerRunAttemptsThisGame(state) >=
        Math.max(0, condition.minimumRuns)
      );
    case "runner_trashed_node_last_turn":
      return deps.runnerTrashedNodeLastTurn(state);
    case "runner_trashed_advertisement_this_turn":
      return deps.runnerTrashedAdvertisementThisTurn(state);
    case "runner_trashed_transactions_this_turn":
      return deps.runnerTrashedTransactionsThisTurn(state);
    case "runner_installed_resource_last_turn":
      return deps.runnerInstalledResourceLastTurn(state);
    case "runner_damaged_during_last_three_actions":
      return deps.runnerWasDamagedDuringLastThreeActions(state);
    case "runner_liberated_agenda_subtype_this_turn":
      return deps.runnerLiberatedAgendaSubtypeThisTurn(
        state,
        condition.subtype,
      );
    case "corp_scored_agenda_subtype_last_turn":
      return deps.corpScoredAgendaSubtypeLastTurn(state, condition.subtype);
    case "runner_made_successful_run_on_server_this_turn":
      return deps.runnerMadeSuccessfulRunOnServerThisTurn(
        state,
        condition.server,
      );
    case "runner_made_successful_hq_and_rd_runs_this_turn":
      return (
        deps.runnerMadeSuccessfulRunOnServerThisTurn(state, "hq") &&
        deps.runnerMadeSuccessfulRunOnServerThisTurn(state, "rd")
      );
    case "corp_rezzed_black_ice_this_turn": {
      const target = state.runnerTurnFlags?.lastRezzedBlackIceThisTurn;
      const instance = target ? state.cardInstances[target.cardId] : undefined;
      if (
        !target ||
        !instance ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverIce" ||
        instance.zone.serverId !== target.serverId ||
        instance.rezzed !== true
      )
        return false;
      const definition = deps.definitionFor(state, target.cardId);
      return (
        definition.id === target.definitionId &&
        definition.type === "ice" &&
        hasNormalizedSubtype(definition.subtypes, "black_ice")
      );
    }
    case "current_encounter_ice":
      return (
        state.timingPoint === "run.encounter_ice" &&
        state.run?.phase === "encounter_ice" &&
        Boolean(state.run.encounteredIceId)
      );
    case "current_encounter_ice_subtype": {
      if (
        state.timingPoint !== "run.encounter_ice" ||
        state.run?.phase !== "encounter_ice" ||
        !state.run.encounteredIceId
      )
        return false;
      return deps
        .definitionFor(state, state.run.encounteredIceId)
        .subtypes.includes(condition.subtype);
    }
    case "current_run_server":
      return (
        (state.run?.accessServerOverride ?? state.run?.attackedServerId) ===
        condition.server
      );
    default: {
      const unknownCondition = condition as { kind?: string };
      throw new Error(
        `Unsupported card implementation condition: ${
          unknownCondition.kind ?? "unknown"
        }`,
      );
    }
  }
}

export function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function hasNormalizedSubtype(
  subtypes: readonly string[] | undefined,
  subtype: string,
): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return (
    subtypes?.some(
      (candidate) => normalizeSubtypeLabel(candidate) === target,
    ) ?? false
  );
}
