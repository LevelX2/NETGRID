import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  SubroutineDefinition,
} from "@netgrid/shared";
import { effectiveIceRunSubroutines } from "../game/run/effective-ice-run-subroutines";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import {
  advancementCounterCostForActivatedAbility,
  creditCostForActivatedAbility,
  hasTapSourceCostForActivatedAbility,
  hasTrashSourceCostForActivatedAbility,
  randomCorpHqDiscardCostForActivatedAbility,
  sourceCounterCostsForActivatedAbility,
} from "./card-implementation-runtime-activated-costs";
import type {
  ActivatedCardAbilityImplementation,
  CardEffectImplementation,
} from "./definition-types";
import { actionCapacityLegalActionPayloadForEffects } from "./card-implementation-action-capacity";
import {
  activatedAbilityBindingPayload,
  type ActivatedAbilityBinding,
} from "./card-capability-binding";

export function activatedAbilityPayload(
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
  binding: ActivatedAbilityBinding,
  state?: GameState,
  offeredTiming: ActivatedCardAbilityImplementation["timing"] = ability.timing,
): Record<string, string | number | boolean> {
  const advancementCounterCreditPayout =
    gainCreditsPerAdvancementCounterOnSourceEffect(ability);
  const visibleAdvancementCounterCount =
    state?.cardInstances[cardId]?.advancementCounters;
  const advancementCounterCreditGain =
    advancementCounterCreditPayout &&
    Number.isSafeInteger(visibleAdvancementCounterCount) &&
    (visibleAdvancementCounterCount as number) >= 0 &&
    Number.isSafeInteger(
      (visibleAdvancementCounterCount as number) *
        advancementCounterCreditPayout.amountPerCounter,
    )
      ? (visibleAdvancementCounterCount as number) *
        advancementCounterCreditPayout.amountPerCounter
      : undefined;
  const hostedCreditAddAmount =
    hostedCreditAddAmountForActivatedAbility(ability);
  const hostedCreditTakeEffect =
    hostedCreditTakeEffectForActivatedAbility(ability);
  const configuredHostedCreditTakeAmount =
    hostedCreditTakeAmountForActivatedAbility(ability);
  const availableHostedCredits = hostedCreditsOnSource(state, cardId);
  const hostedCreditTakeAmount = effectiveHostedCreditTakeAmount(
    hostedCreditTakeEffect,
    configuredHostedCreditTakeAmount,
    availableHostedCredits,
  );
  const hostedCreditCashOutMaxUses = hostedCreditCashOutMaxUsesFromState(
    ability,
    hostedCreditTakeEffect,
    configuredHostedCreditTakeAmount,
    availableHostedCredits,
  );
  const directCreditGain = ability.effects.reduce(
    (sum, effect) =>
      effect.kind === "gain_credits" &&
      (effect.recipient === "runner" || effect.recipient === "controller")
        ? sum + effect.amount
        : sum,
    0,
  );
  const controller = state?.cardInstances[cardId]?.controller;
  const directCardDraw = ability.effects.reduce(
    (sum, effect) =>
      effect.kind === "draw_cards" &&
      (effect.recipient === "controller" ||
        (controller !== undefined && effect.recipient === controller))
        ? sum + effect.amount
        : sum,
    0,
  );
  const advancementDistribution = distributeAdvancementCountersEffect(ability);
  const advancementMove = ability.effects.find(
    (effect) => effect.kind === "move_advancement_counters",
  );
  const scoreConversionPayload = scoreConversionCapabilityPayloadForEffects(
    ability.effects,
  );
  const actionCapacityPayload = actionCapacityLegalActionPayloadForEffects(
    ability.effects,
    state?.cardInstances[cardId]?.controller ?? "corp",
  );
  const scoresSourceAsAgenda = ability.effects.some(
    (effect) => effect.kind === "score_source_as_agenda",
  );
  const makeRunEffect = ability.effects.find(
    (effect) => effect.kind === "make_run",
  );
  const stackToGripSearchEffect = ability.effects.find(
    (effect) => effect.kind === "search_stack_to_grip",
  );
  const removeTagsEffect = ability.effects.find(
    (effect) => effect.kind === "remove_tags",
  );
  const moveTopTrashEffect = moveTopTrashToGripEffect(ability);
  return {
    cardId,
    cardImplementationAbility: "activated",
    ...activatedAbilityBindingPayload(binding),
    cardImplementationAbilityTiming: offeredTiming,
    ...(ability.label ? { cardImplementationAbilityLabel: ability.label } : {}),
    ...(hostedCreditTakeAmount +
      directCreditGain +
      (advancementCounterCreditGain ?? 0) >
    0
      ? {
          gainCreditsAmount:
            hostedCreditTakeAmount +
            directCreditGain +
            (advancementCounterCreditGain ?? 0),
        }
      : {}),
    ...(directCardDraw > 0 ? { drawCardsAmount: directCardDraw } : {}),
    ...(hostedCreditAddAmount > 0
      ? {
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: hostedCreditAddAmount,
        }
      : {}),
    ...(hostedCreditTakeEffect
      ? {
          cardImplementationTakesHostedCredits: true,
          ...(hostedCreditTakeAmount > 0 ? { hostedCreditTakeAmount } : {}),
          ...(hostedCreditCashOutMaxUses !== undefined
            ? {
                cardImplementationHostedCreditCashOutMaxUses:
                  hostedCreditCashOutMaxUses,
              }
            : {}),
          ...(hostedCreditTakeEffect.mode !== undefined
            ? { hostedCreditTakeMode: hostedCreditTakeEffect.mode }
            : {}),
        }
      : {}),
    ...(advancementCounterCostForActivatedAbility(ability) > 0
      ? {
          cardImplementationAdvancementCounterCost:
            advancementCounterCostForActivatedAbility(ability),
        }
      : {}),
    ...sourceCounterCostsForActivatedAbility(ability).reduce<
      Record<string, string | number | boolean>
    >((payload, cost) => {
      payload.cardImplementationSourceCounterType = cost.counterType;
      payload.cardImplementationSourceCounterCost = cost.amount;
      return payload;
    }, {}),
    ...(hasTrashSourceCostForActivatedAbility(ability)
      ? { cardImplementationTrashSourceCost: true }
      : {}),
    ...(hasTapSourceCostForActivatedAbility(ability)
      ? { cardImplementationTapSourceCost: true }
      : {}),
    ...(hasTrashSourceEffectForActivatedAbility(ability)
      ? { cardImplementationTrashesSource: true }
      : {}),
    ...(advancementCounterCreditPayout
      ? {
          cardImplementationEconomyKind:
            "gain_credits_per_advancement_counter_on_source",
          cardImplementationAmountPerAdvancementCounter:
            advancementCounterCreditPayout.amountPerCounter,
          ...(advancementCounterCreditGain !== undefined
            ? {
                advancementCounterCount:
                  visibleAdvancementCounterCount as number,
              }
            : {}),
          cardImplementationTrashesSource:
            hasTrashSourceEffectForActivatedAbility(ability),
        }
      : {}),
    ...(randomCorpHqDiscardCostForActivatedAbility(ability) > 0
      ? {
          cardImplementationRandomHqDiscardCost:
            randomCorpHqDiscardCostForActivatedAbility(ability),
        }
      : {}),
    ...(scoresSourceAsAgenda
      ? { cardImplementationScoresSourceAsAgenda: true }
      : {}),
    ...(advancementDistribution
      ? {
          cardImplementationEffectKind: "distribute_advancement_counters",
          advancementCounterAmount: advancementDistribution.amount,
          advancementCounterChoiceMode: advancementDistribution.distribution,
        }
      : {}),
    ...(advancementMove
      ? {
          cardImplementationEffectKind: "move_advancement_counters",
          advancementCounterMoveMaximum: advancementMove.maxAmount,
          advancementCounterMoveSource: advancementMove.source,
          advancementCounterMoveTarget: advancementMove.target,
        }
      : {}),
    ...(makeRunEffect?.kind === "make_run"
      ? makeRunLegalActionProjectionPayload(makeRunEffect)
      : {}),
    ...(stackToGripSearchEffect?.kind === "search_stack_to_grip"
      ? {
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: stackToGripSearchEffect.filter,
        }
      : {}),
    ...(removeTagsEffect?.kind === "remove_tags"
      ? {
          cardImplementationEffectKind: "remove_tags",
          cardImplementationTagMode: removeTagsEffect.mode,
          cardImplementationTagAmount:
            removeTagsEffect.mode === "all"
              ? ("all" as const)
              : (removeTagsEffect.amount ?? 1),
        }
      : {}),
    ...(moveTopTrashEffect
      ? { cardImplementationEffectKind: "move_top_trash_to_grip" }
      : {}),
    ...scoreConversionPayload,
    ...actionCapacityPayload,
    ...(ability.timing === "runner_cost_penalty_support" &&
    state?.runnerCostPenaltySupportWindow
      ? {
          costPenaltySupportWindowId:
            state.runnerCostPenaltySupportWindow.windowId,
          costPenaltySupportOriginalActionId:
            state.runnerCostPenaltySupportWindow.originalActionId,
          costPenaltySupportAmountDue:
            state.runnerCostPenaltySupportWindow.amountDue,
          costPenaltySupportKind: state.runnerCostPenaltySupportWindow.kind,
        }
      : {}),
  };
}

