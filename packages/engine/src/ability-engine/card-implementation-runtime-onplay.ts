import type {
  CardDefinition,
  CardInstanceId,
  CorpDrawContinuation,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import { assertOnPlayCardImplementationAbilityCanResolve } from "./card-implementation-runtime-legality";
import { printedCostOnPlayImplementation } from "./card-implementation-runtime-shared";
import { onPlayAbilityBindingForDefinition } from "./card-capability-binding";

/**
 * Resolves a printed-cost on-play CardImplementation ability after the host has
 * accepted the play action. The runtime executes only declarative effects; play
 * legality, card movement, and printed cost payment stay in the host.
 */
export function executeOnPlayCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  definition: CardDefinition,
  cardId: CardInstanceId,
  continuation?: {
    startEffectIndex: number;
    creditGainOrdinal: number;
    skipLegalityCheck: true;
  },
): void {
  const binding = onPlayAbilityBindingForDefinition(definition);
  const ability = printedCostOnPlayImplementation(definition);
  if (!ability || !binding)
    throw new Error(
      `Kein On-Play-Implementation-Resolver fuer ${definition.id}.`,
    );
  if (!continuation)
    assertOnPlayCardImplementationAbilityCanResolve(deps, state, ability);
  let effectSuspended = false;
  let runnerTagsBeforeSuspendedEffect = state.runner.tags;
  const startEffectIndex = continuation?.startEffectIndex ?? 0;
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      sourceCapabilityKey: binding.capabilityKey,
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      effectIndexOffset: startEffectIndex,
      creditGainOrdinalOffset: continuation?.creditGainOrdinal ?? 0,
      gainCredits: (side, amount, gainOrdinal, kind) =>
        deps.gainCredits(state, {
          side,
          amount,
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          gainOrdinal,
          kind,
          reason: "card_resolver",
        }),
      addRunnerTagsWithPrevention: (amount) => {
        runnerTagsBeforeSuspendedEffect = state.runner.tags;
        effectSuspended = deps.addRunnerTagsWithPrevention(
          state,
          legalAction,
          amount,
          definition.id,
        );
        return effectSuspended;
      },
      isEffectSuspended: () =>
        effectSuspended || Boolean(state.pendingCorpDraw),
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(
          state,
          legalAction,
          definition.id,
          damageType,
          amount,
        ),
      unpreventableDamageRunner: (damageType, amount) =>
        deps.unpreventableDamageRunner(
          state,
          legalAction,
          definition.id,
          damageType,
          amount,
        ),
      startTrace: (sourceCardId, traceLimit, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          definition.id,
          traceLimit,
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
          cardId,
          definition.id,
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
              cardId,
              definition.id,
              targetId,
              scope,
            )
          : deps.startExposeInstalledCorpCardsChoice(
              state,
              legalAction,
              cardId,
              definition.id,
              1,
              1,
              scope,
            );
      },
      startExposeInstalledCards: (min, max, scope) =>
        deps.startExposeInstalledCorpCardsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          min,
          max,
          scope,
        ),
      exposeOutermostIceEachFort: () =>
        deps.exposeOutermostIceEachDataFort(
          state,
          legalAction,
          cardId,
          definition.id,
        ),
      startSearchTrashToGrip: (filter) =>
        deps.startSearchTrashToGripChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          filter,
        ),
      startSearchStackToGrip: (filter, revealToCorp, shuffleAfterwards) =>
        deps.startSearchStackToGripChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          filter,
          revealToCorp,
          shuffleAfterwards,
        ),
      moveTopTrashToGrip: () =>
        deps.moveTopTrashToGrip(state, legalAction, cardId, definition.id),
      startSearchStackInstall: (filter, installCost, shuffleAfterwards) =>
        deps.startSearchStackInstallChoice(
          state,
          legalAction,
          cardId,
          definition.id,
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
          cardId,
          definition.id,
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
          cardId,
          definition.id,
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
          cardId,
          definition.id,
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
          cardId,
          definition.id,
          count,
        ),
      startTrashOwnInstalledCardsForCredits: (min, max, gainPerTrashed) =>
        deps.startTrashOwnInstalledCardsForCreditsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          min,
          max,
          gainPerTrashed,
        ),
      startTrashCardsFromGripForCredits: (max, gainPerTrashed) =>
        deps.startTrashCardsFromGripForCreditsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          max,
          gainPerTrashed,
        ),
      shuffleGripTrashAndStackThenDraw: (drawCount, removePlayedCardFromGame) =>
        deps.shuffleGripTrashAndStackThenDraw(
          state,
          legalAction,
          cardId,
          definition.id,
          drawCount,
          removePlayedCardFromGame,
        ),
      startPayRezCostToTrashRezzedIceChoice: () =>
        deps.startPayRezCostToTrashRezzedIceChoice(state, legalAction, cardId),
      startTrashUnrezzedIceChoice: () =>
        deps.startTrashUnrezzedIceChoice(state, legalAction, cardId),
      startCorpChoiceRezOrTrashIceChoice: () =>
        deps.startCorpChoiceRezOrTrashIceChoice(state, legalAction, cardId),
      startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice: () =>
        deps.startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice(
          state,
          legalAction,
          cardId,
        ),
      startDerezRezzedBlackIceChoice: () =>
        deps.startDerezRezzedBlackIceChoice(state, legalAction, cardId),
      startCorpDiscardHqWithRetainPayment: (retainCostPerCard) =>
        deps.startCorpDiscardHqWithRetainPayment(
          state,
          legalAction,
          cardId,
          retainCostPerCard,
        ),
      startRunnerProgramInstallActionBundle: (actionCount, temporaryCredit) =>
        deps.startRunnerProgramInstallActionBundle(
          state,
          legalAction,
          actionCount,
          temporaryCredit,
        ),
      addCounterToAllInstalledRunnerIcebreakers: (counterType, amount) =>
        deps.addCounterToAllInstalledRunnerIcebreakers(
          state,
          counterType,
          amount,
        ),
      gainRunnerEventAgendaPoint: (amount) =>
        deps.gainRunnerEventAgendaPoint(
          state,
          legalAction,
          definition.id,
          amount,
        ),
      runnerLiberatedAgendaSubtypeThisTurn: (subtype) =>
        deps.runnerLiberatedAgendaSubtypeThisTurn(state, subtype),
      corpRandomDiscardFromHq: (count) =>
        deps.corpRandomDiscardFromHq(state, definition.id, count),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
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
          cardId,
          definition.id,
          amount,
          distribution,
        ),
      startMoveAdvancementCounters: (source, maxAmount) =>
        deps.startMoveAdvancementCounters(
          state,
          legalAction,
          cardId,
          definition.id,
          source,
          maxAmount,
        ),
      rezInstalledIceWithLifecycleCounters: (input) =>
        deps.rezInstalledIceWithLifecycleCounters(
          state,
          legalAction,
          cardId,
          definition.id,
          input,
        ),
      replaceFortCardsFromHq: () =>
        deps.replaceFortCardsFromHq(state, legalAction, cardId, definition.id),
    },
    ability.effects.slice(startEffectIndex),
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  if (result.suspendedAtEffectIndex !== undefined) {
    if (effectSuspended) {
      state.pendingAddTagContinuation = {
        kind: "card_effect_on_play",
        sourceCardId: cardId,
        sourceDefinitionId: definition.id,
        tagEffectIndex: result.suspendedAtEffectIndex,
        nextEffectIndex: result.suspendedAtEffectIndex + 1,
        creditGainOrdinal: result.creditGainOrdinal,
        runnerTagsBefore: runnerTagsBeforeSuspendedEffect,
      };
      return;
    }
    if (
      state.pendingCorpDraw &&
      result.suspendedAtEffectIndex + 1 < ability.effects.length
    )
      state.pendingCorpDraw.continuation = {
        kind: "card_effect_on_play",
        sourceCardId: cardId,
        sourceDefinitionId: definition.id,
        drawEffectIndex: result.suspendedAtEffectIndex,
        nextEffectIndex: result.suspendedAtEffectIndex + 1,
        creditGainOrdinal: result.creditGainOrdinal,
      };
  }
}

