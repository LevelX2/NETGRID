import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";

type RunnerPlanningCard = NonNullable<
  ReturnType<typeof cardSpecPlanningCardByDefinitionId>
>;

export type RunnerNoRunRecurringEconomyProfile = Readonly<{
  installCost: number;
  turnStartCredits: number;
  earliestPayout: "start_of_runner_turn";
  invalidatingActionType: "start_run";
}>;

export type RunnerDebtFinancingProfile = Readonly<{
  installCost: number;
  installCreditGain: number;
  startOfTurnCreditLoss: number;
  leavePlayPayCost: number;
  canTrashAtEndOfRunnerTurn: true;
}>;

export type RunnerDebtFinancingLiability = Readonly<{
  instanceCount: number;
  nextTurnCreditLoss: number;
  totalLeavePlayPayCost: number;
}>;

export type RunnerStartOfTurnCreditProfile = Readonly<{
  orderClass: "credit_loss" | "credit_gain";
  amount: number;
  sourceEffect: "lose_credits" | "gain_credits" | "take_hosted_credits";
}>;

export function runnerInstalledDebtFinancingLiability(
  definitionIds: readonly (string | undefined)[],
): RunnerDebtFinancingLiability {
  const profiles = definitionIds.flatMap((definitionId) => {
    const profile = runnerDebtFinancingProfile(definitionId);
    return profile ? [profile] : [];
  });
  return {
    instanceCount: profiles.length,
    nextTurnCreditLoss: profiles.reduce(
      (sum, profile) => sum + profile.startOfTurnCreditLoss,
      0,
    ),
    totalLeavePlayPayCost: profiles.reduce(
      (sum, profile) => sum + profile.leavePlayPayCost,
      0,
    ),
  };
}

export function runnerDebtFinancingProfile(
  definitionId: string | undefined,
): RunnerDebtFinancingProfile | undefined {
  if (!definitionId) return undefined;
  return runnerDebtFinancingProfileFromPlanningCard(
    cardSpecPlanningCardByDefinitionId(definitionId),
  );
}

export function runnerDebtFinancingProfileFromPlanningCard(
  card: RunnerPlanningCard | undefined,
): RunnerDebtFinancingProfile | undefined {
  const planning = card?.planning;
  if (planning?.side !== "runner") return undefined;
  const debtFinancing = planning.planningAnnotations?.card?.some(
    (annotation) =>
      annotation.kind === "strategic_exchange" &&
      annotation.exchange === "debt_financing",
  );
  if (!debtFinancing) return undefined;

  const lifecycle = planning.engine.lifecycle;
  const installCreditGain = sumExactPositiveAmounts(
    lifecycle?.on_install ?? [],
    (effect) =>
      effect.kind === "gain_credits" &&
      (effect.recipient === "runner" || effect.recipient === "controller"),
  );
  const startOfTurnCreditLoss = sumExactPositiveAmounts(
    (lifecycle?.start_of_runner_turn ?? []).flatMap(
      (ability) => ability.effects,
    ),
    (effect) =>
      effect.kind === "lose_credits" &&
      (effect.recipient === "runner" || effect.recipient === "controller"),
  );
  const leavePlayPayments = (lifecycle?.on_leave_play ?? []).flatMap(
    (effect) =>
      effect.kind === "pay_credits_or_lose_game" &&
      (effect.payer === "runner" || effect.payer === "controller") &&
      (effect.loseSide === "runner" || effect.loseSide === "controller")
        ? [effect.amount]
        : [],
  );
  const leavePlayPayCost =
    leavePlayPayments.length === 1 && positiveSafeInteger(leavePlayPayments[0])
      ? leavePlayPayments[0]
      : undefined;
  const canTrashAtEndOfRunnerTurn = (lifecycle?.end_of_runner_turn ?? []).some(
    (ability) =>
      ability.effects.some((effect) => effect.kind === "trash_source"),
  );
  const installCost = planning.engine.characteristics.numeric.installCost;
  if (
    !nonNegativeSafeInteger(installCost) ||
    installCreditGain === undefined ||
    startOfTurnCreditLoss === undefined ||
    leavePlayPayCost === undefined ||
    !canTrashAtEndOfRunnerTurn
  ) {
    return undefined;
  }
  return {
    installCost,
    installCreditGain,
    startOfTurnCreditLoss,
    leavePlayPayCost,
    canTrashAtEndOfRunnerTurn: true,
  };
}

