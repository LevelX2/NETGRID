import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";

import type { AiCardHint } from "../ai-hints";

export type CorpConditionalScoreCreditProfile = Readonly<{
  threshold: number;
  gainAmount: number;
}>;

export type CorpHostedCreditBankProfile = Readonly<{
  poolCredits: number;
  payoutCredits: number;
  payoutActionCost: number;
  payoutTiming: "action" | "start_of_corp_turn";
}>;

/** Only a direct, unconditional liquid payout; no pool, threshold or choice. */
export function corpUnconditionalScoreCreditGain(
  definitionId: number | undefined,
): number | undefined {
  const card = planningCard(definitionId);
  const effect = card?.planning.engine.scoredAgenda;
  if (card?.planning.side !== "corp" || card.planning.cardType !== "agenda")
    return undefined;
  // A threshold, pool, choice or other compound scored effect is not a
  // certificate of an unconditional liquid end-of-score balance.
  if (
    effect &&
    (effect.kind !== "gain_credits_on_score" ||
      effect.recipient !== "corp" ||
      !positiveSafeInteger(effect.amount))
  )
    return undefined;
  let payout = effect?.amount ?? 0;
  for (const lifecycle of card.planning.engine.lifecycle?.on_score ?? []) {
    if (lifecycle.kind === "add_bad_publicity") continue;
    if (
      lifecycle.kind !== "gain_credits" ||
      (lifecycle.recipient !== "corp" &&
        lifecycle.recipient !== "controller") ||
      !positiveSafeInteger(lifecycle.amount)
    )
      return undefined;
    payout += lifecycle.amount;
  }
  return positiveSafeInteger(payout) ? payout : undefined;
}

export function corpConditionalScoreCreditProfile(
  definitionId: number | undefined,
): CorpConditionalScoreCreditProfile | undefined {
  const planning = planningCard(definitionId);
  const scoredAgenda = planning?.planning.engine.scoredAgenda;
  if (
    planning?.planning.side !== "corp" ||
    scoredAgenda?.kind !== "score_credit_swing_if_corp_credit_threshold_met" ||
    !positiveSafeInteger(scoredAgenda.threshold) ||
    !positiveSafeInteger(scoredAgenda.gainAmount)
  ) {
    return undefined;
  }
  return {
    threshold: scoredAgenda.threshold,
    gainAmount: scoredAgenda.gainAmount,
  };
}

export function corpImmediateEconomyGainFromHint(
  hint: AiCardHint | undefined,
): number | undefined {
  if (hint?.side !== "corp" || hint.cardType !== "operation") return undefined;
  const amounts = (hint.effects ?? [])
    .filter(
      (effect) =>
        effect.kind === "economy" &&
        effect.scope === "corp" &&
        effect.timing === "action" &&
        effect.finite === true &&
        positiveSafeInteger(effect.amount),
    )
    .map((effect) => effect.amount as number);
  return amounts.length > 0 ? Math.max(...amounts) : undefined;
}

export function corpHostedCreditBankProfile(
  definitionId: number | undefined,
): CorpHostedCreditBankProfile | undefined {
  const planning = planningCard(definitionId);
  if (planning?.planning.side !== "corp") return undefined;
  const lifecycle = planning.planning.engine.lifecycle;
  const poolCredits = [
    ...(lifecycle?.on_install ?? []),
    ...(lifecycle?.on_rez ?? []),
  ].reduce(
    (sum, effect) =>
      effect.kind === "add_hosted_credits" &&
      effect.target === "source" &&
      positiveSafeInteger(effect.amount)
        ? sum + effect.amount
        : sum,
    0,
  );
  const payoutCredits = Math.max(
    0,
    ...(planning.planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.flatMap((effect) =>
        effect.kind === "take_hosted_credits" &&
        effect.recipient === "controller" &&
        positiveSafeInteger(effect.amount)
          ? [effect.amount]
          : [],
      ),
    ),
    ...(lifecycle?.start_of_corp_turn ?? []).flatMap((ability) =>
      ability.effects.flatMap((effect) =>
        effect.kind === "take_hosted_credits" &&
        effect.recipient === "controller" &&
        positiveSafeInteger(effect.amount)
          ? [effect.amount]
          : [],
      ),
    ),
  );
  const lifecyclePayout = (lifecycle?.start_of_corp_turn ?? []).some(
    (ability) =>
      ability.effects.some(
        (effect) =>
          effect.kind === "take_hosted_credits" &&
          effect.recipient === "controller" &&
          positiveSafeInteger(effect.amount),
      ),
  );
  const payoutActionCost = Math.max(
    0,
    ...(planning.planning.engine.abilities ?? []).flatMap((ability) =>
      ability.effects.some(
        (effect) =>
          effect.kind === "take_hosted_credits" &&
          effect.recipient === "controller",
      )
        ? [
            Array.isArray(ability.costs)
              ? ability.costs.reduce(
                  (sum: number, cost) =>
                    cost.kind === "action" && positiveSafeInteger(cost.amount)
                      ? sum + cost.amount
                      : sum,
                  0,
                )
              : 0,
          ]
        : [],
    ),
  );
  return poolCredits > 0 && payoutCredits > 0
    ? {
        poolCredits,
        payoutCredits,
        payoutActionCost,
        payoutTiming: lifecyclePayout ? "start_of_corp_turn" : "action",
      }
    : undefined;
}