function hostedCreditsOnSource(
  state: GameState | undefined,
  cardId: CardInstanceId,
): number | undefined {
  const amount = state?.cardInstances[cardId]?.counters?.bit;
  return typeof amount === "number" && Number.isFinite(amount)
    ? Math.max(0, Math.floor(amount))
    : undefined;
}

function effectiveHostedCreditTakeAmount(
  effect:
    | Extract<CardEffectImplementation, { kind: "take_hosted_credits" }>
    | undefined,
  configuredAmount: number,
  availableAmount: number | undefined,
): number {
  if (!effect) return 0;
  if (effect.mode === "all") return availableAmount ?? configuredAmount;
  if (availableAmount === undefined) return configuredAmount;
  return Math.min(configuredAmount, availableAmount);
}

function hostedCreditCashOutMaxUsesFromState(
  ability: ActivatedCardAbilityImplementation,
  effect:
    | Extract<CardEffectImplementation, { kind: "take_hosted_credits" }>
    | undefined,
  configuredAmount: number,
  availableAmount: number | undefined,
): number | undefined {
  if (!effect || availableAmount === undefined || availableAmount <= 0) {
    return undefined;
  }
  if (ability.limit !== undefined || effect.mode === "all") return 1;
  if (!Number.isSafeInteger(configuredAmount) || configuredAmount <= 0) {
    return undefined;
  }
  return Math.max(1, Math.floor(availableAmount / configuredAmount));
}

