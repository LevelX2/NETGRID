import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
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
  ownRezzedIceTargetIds,
  rezzedInstalledIceTargetIds,
  sameFortSubroutineTargets,
  trashOwnRezzedIceForCreditsEffect,
} from "./card-implementation-runtime-activated-targets";
import { canResolveActivatedCardImplementationAbility } from "./card-implementation-runtime-legality";
import type { ActivatedCardAbilityImplementation } from "./definition-types";

export function activatedCardImplementationAbilitiesForTiming(
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): Array<{ ability: ActivatedCardAbilityImplementation; index: number }> {
  const implementation = cardImplementationForDefinitionId(definition.id);
  return (
    implementation?.abilities
      ?.map((ability, index) => ({ ability, index }))
      .filter(
        (
          entry,
        ): entry is {
          ability: ActivatedCardAbilityImplementation;
          index: number;
        } =>
          entry.ability.kind === "activated" && entry.ability.timing === timing,
      ) ?? []
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
): void {
  const timing = side === "corp" ? "corp_main" : "runner_main";
  pushActivatedCardImplementationActionsForTiming(
    deps,
    state,
    actions,
    side,
    sourceCardId,
    definition,
    timing,
  );
}

export function pushActivatedCardImplementationActionsForTiming(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): void {
  if (deps.mustInstance(state.cardInstances, sourceCardId).controller !== side)
    return;
  for (const {
    ability,
    index,
  } of activatedCardImplementationAbilitiesForTiming(definition, timing)) {
    if (
      !canResolveActivatedCardImplementationAbility(
        deps,
        state,
        ability,
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
        deps.createAction(
          state,
          side,
          "activated_card_ability",
          ability.label ??
            `${definition.title}: installierte Korp-Karte exposen`,
          sourceCardId,
          activatedAbilityLegalActionCosts(ability),
          activatedAbilityPayload(sourceCardId, ability, index),
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
        deps.createAction(
          state,
          side,
          "activated_card_ability",
          ability.label ?? `${definition.title}: Fähigkeit nutzen`,
          sourceCardId,
          activatedAbilityLegalActionCosts(ability),
          {
            ...activatedAbilityPayload(sourceCardId, ability, index),
            cardImplementationTopTrashTargetId: targetCardId,
            targetDefinitionId: targetDefinition.id,
          },
        ),
      );
      continue;
    }
    const trashRezzedIceEffect = trashOwnRezzedIceForCreditsEffect(ability);
    if (trashRezzedIceEffect) {
      for (const targetCardId of ownRezzedIceTargetIds(state)) {
        const targetDefinition = deps.definitionFor(state, targetCardId);
        actions.push(
          deps.createAction(
            state,
            side,
            "activated_card_ability",
            `${definition.title}: ${targetDefinition.title} trashen`,
            sourceCardId,
            activatedAbilityLegalActionCosts(ability),
            {
              ...activatedAbilityPayload(sourceCardId, ability, index),
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
          deps.createAction(
            state,
            side,
            "activated_card_ability",
            `${definition.title}: ${target.iceDefinition.title} Subroutine kopieren`,
            sourceCardId,
            activatedAbilityLegalActionCosts(ability),
            {
              ...activatedAbilityPayload(sourceCardId, ability, index),
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
          deps.createAction(
            state,
            side,
            "activated_card_ability",
            `${definition.title}: ${targetDefinition.title} stärken`,
            sourceCardId,
            activatedAbilityLegalActionCosts(ability),
            {
              ...activatedAbilityPayload(sourceCardId, ability, index),
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
    actions.push(
      deps.createAction(
        state,
        side,
        "activated_card_ability",
        ability.label ?? `${definition.title}: Fähigkeit nutzen`,
        sourceCardId,
        activatedAbilityLegalActionCosts(ability),
        activatedAbilityPayload(sourceCardId, ability, index, state),
      ),
    );
  }
}