/** A plain rez-created pool with a single-click, otherwise free current-turn payout. */
export function corpRezHostedCreditPayoutProfile(
  definitionId: number | undefined,
  installing = false,
):
  | { poolCredits: number; payoutCredits: number; trashesWhenEmpty: boolean }
  | undefined {
  const planning = planningCard(definitionId);
  const effects = planning?.planning.engine.lifecycle?.on_rez;
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "asset" ||
    (installing &&
      (planning.planning.engine.lifecycle?.on_install?.length ?? 0) > 0) ||
    !effects?.length ||
    !effects.every(
      (effect) =>
        effect.kind === "add_hosted_credits" &&
        effect.target === "source" &&
        positiveSafeInteger(effect.amount),
    )
  )
    return undefined;
  const poolCredits = effects.reduce(
    (sum, effect) =>
      sum + (effect.kind === "add_hosted_credits" ? effect.amount : 0),
    0,
  );
  const payouts = (planning.planning.engine.abilities ?? []).flatMap(
    (ability) => {
      const effect = ability.effects.find(
        (effect) => effect.kind === "take_hosted_credits",
      );
      return ability.kind === "activated" &&
        ability.timing === "corp_main" &&
        ability.effects.every(
          (other) =>
            other === effect || other.kind === "trash_source_when_empty",
        ) &&
        ability.costs.length === 1 &&
        ability.costs[0]?.kind === "action" &&
        ability.costs[0].amount === 1 &&
        ability.condition?.kind === "source_has_hosted_credits" &&
        effect?.kind === "take_hosted_credits" &&
        effect.source === "source" &&
        effect.recipient === "controller" &&
        effect.mode === "up_to_amount_if_available" &&
        positiveSafeInteger(effect.amount)
        ? [
            {
              payoutCredits: effect.amount,
              trashesWhenEmpty: ability.effects.some(
                (other) => other.kind === "trash_source_when_empty",
              ),
            },
          ]
        : [];
    },
  );
  return payouts.length === 1 &&
    positiveSafeInteger(poolCredits) &&
    poolCredits > payouts[0]!.payoutCredits
    ? { poolCredits, ...payouts[0]! }
    : undefined;
}

/** A plain score-created pool with a single-click, otherwise free payout. */
export function corpScoreHostedCreditPayoutProfile(
  definitionId: number | undefined,
): { poolCredits: number; payoutCredits: number } | undefined {
  const planning = planningCard(definitionId);
  const engine = planning?.planning.engine;
  const effects = engine?.lifecycle?.on_score;
  if (
    planning?.planning.side !== "corp" ||
    planning.planning.cardType !== "agenda" ||
    !engine ||
    engine?.scoredAgenda !== undefined ||
    !effects?.length ||
    !effects.every(
      (effect) =>
        effect.kind === "add_hosted_credits" &&
        effect.target === "source" &&
        positiveSafeInteger(effect.amount),
    )
  )
    return undefined;
  const poolCredits = effects.reduce(
    (sum, effect) =>
      sum + (effect.kind === "add_hosted_credits" ? effect.amount : 0),
    0,
  );
  const payouts = (engine.abilities ?? []).flatMap((ability) => {
    const effect =
      ability.effects.length === 1 ? ability.effects[0] : undefined;
    return ability.kind === "activated" &&
      ability.timing === "corp_main" &&
      ability.costs.length === 1 &&
      ability.costs[0]?.kind === "action" &&
      ability.costs[0].amount === 1 &&
      ability.condition?.kind === "source_has_hosted_credits" &&
      effect?.kind === "take_hosted_credits" &&
      effect.source === "source" &&
      effect.recipient === "controller" &&
      effect.mode === "up_to_amount_if_available" &&
      positiveSafeInteger(effect.amount)
      ? [effect.amount]
      : [];
  });
  return payouts.length === 1 && positiveSafeInteger(poolCredits)
    ? { poolCredits, payoutCredits: payouts[0]! }
    : undefined;
}

function planningCard(definitionId: number | undefined) {
  return definitionId
    ? cardSpecPlanningCardByDefinitionId(definitionId)
    : undefined;
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