function makeRunLegalActionProjectionPayload(
  effect: Extract<CardEffectImplementation, { kind: "make_run" }>,
): Record<string, string | number | boolean> {
  const targetServerId =
    effect.target.kind === "central_server" ? effect.target.server : undefined;
  return {
    cardImplementationEffectKind: "make_run",
    runActionKind: "make_run",
    ...(targetServerId
      ? { serverId: targetServerId, runServerId: targetServerId }
      : { runTargetChoiceRequired: true }),
    ...(effect.accessServerOverride
      ? { accessServerId: effect.accessServerOverride }
      : {}),
    ...(effect.successfulRunServerOverride
      ? { successfulRunServerId: effect.successfulRunServerOverride }
      : {}),
    ...(effect.successfulRunAccessReplacement
      ? {
          successfulRunAccessReplacement: effect.successfulRunAccessReplacement,
        }
      : {}),
    ...(effect.successfulRunPrivateLookCount !== undefined
      ? { successfulRunPrivateLookCount: effect.successfulRunPrivateLookCount }
      : {}),
    ...(effect.accessCount !== undefined
      ? { runAccessCount: effect.accessCount }
      : {}),
    ...(effect.bypassFirstIce !== undefined
      ? { bypassFirstIce: effect.bypassFirstIce }
      : {}),
    ...(effect.prohibitNoisyIcebreakers !== undefined
      ? { noNoisyBreakers: effect.prohibitNoisyIcebreakers }
      : {}),
    ...(effect.runTraceLinkBonus !== undefined
      ? { runTraceLinkBonus: effect.runTraceLinkBonus }
      : {}),
    ...(effect.runTemporaryCredits
      ? { runTemporaryCredits: effect.runTemporaryCredits.amount }
      : {}),
    ...(effect.conditionalAccessBonus
      ? {
          conditionalAccessBonusKind: effect.conditionalAccessBonus.kind,
          conditionalAccessBonusAmount: effect.conditionalAccessBonus.amount,
        }
      : {}),
  };
}

