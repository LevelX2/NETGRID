import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { printedSubroutinesForCardImplementation } from "./printed-subroutine-implementations";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import {
  advancementCounterCostForActivatedAbility,
  hasTapSourceCostForActivatedAbility,
  hasTrashSourceCostForActivatedAbility,
  randomCorpHqDiscardCostForActivatedAbility,
  sourceCounterCostsForActivatedAbility,
} from "./card-implementation-runtime-activated-costs";
import type {
  ActivatedCardAbilityImplementation,
  CardEffectImplementation,
} from "./definition-types";

export function activatedAbilityPayload(
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
  abilityIndex: number,
  state?: GameState,
): Record<string, string | number | boolean> {
  const advancementCounterCreditPayout =
    gainCreditsPerAdvancementCounterOnSourceEffect(ability);
  const hostedCreditAddAmount = hostedCreditAddAmountForActivatedAbility(
    ability,
  );
  const hostedCreditTakeEffect = hostedCreditTakeEffectForActivatedAbility(
    ability,
  );
  const hostedCreditTakeAmount = hostedCreditTakeAmountForActivatedAbility(
    ability,
  );
  return {
    cardId,
    cardImplementationAbility: "activated",
    cardImplementationAbilityIndex: abilityIndex,
    cardImplementationAbilityTiming: ability.timing,
    ...(ability.label ? { cardImplementationAbilityLabel: ability.label } : {}),
    ...(hostedCreditTakeAmount > 0
      ? { gainCreditsAmount: hostedCreditTakeAmount }
      : {}),
    ...(hostedCreditAddAmount > 0
      ? {
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: hostedCreditAddAmount,
        }
      : {}),
    ...(hostedCreditTakeEffect
      ? {
          cardImplementationTakesHostedCredits: true,
          ...(hostedCreditTakeEffect.amount !== undefined
            ? { hostedCreditTakeAmount: hostedCreditTakeEffect.amount }
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
    ...(advancementCounterCreditPayout
      ? {
          cardImplementationEconomyKind:
            "gain_credits_per_advancement_counter_on_source",
          cardImplementationAmountPerAdvancementCounter:
            advancementCounterCreditPayout.amountPerCounter,
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

export function rezzedInstalledIceTargetIds(state: GameState): CardInstanceId[] {
  return ownRezzedIceTargetIds(state);
}

export type SameFortSubroutineTarget = {
  iceId: CardInstanceId;
  iceDefinition: CardDefinition;
  subroutineIndex: number;
  subroutineId: string;
  subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
  amount?: number;
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
    const subroutines =
      printedSubroutinesForCardImplementation(definition) ??
      definition.subroutines ??
      [];
    subroutines.forEach((subroutine, subroutineIndex) => {
      if (
        subroutine.type !== "end_the_run" &&
        subroutine.type !== "end_the_run_unless_runner_pays"
      )
        return;
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
        subroutineKind: subroutine.type,
        ...(subroutine.type === "end_the_run_unless_runner_pays"
          ? { amount: subroutine.amount }
          : {}),
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
