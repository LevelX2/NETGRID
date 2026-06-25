import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardLifecycleTriggeredAbilityImplementation } from "./definition-types";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import { cardImplementationConditionMet } from "./card-implementation-runtime-shared";
import {
  cardImplementationRunnerInstalledSourceIds,
  isActiveCardImplementationStartOfRunnerTurnSource,
} from "./card-implementation-runtime-lifecycle-start";

function cardImplementationEndOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.end_of_runner_turn ?? []
  );
}

export function endOfRunnerTurnPayload(
  cardId: CardInstanceId,
  abilityIndex: number,
): Record<string, string | number | boolean> {
  return {
    cardId,
    cardImplementationLifecycleAction: "end_of_runner_turn",
    cardImplementationLifecycleAbilityIndex: abilityIndex,
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
    abilities.forEach((ability, index) => {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        return;
      actions.push(
        deps.createAction(
          state,
          "runner",
          "end_turn",
          `${definition.title} trashen und Zug beenden`,
          cardId,
          [],
          endOfRunnerTurnPayload(cardId, index),
        ),
      );
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
  const abilityIndex = Number(
    legalAction.payload.cardImplementationLifecycleAbilityIndex,
  );
  const ability =
    cardImplementationEndOfRunnerTurnAbilities(definition)[abilityIndex];
  if (!ability || !Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error("Die End-of-turn-Faehigkeit passt nicht zur Karte.");
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
