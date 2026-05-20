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
import type { CardAgendaDifficultyModifierImplementation } from "./definition-types";

export type EffectiveAgendaDifficultyDependencies = {
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  runnerHasInstalledCorporateAlly: (state: GameState) => boolean;
  serverDifficultyIncreaseFromFaitAccompli: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
  serverDifficultyReductionFromUpgrades: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
};

export function maxHandSize(state: GameState, side: Side): number {
  if (side === "corp")
    return state.corp.maxHandSize + cardImplementationHandSizeModifier(state, "corp");
  return (
    state.runner.maxHandSize +
    cardImplementationHandSizeModifier(state, "runner") -
    state.runner.coreDamage
  );
}

export function runnerMemoryLimit(state: GameState): number {
  return state.runner.memoryLimit + cardImplementationMemoryUnitModifier(state);
}

export function effectiveAgendaDifficulty(
  deps: EffectiveAgendaDifficultyDependencies,
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const definition = deps.definitionFor(state, agendaId);
  if (definition.type !== "agenda")
    throw new Error("Difficulty kann nur fuer Agenda-Karten berechnet werden.");
  let difficulty = definition.advancementRequirement ?? 0;
  if (deps.runnerHasInstalledCorporateAlly(state)) difficulty += 1;
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
  return scoredModifier + rootModifier;
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
