import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { assertAbilityRefIdentity } from "@netgrid/cards/engine";
import type {
  CardLifecycleTriggeredAbilityImplementation,
  PayCreditsOrLoseGameEffectImplementation,
} from "./definition-types";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import { cardImplementationConditionMet } from "./card-implementation-runtime-shared";
import {
  cardImplementationRunnerInstalledSourceIds,
  isActiveCardImplementationStartOfRunnerTurnSource,
} from "./card-implementation-runtime-lifecycle-start";
import {
  endOfRunnerTurnAbilityBindingForLegalAction,
  endOfRunnerTurnAbilityBindingsForDefinition,
  endOfRunnerTurnBindingPayload,
  lifecycleForDefinition,
  type EndOfRunnerTurnAbilityBinding,
} from "./card-capability-binding";

function cardImplementationEndOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly EndOfRunnerTurnAbilityBinding[] {
  return endOfRunnerTurnAbilityBindingsForDefinition(definition);
}

export function endOfRunnerTurnPayload(
  state: GameState,
  definition: CardDefinition,
  cardId: CardInstanceId,
  binding: EndOfRunnerTurnAbilityBinding,
): Record<string, string | number | boolean> {
  const leavePlayPayment = leavePlayPaymentQuote(state, definition, cardId);
  return {
    cardId,
    cardImplementationLifecycleAction: "end_of_runner_turn",
    ...endOfRunnerTurnBindingPayload(binding),
    ...(leavePlayPayment ?? {}),
  };
}

function leavePlayPaymentQuote(
  state: GameState,
  definition: CardDefinition,
  cardId: CardInstanceId,
):
  | {
      cardImplementationLifecycleLeavePlayPaymentAmount: number;
      cardImplementationLifecycleLeavePlayPaymentStatus:
        | "payable"
        | "unpayable";
    }
  | undefined {
  const paymentEffects =
    lifecycleForDefinition(definition)?.on_leave_play?.filter(
      (effect): effect is PayCreditsOrLoseGameEffectImplementation =>
        effect.kind === "pay_credits_or_lose_game",
    ) ?? [];
  if (paymentEffects.length !== 1) return undefined;
  const [paymentEffect] = paymentEffects;
  if (!paymentEffect) return undefined;
  const controller = state.cardInstances[cardId]?.controller;
  const payer =
    paymentEffect.payer === "controller" ? controller : paymentEffect.payer;
  if (payer !== "runner" && payer !== "corp") return undefined;
  return {
    cardImplementationLifecycleLeavePlayPaymentAmount: paymentEffect.amount,
    cardImplementationLifecycleLeavePlayPaymentStatus:
      state[payer].credits >= paymentEffect.amount ? "payable" : "unpayable",
  };
}

export function pushCardImplementationEndOfRunnerTurnActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
): void {
  for (const cardId of cardImplementationRunnerInstalledSourceIds(
    deps,
    state,
  )) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = deps.definitionFor(state, cardId);
    const abilities = cardImplementationEndOfRunnerTurnAbilities(definition);
    if (abilities.length === 0) continue;
    if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
      continue;
    abilities.forEach((binding) => {
      const { ability } = binding;
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        return;
      const abilityRef = {
        sourceCardInstanceId: cardId,
        sourceAbilityId: binding.sourceAbilityId,
      };
      actions.push({
        ...deps.createAction(
          state,
          "runner",
          "end_turn",
          `${definition.title} trashen und Zug beenden`,
          cardId,
          [],
          endOfRunnerTurnPayload(state, definition, cardId, binding),
        ),
        abilityRef,
      });
    });
  }
}

export function resolveCardImplementationEndOfRunnerTurnAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  if (
    legalAction.payload?.cardImplementationLifecycleAction !==
    "end_of_runner_turn"
  )
    return false;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese End-of-turn-Faehigkeit nutzen.");
  if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
    throw new Error(
      "Diese End-of-turn-Faehigkeit ist nur am Ende des Runner-Zugs nutzbar.",
    );
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error("Die End-of-turn-Faehigkeit hat keine gueltige Quelle.");
  if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
    throw new Error("Die End-of-turn-Faehigkeit ist nicht installiert.");
  const definition = deps.definitionFor(state, cardId);
  if (legalAction.source !== cardId)
    throw new Error("Die End-of-turn-Faehigkeit widerspricht ihrer Quelle.");
  const binding = endOfRunnerTurnAbilityBindingForLegalAction(
    definition,
    legalAction,
  );
  const abilityRef = legalAction.abilityRef;
  assertAbilityRefIdentity(abilityRef);
  if (
    !abilityRef ||
    abilityRef.sourceCardInstanceId !== cardId ||
    abilityRef.sourceAbilityId !== binding.sourceAbilityId
  )
    throw new Error("Die Lifecycle-AbilityRef ist nicht mehr gueltig.");
  const { ability } = binding;
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition, cardId)
  )
    throw new Error("Die End-of-turn-Kartenbedingung ist nicht erfuellt.");
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      ...(typeof legalAction.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(
        Number(legalAction.payload?.targetRezCost ?? 0),
      ),
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      reason: "end_of_turn",
      gainCredits: (side, amount, gainOrdinal, kind) =>
        deps.gainCredits(state, {
          side,
          amount,
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          gainOrdinal,
          kind,
          reason: "end_of_turn",
        }),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
    },
    ability.effects,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}