export function transferHostedCreditsEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<CardEffectImplementation, { kind: "transfer_hosted_credits" }>
  | undefined {
  return ability.effects.find(
    (effect) => effect.kind === "transfer_hosted_credits",
  ) as
    | Extract<CardEffectImplementation, { kind: "transfer_hosted_credits" }>
    | undefined;
}

export function transferHostedCreditsMaximum(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  sourceCardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
): number {
  const effect = transferHostedCreditsEffect(ability);
  if (!effect) return 0;
  if (effect.direction === "source_to_controller")
    return Math.max(0, deps.cardCounter(state, sourceCardId, "bit"));
  const controller = deps.mustInstance(
    state.cardInstances,
    sourceCardId,
  ).controller;
  const reserved =
    controller === "corp"
      ? Math.max(
          0,
          Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
        )
      : 0;
  const credits =
    controller === "corp" ? state.corp.credits : state.runner.credits;
  return Math.max(
    0,
    credits - reserved - creditCostForActivatedAbility(ability),
  );
}

export function scoreConversionCapabilityPayloadForEffects(
  effects: readonly CardEffectImplementation[],
): Record<string, string | number | boolean> {
  const advancementDistribution = effects.find(
    (effect) => effect.kind === "distribute_advancement_counters",
  );
  if (advancementDistribution?.kind === "distribute_advancement_counters") {
    return {
      scoreConversionCapability: "place_advancement",
      scoreConversionAdvancementAmount: advancementDistribution.amount,
      scoreConversionAdvancementMode: advancementDistribution.distribution,
      scoreConversionTargetMode: advancementDistribution.target,
      scoreConversionTiming: "immediate",
    };
  }
  const advancementMove = effects.find(
    (effect) => effect.kind === "move_advancement_counters",
  );
  if (advancementMove?.kind === "move_advancement_counters") {
    return {
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: advancementMove.maxAmount,
      scoreConversionSourceMode: advancementMove.source,
      scoreConversionTargetMode: advancementMove.target,
      scoreConversionTiming: "immediate",
    };
  }
  const actionGainAmount = effects.reduce(
    (sum, effect) =>
      effect.kind === "gain_actions" &&
      (effect.recipient === "corp" || effect.recipient === "controller")
        ? sum + effect.amount
        : sum,
    0,
  );
  return actionGainAmount > 0
    ? {
        scoreConversionCapability: "gain_action_capacity",
        scoreConversionTiming: "immediate",
      }
    : {};
}

export function gainCreditsPerAdvancementCounterOnSourceEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "gain_credits_per_advancement_counter_on_source" }
    >
  | undefined {
  return ability.effects.find(
    (effect) =>
      effect.kind === "gain_credits_per_advancement_counter_on_source" &&
      (effect.recipient === "controller" || effect.recipient === "corp"),
  ) as
    | Extract<
        CardEffectImplementation,
        { kind: "gain_credits_per_advancement_counter_on_source" }
      >
    | undefined;
}

export function hostedCreditTakeAmountForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const amount = ability.effects
    .filter((effect) => effect.kind === "take_hosted_credits")
    .reduce((total, effect) => total + Number(effect.amount ?? 0), 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function hostedCreditAddAmountForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const amount = ability.effects
    .filter((effect) => effect.kind === "add_hosted_credits")
    .reduce((total, effect) => total + effect.amount, 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function hostedCreditTakeEffectForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<CardEffectImplementation, { kind: "take_hosted_credits" }>
  | undefined {
  return ability.effects.find(
    (effect) => effect.kind === "take_hosted_credits",
  ) as
    | Extract<CardEffectImplementation, { kind: "take_hosted_credits" }>
    | undefined;
}

export function hasTrashSourceEffectForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.effects.some((effect) => effect.kind === "trash_source");
}

export function exposeInstalledCardEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<CardEffectImplementation, { kind: "expose_installed_card" }>
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "expose_installed_card"
    ? ability.effects[0]
    : undefined;
}

