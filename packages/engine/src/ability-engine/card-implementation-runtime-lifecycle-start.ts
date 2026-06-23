import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type {
  CardImplementationRuntimeDependencies,
  RuntimeEffectCollector,
} from "./card-implementation-runtime-dependency-types";
import { cardImplementationConditionMet } from "./card-implementation-runtime-shared";
import type { CardLifecycleTriggeredAbilityImplementation } from "./definition-types";

export function cardImplementationStartOfCorpTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_corp_turn ?? []
  );
}

export function cardImplementationStartOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_runner_turn ?? []
  );
}

export function cardImplementationRunnerRunStartAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.on_runner_run_start ?? []
  );
}

function cardImplementationEndOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.end_of_runner_turn ?? []
  );
}

export function cardImplementationStartOfCorpTurnSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return [...deps.rezzedCorpRootCardIds(state), ...state.corp.scoreArea].sort();
}

export function cardImplementationRunnerInstalledSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return deps.runnerInstalledCardIds(state).slice().sort();
}

export function isActiveCardImplementationStartOfCorpTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.controller !== "corp") return false;
  if (
    definition.type === "agenda" &&
    instance.zone.side === "corp" &&
    instance.zone.zone === "scoreArea" &&
    state.corp.scoreArea.includes(cardId)
  )
    return true;
  if (definition.type === "agenda") return false;
  return (
    instance.zone.side === "corp" &&
    instance.zone.zone === "serverRoot" &&
    instance.rezzed === true &&
    state.corp.servers.some((server) => server.root.includes(cardId))
  );
}

export function isActiveCardImplementationStartOfRunnerTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  return (
    instance?.controller === "runner" &&
    instance.zone.side === "runner" &&
    instance.zone.zone === "rig" &&
    deps.runnerInstalledCardIds(state).includes(cardId)
  );
}

/**
 * Runs deterministic start-of-Corp-turn lifecycle effects for active Corp
 * sources only. The caller owns turn transition ordering; this helper just
 * queries eligible CardImplementation sources and executes their effects.
 */
export function executeCardImplementationStartOfCorpTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationStartOfCorpTurnSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities =
      cardImplementationStartOfCorpTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfCorpTurnSource(
        deps,
        state,
        cardId,
        definition,
      )
    )
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          drawCards: (side, amount) => deps.drawCards(state, side, amount),
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
          startShowHqAgendasForCredits: (creditPerAgenda) =>
            deps.startShowHqAgendasForCreditsChoice(
              state,
              cardId,
              definition.id,
              creditPerAgenda,
            ),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (
        !isActiveCardImplementationStartOfCorpTurnSource(
          deps,
          state,
          cardId,
          definition,
        )
      )
        break;
    }
  }
}

/**
 * Runs deterministic start-of-Runner-turn lifecycle effects for installed
 * Runner sources only. This is intentionally narrower than a general trigger
 * system and has no optional trigger or priority handling.
 */
export function executeCardImplementationStartOfRunnerTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities =
      cardImplementationStartOfRunnerTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (
        !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
      )
        break;
    }
  }
}

/**
 * Runs the narrow runner-run-start lifecycle path for installed Runner sources.
 *
 * It exists for source-scoped cleanup effects and must not grow into a general
 * run/access replacement engine.
 */
export function executeCardImplementationRunnerRunStartEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction?: LegalAction,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const runStartAbilities =
      cardImplementationRunnerRunStartAbilities(definition);
    if (runStartAbilities.length === 0) continue;
    if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
      continue;
    for (const ability of runStartAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "run_start",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) =>
            deps.trashSource(state, sourceCardId, legalAction),
        },
        ability.effects,
      );
      deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
      if (
        !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
      )
        break;
    }
  }
}
