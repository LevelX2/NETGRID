import type {
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import { payActivatedCardImplementationCosts } from "./card-implementation-runtime-activated-costs";
import { sameFortSubroutineTargetForLegalAction } from "./card-implementation-runtime-activated-targets";
import {
  activatedAbilityForLegalAction,
  validateActivatedCardImplementationAbility,
} from "./card-implementation-runtime-activated-validation";
import { markCardImplementationAbilityLimitUsed } from "./card-implementation-ability-limits";

/**
 * Revalidates and resolves one activated CardImplementation ability.
 *
 * Costs are paid only after source status, timing, conditions, and ability
 * limits have been checked against the current state, which rejects stale
 * actions without partial effect execution.
 */
export function resolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  const match = activatedAbilityForLegalAction(deps, state, legalAction);
  if (!match) return false;
  validateActivatedCardImplementationAbility(deps, state, legalAction, match);
  const costPublicPayload = payActivatedCardImplementationCosts(
    deps,
    state,
    legalAction,
    legalAction.side,
    match.cardId,
    match.ability,
  );
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: match.cardId,
      sourceDefinitionId: match.definition.id,
      sourceTitle: match.definition.title,
      ...(typeof legalAction.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(
        Number(legalAction.payload?.targetRezCost ?? 0),
      ),
      controller: deps.mustInstance(state.cardInstances, match.cardId)
        .controller,
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(
          state,
          legalAction,
          match.definition.id,
          damageType,
          amount,
        ),
      unpreventableDamageRunner: (damageType, amount) =>
        deps.unpreventableDamageRunner(
          state,
          legalAction,
          match.definition.id,
          damageType,
          amount,
        ),
      startTrace: (sourceCardId, baseTraceStrength, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          match.definition.id,
          baseTraceStrength,
          successEffect,
        ),
      }),
      startRun: (serverId, options) =>
        deps.startRun(state, legalAction, serverId, options),
      chosenRunServerId: () =>
        String(legalAction.payload?.serverId ?? "") as Exclude<
          ServerId,
          "new_remote"
        >,
      startPrivateLook: (zone, count) =>
        deps.startPrivateLook(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          zone,
          count,
        ),
      exposeInstalledCard: (scope) => {
        const targetId = String(
          legalAction.payload?.cardImplementationExposeTargetId ?? "",
        );
        return targetId
          ? deps.exposeInstalledCorpCard(
              state,
              legalAction,
              match.cardId,
              match.definition.id,
              targetId,
              scope,
            )
          : deps.startExposeInstalledCorpCardsChoice(
              state,
              legalAction,
              match.cardId,
              match.definition.id,
              1,
              1,
              scope,
            );
      },
      startExposeInstalledCards: (min, max, scope) =>
        deps.startExposeInstalledCorpCardsChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          min,
          max,
          scope,
        ),
      exposeOutermostIceEachFort: () =>
        deps.exposeOutermostIceEachDataFort(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
      startSearchTrashToGrip: (filter) =>
        deps.startSearchTrashToGripChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
        ),
      startSearchStackToGrip: (filter, revealToCorp, shuffleAfterwards) =>
        deps.startSearchStackToGripChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
          revealToCorp,
          shuffleAfterwards,
        ),
      moveTopTrashToGrip: () =>
        deps.moveTopTrashToGrip(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
      startSearchStackInstall: (filter, installCost, shuffleAfterwards) =>
        deps.startSearchStackInstallChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
          installCost,
          shuffleAfterwards,
        ),
      startChooseStackOrTrashProgramInstall: (
        installCost,
        shuffleStackIfSearched,
        returnInstalledCardToGripAtEndOfTurn,
      ) =>
        deps.startStackOrTrashProgramInstallChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          installCost,
          shuffleStackIfSearched,
          returnInstalledCardToGripAtEndOfTurn,
        ),
      startLookTopStackShowToCorpThenInstallMatching: (
        count,
        allowedTypes,
        installCost,
        trashSourceIfInstalled,
        shuffleAfterwards,
      ) =>
        deps.startLookTopStackShowToCorpThenInstallMatchingChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
          allowedTypes,
          installCost,
          trashSourceIfInstalled,
          shuffleAfterwards,
        ),
      startLookTopStackTakeMatching: (
        count,
        allowedTypes,
        costPerTaken,
        revealTakenToCorp,
        shuffleRemainder,
      ) =>
        deps.startLookTopStackTakeMatchingChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
          allowedTypes,
          costPerTaken,
          revealTakenToCorp,
          shuffleRemainder,
        ),
      startLookTopStackTakeOneArrangeRest: (count) =>
        deps.startLookTopStackTakeOneArrangeRestChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
        ),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      removeRunnerTags: (mode, amount) =>
        deps.removeRunnerTags(state, mode, amount),
      avoidNextTag: (amount) => deps.avoidNextTag(state, amount),
      returnSourceToGripIfPaid: (sourceCardId, amount) =>
        deps.returnSourceToGripIfPaid(state, legalAction, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      startDistributeAdvancementCounters: (amount, distribution) =>
        deps.startDistributeAdvancementCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          amount,
          distribution,
        ),
      startMoveAdvancementCounters: (source, maxAmount) =>
        deps.startMoveAdvancementCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          source,
          maxAmount,
        ),
      addCurrentEncounterAdditionalSubroutine: (input) =>
        deps.addCurrentEncounterAdditionalSubroutine(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          match.definition.title,
          input,
        ),
      copySameFortIceSubroutineForRun: () => {
        const target = sameFortSubroutineTargetForLegalAction(
          deps,
          state,
          match.cardId,
          legalAction,
        );
        if (!target)
          throw new Error("Die Ziel-Subroutine ist nicht mehr gueltig.");
        if (!state.run)
          throw new Error("Subroutine-Copy braucht einen laufenden Run.");
        state.run.encounterAdditionalSubroutines = [
          ...(state.run.encounterAdditionalSubroutines ?? []),
          {
            sourceCardInstanceId: match.cardId,
            sourceDefinitionId: match.definition.id,
            sourceTitle: match.definition.title,
            targetIceId: target.iceId,
            originalSubroutineId: target.subroutineId,
            subroutineKind: target.subroutineKind,
            ...(target.amount !== undefined ? { amount: target.amount } : {}),
          },
        ];
        return {
          publicPayload: {
            copiedSubroutine: true,
            targetCardDefinitionId: target.iceDefinition.id,
            subroutineIndex: target.subroutineIndex,
            subroutineId: target.subroutineId,
          },
        };
      },
      addCurrentRunAccessCount: (server, amount) =>
        deps.addCurrentRunAccessCount(state, server, amount),
      passCurrentEncounteredIce: (subtypeRequired) =>
        deps.passCurrentEncounteredIce(state, legalAction, subtypeRequired),
      rezInstalledIceWithLifecycleCounters: (input) =>
        deps.rezInstalledIceWithLifecycleCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          input,
        ),
      replaceFortCardsFromHq: () =>
        deps.replaceFortCardsFromHq(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
    },
    match.ability.effects,
  );
  if (match.ability.limit)
    markCardImplementationAbilityLimitUsed(
      deps.abilityLimits,
      state,
      match.cardId,
      match.ability.limit,
    );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: match.definition.id,
    ...(match.ability.limit
      ? {
          cardImplementationAbilityLimit: match.ability.limit.kind,
          cardImplementationSourceAbilityUsedThisTurn: true,
        }
      : {}),
    ...costPublicPayload,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}