export function runnerNoRunRecurringEconomyProfile(
  definitionId: string | undefined,
): RunnerNoRunRecurringEconomyProfile | undefined {
  if (!definitionId) return undefined;
  return runnerNoRunRecurringEconomyProfileFromPlanningCard(
    cardSpecPlanningCardByDefinitionId(definitionId),
  );
}

export function runnerNoRunRecurringEconomyProfileFromPlanningCard(
  card: RunnerPlanningCard | undefined,
): RunnerNoRunRecurringEconomyProfile | undefined {
  const planning = card;
  if (planning?.planning.side !== "runner") return undefined;

  const recoveryInvestment = planning.planning.planningAnnotations?.card?.some(
    (annotation) =>
      annotation.kind === "plan_role" && annotation.role === "recover_economy",
  );
  if (!recoveryInvestment) return undefined;

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
    (ability) =>
      ability.effects.some((effect) => effect.kind === "trash_source"),
  );
  const installCost =
    planning.planning.engine.characteristics.numeric.installCost;
  return turnStartCredits > 0 &&
    trashesOnRunStart &&
    nonNegativeSafeInteger(installCost)
    ? {
        installCost,
        turnStartCredits,
        earliestPayout: "start_of_runner_turn",
        invalidatingActionType: "start_run",
      }
    : undefined;
}

/**
 * Canonical source profile for a Runner start-of-turn ordering window.
 *
 * The Engine opens that window only for installed sources that have a due
 * start-of-turn implementation.  The AI therefore accepts a source only when
 * its complete lifecycle effect list is an explicitly understood credit
 * consequence.  This deliberately does not identify cards by title or ID.
 */
export function runnerStartOfTurnCreditProfile(
  definitionId: string | undefined,
): RunnerStartOfTurnCreditProfile | undefined {
  if (!definitionId) return undefined;
  return runnerStartOfTurnCreditProfileFromPlanningCard(
    cardSpecPlanningCardByDefinitionId(definitionId),
  );
}

export function runnerStartOfTurnCreditProfileFromPlanningCard(
  card: RunnerPlanningCard | undefined,
): RunnerStartOfTurnCreditProfile | undefined {
  const planning = card?.planning;
  if (planning?.side !== "runner") return undefined;
  const effects = (
    planning.engine.lifecycle?.start_of_runner_turn ?? []
  ).flatMap((ability) => ability.effects);
  if (effects.length === 0) return undefined;

  const creditEffects: RunnerStartOfTurnCreditProfile[] = [];
  for (const effect of effects) {
    if (
      effect.kind === "lose_credits" &&
      (effect.recipient === "runner" || effect.recipient === "controller") &&
      positiveSafeInteger(effect.amount)
    ) {
      creditEffects.push({
        orderClass: "credit_loss",
        amount: effect.amount,
        sourceEffect: "lose_credits",
      });
      continue;
    }
    if (
      effect.kind === "gain_credits" &&
      (effect.recipient === "runner" || effect.recipient === "controller") &&
      positiveSafeInteger(effect.amount)
    ) {
      creditEffects.push({
        orderClass: "credit_gain",
        amount: effect.amount,
        sourceEffect: "gain_credits",
      });
      continue;
    }
    if (
      effect.kind === "take_hosted_credits" &&
      effect.source === "source" &&
      effect.recipient === "controller" &&
      positiveSafeInteger(effect.amount)
    ) {
      creditEffects.push({
        orderClass: "credit_gain",
        amount: effect.amount,
        sourceEffect: "take_hosted_credits",
      });
    }
  }
  const allEffectsAreProfiled = effects.every(
    (effect) =>
      effect.kind === "lose_credits" ||
      effect.kind === "gain_credits" ||
      effect.kind === "take_hosted_credits" ||
      effect.kind === "trash_source_when_empty",
  );
  if (
    !allEffectsAreProfiled ||
    creditEffects.length !== 1 ||
    !positiveSafeInteger(creditEffects[0]?.amount)
  ) {
    return undefined;
  }
  return creditEffects[0]!;
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function sumExactPositiveAmounts(
  effects: readonly unknown[],
  predicate: (effect: Record<string, unknown>) => boolean,
): number | undefined {
  const matched = effects.flatMap((effect) =>
    effect !== null &&
    typeof effect === "object" &&
    predicate(effect as Record<string, unknown>)
      ? [effect]
      : [],
  );
  if (
    matched.length === 0 ||
    matched.some(
      (effect) =>
        !positiveSafeInteger((effect as Record<string, unknown>).amount),
    )
  ) {
    return undefined;
  }
  return matched.reduce(
    (sum, effect) => sum + Number((effect as Record<string, unknown>).amount),
    0,
  );
}
