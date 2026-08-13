import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import {
  activatedAbilityLegalActionCosts,
  canPayActivatedCardImplementationCosts,
} from "./card-implementation-runtime-activated-costs";
import {
  activatedAbilityPayload,
  copySameFortIceSubroutineEffect,
  doubleChosenIceStrengthEffect,
  distributeAdvancementCountersEffect,
  exposeInstalledCardEffect,
  moveTopTrashToGripEffect,
  moveTopHostedProgramToGripEffect,
  ownRezzedIceTargetIds,
  rezzedInstalledIceTargetIds,
  sameFortSubroutineTargets,
  transferHostedCreditsEffect,
  transferHostedCreditsMaximum,
  trashOwnRezzedIceForCreditsEffect,
} from "./card-implementation-runtime-activated-targets";
import { canResolveActivatedCardImplementationAbility } from "./card-implementation-runtime-legality";
import { cardImplementationConditionMet } from "./card-implementation-runtime-shared";
import {
  activatedAbilityAtTiming,
  additionalTimingCondition,
  type ActivatedCardAbilityImplementation,
} from "./definition-types";
import {
  abilityRefForActivatedBinding,
  activatedAbilityBindingsForDefinition,
  type ActivatedAbilityBinding,
} from "./card-capability-binding";

export function activatedCardImplementationAbilitiesForTiming(
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): readonly ActivatedAbilityBinding[] {
  return activatedAbilityBindingsForDefinition(definition).filter(
    (binding) =>
      activatedAbilityAtTiming(binding.ability, timing) !== undefined,
  );
}

/**
 * Adds LegalActions for active declarative abilities on an already-valid source.
 *
 * This is action construction only. The same source, timing, condition, cost,
 * and limit rules are checked again by resolveActivatedCardImplementationAbility
 * before any click is spent or effect mutates state.
 */
export function pushActivatedCardImplementationActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
  options: { canStartRun?: boolean } = {},
): void {
  const timings =
    side === "corp"
      ? (["corp_main", "corp_paid"] as const)
      : (["runner_main", "runner_paid"] as const);
  for (const timing of timings) {
    pushActivatedCardImplementationActionsForTiming(
      deps,
      state,
      actions,
      side,
      sourceCardId,
      definition,
      timing,
      options,
    );
  }
}