export function resumeOnPlayCardImplementationAfterCorpDraw(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  continuation: Extract<CorpDrawContinuation, { kind: "card_effect_on_play" }>,
): void {
  if (state.pendingChoice || state.pendingCorpDraw)
    throw new Error("Der Corp-Draw ist noch nicht abgeschlossen.");
  const definition = deps.definitionFor(state, continuation.sourceCardId);
  if (definition.id !== continuation.sourceDefinitionId)
    throw new Error("Die On-Play-Draw-Quelle ist veraltet.");
  const ability = printedCostOnPlayImplementation(definition);
  const drawEffect = ability?.effects[continuation.drawEffectIndex];
  if (!ability || drawEffect?.kind !== "draw_cards")
    throw new Error("Die On-Play-Draw-Fortsetzung passt nicht zur Karte.");

  executeOnPlayCardImplementationAbility(
    deps,
    state,
    legalAction,
    definition,
    continuation.sourceCardId,
    {
      startEffectIndex: continuation.nextEffectIndex,
      creditGainOrdinal: continuation.creditGainOrdinal,
      skipLegalityCheck: true,
    },
  );
}

export function resumeOnPlayCardImplementationAfterTagPrevention(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): void {
  const continuation = state.pendingAddTagContinuation;
  if (!continuation || continuation.kind !== "card_effect_on_play")
    throw new Error("Es ist keine On-Play-Tag-Fortsetzung offen.");
  if (state.pendingChoice || state.eventModificationWindow)
    throw new Error("Das Add-Tag-Fenster ist noch nicht abgeschlossen.");
  const definition = deps.definitionFor(state, continuation.sourceCardId);
  if (definition.id !== continuation.sourceDefinitionId)
    throw new Error("Die On-Play-Tag-Quelle ist veraltet.");
  const ability = printedCostOnPlayImplementation(definition);
  const tagEffect = ability?.effects[continuation.tagEffectIndex];
  if (!ability || tagEffect?.kind !== "add_tags")
    throw new Error("Die On-Play-Tag-Fortsetzung passt nicht zur Karte.");

  delete state.pendingAddTagContinuation;
  const tagsAdded = Math.max(
    0,
    state.runner.tags - continuation.runnerTagsBefore,
  );
  deps.appendResolvedEffectsToPayload(legalAction, [
    {
      effectId: `${definition.id}.effect.${continuation.tagEffectIndex}.add_tags`,
      kind: "add_tags",
      visibility: tagEffect.visibility,
      side: "runner",
      amount: tagsAdded,
      reason: "card_resolver",
      runnerTagsAfter: state.runner.tags,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
    },
  ]);
  executeOnPlayCardImplementationAbility(
    deps,
    state,
    legalAction,
    definition,
    continuation.sourceCardId,
    {
      startEffectIndex: continuation.nextEffectIndex,
      creditGainOrdinal: continuation.creditGainOrdinal,
      skipLegalityCheck: true,
    },
  );
}