export function moveTopTrashToGripEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<CardEffectImplementation, { kind: "move_top_trash_to_grip" }>
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "move_top_trash_to_grip"
    ? ability.effects[0]
    : undefined;
}

export function moveTopHostedProgramToGripEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "move_top_hosted_program_to_grip" }
    >
  | undefined {
  const effect = ability.effects[0];
  return effect?.kind === "move_top_hosted_program_to_grip"
    ? effect
    : undefined;
}

export function trashOwnRezzedIceForCreditsEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "trash_own_rezzed_ice_for_credits" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "trash_own_rezzed_ice_for_credits"
    ? ability.effects[0]
    : undefined;
}

export function copySameFortIceSubroutineEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "copy_same_fort_ice_subroutine_for_run" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "copy_same_fort_ice_subroutine_for_run"
    ? ability.effects[0]
    : undefined;
}

export function doubleChosenIceStrengthEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "double_chosen_ice_strength_until_end_of_turn" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "double_chosen_ice_strength_until_end_of_turn"
    ? ability.effects[0]
    : undefined;
}

export function distributeAdvancementCountersEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "distribute_advancement_counters" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "distribute_advancement_counters"
    ? ability.effects[0]
    : undefined;
}

export function ownRezzedIceTargetIds(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .flatMap((server) => server.ice)
    .filter((cardId): cardId is CardInstanceId => {
      const instance = state.cardInstances[cardId];
      return Boolean(
        instance &&
        instance.controller === "corp" &&
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverIce" &&
        instance.rezzed === true,
      );
    })
    .sort();
}

export function rezzedInstalledIceTargetIds(
  state: GameState,
): CardInstanceId[] {
  return ownRezzedIceTargetIds(state);
}

export type SameFortSubroutineTarget = {
  iceId: CardInstanceId;
  iceDefinition: CardDefinition;
  subroutineIndex: number;
  subroutineId: string;
  subroutine: SubroutineDefinition;
};

export function sourceServerId(
  state: GameState,
  sourceCardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const source = state.cardInstances[sourceCardId];
  return source?.zone.side === "corp" && source.zone.zone === "serverRoot"
    ? source.zone.serverId
    : undefined;
}

export function sameFortSubroutineTargets(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  sourceCardId: CardInstanceId | undefined,
): SameFortSubroutineTarget[] {
  if (!sourceCardId || !state.run) return [];
  const serverId = sourceServerId(state, sourceCardId);
  if (!serverId || state.run.attackedServerId !== serverId) return [];
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return [];
  const targets: SameFortSubroutineTarget[] = [];
  for (const iceId of server.ice.slice().sort()) {
    const instance = state.cardInstances[iceId];
    if (!instance || instance.controller !== "corp") continue;
    const definition = deps.definitionFor(state, iceId);
    const subroutines = effectiveIceRunSubroutines(state, iceId, definition);
    subroutines.forEach((subroutine, subroutineIndex) => {
      if (
        state.run?.encounterAdditionalSubroutines?.some(
          (record) =>
            record.sourceCardInstanceId === sourceCardId &&
            record.targetIceId === iceId &&
            record.originalSubroutineId === subroutine.id,
        )
      )
        return;
      targets.push({
        iceId,
        iceDefinition: definition,
        subroutineIndex,
        subroutineId: subroutine.id,
        subroutine,
      });
    });
  }
  return targets;
}

export function sameFortSubroutineTargetForLegalAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): SameFortSubroutineTarget | undefined {
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  const subroutineIndex = Number(legalAction.payload?.subroutineIndex);
  const subroutineId = String(legalAction.payload?.subroutineId ?? "");
  if (
    !targetCardId ||
    !Number.isInteger(subroutineIndex) ||
    subroutineIndex < 0
  )
    return undefined;
  return sameFortSubroutineTargets(deps, state, sourceCardId).find(
    (target) =>
      target.iceId === targetCardId &&
      target.subroutineIndex === subroutineIndex &&
      target.subroutineId === subroutineId,
  );
}