export function pushActivatedCardImplementationActionsForTiming(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
  options: { canStartRun?: boolean } = {},
): void {
  if (deps.mustInstance(state.cardInstances, sourceCardId).controller !== side)
    return;
  for (const binding of activatedCardImplementationAbilitiesForTiming(
    definition,
    timing,
  )) {
    const ability = activatedAbilityAtTiming(binding.ability, timing);
    if (!ability)
      throw new Error("Die aktivierte Fähigkeit besitzt dieses Timing nicht.");
    const createBoundAction = (
      label: string,
      payload: Record<string, string | number | boolean>,
    ): LegalAction => {
      const abilityRef = abilityRefForActivatedBinding(sourceCardId, binding);
      return {
        ...deps.createAction(
          state,
          side,
          "activated_card_ability",
          label,
          sourceCardId,
          activatedAbilityLegalActionCosts(ability),
          payload,
        ),
        ...(abilityRef ? { abilityRef } : {}),
      };
    };
    if (
      side === "runner" &&
      options.canStartRun === false &&
      ability.effects.some((effect) => effect.kind === "make_run")
    )
      continue;
    if (
      !canResolveActivatedCardImplementationAbility(
        deps,
        state,
        ability,
        sourceCardId,
      )
    )
      continue;
    const timingCondition = additionalTimingCondition(binding.ability, timing);
    if (
      timingCondition !== undefined &&
      !cardImplementationConditionMet(
        deps,
        state,
        timingCondition,
        sourceCardId,
      )
    )
      continue;
    if (
      !canPayActivatedCardImplementationCosts(
        state,
        side,
        sourceCardId,
        ability,
      )
    )
      continue;
    const exposeEffect = exposeInstalledCardEffect(ability);
    if (exposeEffect) {
      if (
        deps.exposeInstalledCorpCardTargets(state, exposeEffect.scope)
          .length === 0
      )
        continue;
      actions.push(
        createBoundAction(
          ability.label ??
            `${definition.title}: installierte Korp-Karte exposen`,
          activatedAbilityPayload(sourceCardId, ability, binding),
        ),
      );
      continue;
    }
    const moveTopTrashEffect = moveTopTrashToGripEffect(ability);
    if (moveTopTrashEffect) {
      const targetCardId = deps.topTrashToGripTargetId(state);
      if (!targetCardId) continue;
      const targetDefinition = deps.definitionFor(state, targetCardId);
      actions.push(
        createBoundAction(
          ability.label ?? `${definition.title}: Fähigkeit nutzen`,
          {
            ...activatedAbilityPayload(sourceCardId, ability, binding),
            cardImplementationTopTrashTargetId: targetCardId,
            targetCardId,
            targetDefinitionId: targetDefinition.id,
          },
        ),
      );
      continue;
    }
    const moveTopHostedProgramEffect =
      moveTopHostedProgramToGripEffect(ability);
    if (moveTopHostedProgramEffect) {
      actions.push(
        createBoundAction(
          ability.label ??
            `${definition.title}: oberstes gesichertes Programm auf die Hand nehmen`,
          activatedAbilityPayload(sourceCardId, ability, binding),
        ),
      );
      continue;
    }
    const trashRezzedIceEffect = trashOwnRezzedIceForCreditsEffect(ability);
    if (trashRezzedIceEffect) {
      for (const targetCardId of ownRezzedIceTargetIds(state)) {
        const targetDefinition = deps.definitionFor(state, targetCardId);
        actions.push(
          createBoundAction(
            `${definition.title}: ${targetDefinition.title} trashen`,
            {
              ...activatedAbilityPayload(sourceCardId, ability, binding),
              targetCardId,
              targetDefinitionId: targetDefinition.id,
              gainedCredits: trashRezzedIceEffect.gainCredits,
            },
          ),
        );
      }
      continue;
    }
    const copySubroutineEffect = copySameFortIceSubroutineEffect(ability);
    if (copySubroutineEffect) {
      for (const target of sameFortSubroutineTargets(
        deps,
        state,
        sourceCardId,
      )) {
        actions.push(
          createBoundAction(
            `${definition.title}: ${target.iceDefinition.title} Subroutine kopieren`,
            {
              ...activatedAbilityPayload(sourceCardId, ability, binding),
              targetCardId: target.iceId,
              targetDefinitionId: target.iceDefinition.id,
              subroutineIndex: target.subroutineIndex,
              subroutineId: target.subroutineId,
            },
          ),
        );
      }
      continue;
    }
    const doubleIceStrengthEffect = doubleChosenIceStrengthEffect(ability);
    if (doubleIceStrengthEffect) {
      for (const targetCardId of rezzedInstalledIceTargetIds(state)) {
        const targetDefinition = deps.definitionFor(state, targetCardId);
        actions.push(
          createBoundAction(
            `${definition.title}: ${targetDefinition.title} stärken`,
            {
              ...activatedAbilityPayload(sourceCardId, ability, binding),
              targetCardId,
              targetDefinitionId: targetDefinition.id,
            },
          ),
        );
      }
      continue;
    }
    const distributeAdvancementEffect =
      distributeAdvancementCountersEffect(ability);
    if (
      distributeAdvancementEffect?.target === "installed_advanceable_cards" &&
      deps.installedAdvanceableCorpCardTargetCount(state) === 0
    )
      continue;
    const moveAdvancementEffect = ability.effects.find(
      (effect) => effect.kind === "move_advancement_counters",
    );
    if (
      moveAdvancementEffect?.kind === "move_advancement_counters" &&
      deps.moveAdvancementCounterOptionCount(
        state,
        sourceCardId,
        moveAdvancementEffect.source,
        moveAdvancementEffect.maxAmount,
        moveAdvancementEffect.minimumAmount ?? 1,
      ) === 0
    )
      continue;
    const transferEffect = transferHostedCreditsEffect(ability);
    if (transferEffect) {
      const maximum = transferHostedCreditsMaximum(
        deps,
        state,
        sourceCardId,
        ability,
      );
      for (
        let amount = transferEffect.amount.min;
        amount <= maximum;
        amount += 1
      ) {
        actions.push(
          createBoundAction(
            `${definition.title}: ${amount} Bit${amount === 1 ? "" : "s"} ${
              transferEffect.direction === "controller_to_source"
                ? "einlagern"
                : "entnehmen"
            }`,
            {
              ...activatedAbilityPayload(sourceCardId, ability, binding, state),
              cardImplementationEffectKind: "transfer_hosted_credits",
              hostedCreditTransferDirection: transferEffect.direction,
              hostedCreditTransferAmount: amount,
              xValue: amount,
            },
          ),
        );
      }
      continue;
    }
    actions.push(
      createBoundAction(
        ability.label ?? `${definition.title}: Fähigkeit nutzen`,
        activatedAbilityPayload(sourceCardId, ability, binding, state),
      ),
    );
  }
}
