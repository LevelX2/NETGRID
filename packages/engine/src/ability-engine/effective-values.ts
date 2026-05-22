/**
 * Calculates effective game values derived from CardImplementation modifiers.
 *
 * This module is read-only. It combines base state/catalog values with active
 * modifier queries and injected host dependencies, but it must not create
 * actions, mutate state, or decide visibility beyond public modifier use.
 */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  Side,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  activeCardImplementationModifiersForScoredCorpAgendas,
  cardMatchesModifierAppliesTo,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  isPublicScoredCorpAgendaModifier,
} from "./card-implementation-modifiers";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardAgendaDifficultyModifierImplementation } from "./definition-types";

export type EffectiveAgendaDifficultyDependencies = {
  // Remaining agenda-difficulty rules still live in the host. Injecting them keeps
  // this module free of index.ts imports while preserving current ordering.
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  serverDifficultyIncreaseFromFaitAccompli: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
  serverDifficultyReductionFromUpgrades: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
};

/**
 * Returns the effective maximum hand size used by PlayerView and cleanup.
 */
export function maxHandSize(state: GameState, side: Side): number {
  if (side === "corp")
    return Math.max(
      0,
      state.corp.maxHandSize +
        cardImplementationHandSizeModifier(state, "corp") -
        cardImplementationCorpHandSizeVirusReduction(state),
    );
  return (
    state.runner.maxHandSize +
    cardImplementationHandSizeModifier(state, "runner") -
    state.runner.coreDamage
  );
}

function cardImplementationCorpHandSizeVirusReduction(state: GameState): number {
  return Object.values(state.cardInstances).reduce((sum, instance) => {
    const virusCounter = cardImplementationForDefinitionId(
      instance.definitionId,
    )?.virusCounter;
    const effect = virusCounter?.continuousEffect;
    if (effect?.kind !== "corp_hand_size_reduce_per_two_counters") return sum;
    const counters = Math.max(0, Math.floor(instance.counters?.virus ?? 0));
    return sum + Math.floor(counters / effect.perCounters) * effect.amountPerGroup;
  }, 0);
}

/**
 * Returns the effective Runner memory limit used by PlayerView and install
 * legality. The base state remains the legacy/base value; modifiers are added
 * here to avoid double counting in card data.
 */
export function runnerMemoryLimit(state: GameState): number {
  return state.runner.memoryLimit + cardImplementationMemoryUnitModifier(state);
}

/**
 * Calculates the effective agenda difficulty used by score LegalActions and
 * revalidation.
 *
 * CardImplementation modifiers are combined with existing host-supplied
 * adjustments until those older rules can be moved behind the same boundary.
 */
export function effectiveAgendaDifficulty(
  deps: EffectiveAgendaDifficultyDependencies,
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const definition = deps.definitionFor(state, agendaId);
  if (definition.type !== "agenda")
    throw new Error("Difficulty kann nur fuer Agenda-Karten berechnet werden.");
  let difficulty = definition.advancementRequirement ?? 0;
  difficulty += cardImplementationAgendaDifficultyModifier(
    state,
    agendaId,
    definition,
  );
  difficulty += deps.serverDifficultyIncreaseFromFaitAccompli(state, agendaId);
  difficulty -= deps.serverDifficultyReductionFromUpgrades(state, agendaId);
  return Math.max(0, difficulty);
}

function positiveCardImplementationModifierAmount(
  kind: string,
  amount: number,
): number {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error(`${kind}-Modifier ist ungueltig.`);
  return amount;
}

