import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";

export type RunnerNoRunRecurringEconomyProfile = Readonly<{
  turnStartCredits: number;
}>;

export function runnerNoRunRecurringEconomyProfile(
  definitionId: string | undefined,
): RunnerNoRunRecurringEconomyProfile | undefined {
  if (!definitionId) return undefined;
  const planning = cardSpecPlanningCardByDefinitionId(definitionId);
  if (planning?.planning.side !== "runner") return undefined;

  const lifecycle = planning.planning.engine.lifecycle;
  const turnStartCredits = (lifecycle?.start_of_runner_turn ?? []).reduce(
    (sum, ability) =>
      sum +
      ability.effects.reduce(
        (abilitySum, effect) =>
          effect.kind === "gain_credits" &&
          (effect.recipient === "runner" ||
            effect.recipient === "controller") &&
          positiveSafeInteger(effect.amount)
            ? abilitySum + effect.amount
            : abilitySum,
        0,
      ),
    0,
  );
  const trashesOnRunStart = (lifecycle?.on_runner_run_start ?? []).some(
    (ability) => ability.effects.some((effect) => effect.kind === "trash_source"),
  );
  return turnStartCredits > 0 && trashesOnRunStart
    ? { turnStartCredits }
    : undefined;
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