function cardImplementationHandSizeModifier(
  state: GameState,
  side: Side,
): number {
  const runnerInstalled = activeCardImplementationModifiersForRunnerInstalled(
    state,
    "hand_size",
  ).filter(
    (active) =>
      active.modifier.side === side &&
      isPublicRunnerInstalledModifier(active.modifier),
  );
  const scoredCorpAgendas =
    side === "corp"
      ? activeCardImplementationModifiersForScoredCorpAgendas(
          state,
          "hand_size",
        ).filter((active) =>
          isPublicScoredCorpAgendaModifier(active.modifier),
        )
      : [];
  const rezzedCorpRoots =
    side === "corp"
      ? activeCardImplementationModifiersForCorpRoot(state, "hand_size").filter(
          (active) => isPublicRezzedCorpRootModifier(active.modifier),
        )
      : [];
  return [...runnerInstalled, ...scoredCorpAgendas, ...rezzedCorpRoots].reduce(
    (sum, active) =>
      sum +
      positiveCardImplementationModifierAmount(
        "hand_size",
        active.modifier.amount,
      ),
    0,
  );
}

function cardImplementationMemoryUnitModifier(state: GameState): number {
  return activeCardImplementationModifiersForRunnerInstalled(
    state,
    "memory_units",
  )
    .filter((active) => isPublicRunnerInstalledModifier(active.modifier))
    .reduce(
      (sum, active) =>
        sum +
        positiveCardImplementationModifierAmount(
          "memory_units",
          active.modifier.amount,
        ),
      0,
    );
}

function cardImplementationAgendaDifficultyModifier(
  state: GameState,
  agendaId: CardInstanceId,
  agendaDefinition: CardDefinition,
): number {
  const scoredModifier = activeCardImplementationModifiersForScoredCorpAgendas(
    state,
    "agenda_difficulty",
  ).reduce((sum, active) => {
    const modifier: CardAgendaDifficultyModifierImplementation = active.modifier;
    if (!isPublicScoredCorpAgendaModifier(modifier)) return sum;
    if (!cardMatchesModifierAppliesTo(agendaDefinition, modifier.appliesTo))
      return sum;
    if (
      typeof modifier.amount !== "number" ||
      !Number.isInteger(modifier.amount) ||
      modifier.amount <= 0
    )
      return sum;
    return (
      sum + (modifier.operation === "reduce" ? -modifier.amount : modifier.amount)
    );
  }, 0);
  const runnerInstalledModifier =
    activeCardImplementationModifiersForRunnerInstalled(
      state,
      "agenda_difficulty",
    ).reduce((sum, active) => {
      const modifier: CardAgendaDifficultyModifierImplementation =
        active.modifier;
      if (!isPublicRunnerInstalledModifier(modifier)) return sum;
      if (!cardMatchesModifierAppliesTo(agendaDefinition, modifier.appliesTo))
        return sum;
      if (
        typeof modifier.amount !== "number" ||
        !Number.isInteger(modifier.amount) ||
        modifier.amount <= 0
      )
        return sum;
      return (
        sum +
        (modifier.operation === "reduce" ? -modifier.amount : modifier.amount)
      );
    }, 0);
  const rootModifier = activeCardImplementationModifiersForCorpRoot(
    state,
    "agenda_difficulty",
  ).reduce((sum, active) => {
    const modifier: CardAgendaDifficultyModifierImplementation = active.modifier;
    if (!isPublicRezzedCorpRootModifier(modifier)) return sum;
    if (!cardMatchesModifierAppliesTo(agendaDefinition, modifier.appliesTo))
      return sum;
    if (
      modifier.appliesTo.sameServerAsSource &&
      !sameCorpServerAsSource(state, active.sourceCardInstanceId, agendaId)
    )
      return sum;
    if (
      typeof modifier.amount !== "number" ||
      !Number.isInteger(modifier.amount) ||
      modifier.amount <= 0
    )
      return sum;
    return (
      sum + (modifier.operation === "reduce" ? -modifier.amount : modifier.amount)
    );
  }, 0);
  return scoredModifier + runnerInstalledModifier + rootModifier;
}

function sameCorpServerAsSource(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  targetCardInstanceId: CardInstanceId,
): boolean {
  const sourceServerId = corpServerIdForInstalledCard(state, sourceCardInstanceId);
  const targetServerId = corpServerIdForInstalledCard(state, targetCardInstanceId);
  return Boolean(sourceServerId) && sourceServerId === targetServerId;
}
