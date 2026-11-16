import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";

/** General credits from visible installed payouts over a quoted action budget. */
export function visibleRunnerExposureCreditValue(
  input: AiDecisionInput,
  creditActions: number,
): number {
  if (!Number.isSafeInteger(creditActions) || creditActions <= 0) return 0;
  let repeatable = 1;
  const finitePayouts: number[] = [];

  for (const card of input.playerView.opponent.rig ?? []) {
    if (!card.known || !card.definitionId || card.lifecycleMarkers?.length)
      continue;
    const definition = planningCardByDefinitionId(card.definitionId);
    if (definition?.side !== "runner") continue;
    let maximumFinitePayout = 0;
    for (const ability of definition.engine.abilities ?? []) {
      if (
        ability.kind !== "activated" ||
        ability.timing !== "runner_main" ||
        !Array.isArray(ability.costs) ||
        ability.costs.length !== 1 ||
        ability.costs[0]?.kind !== "action" ||
        ability.costs[0].amount !== 1
      )
        continue;
      const [effect, afterPayout] = ability.effects;
      if (
        (effect?.kind !== "gain_credits" &&
          effect?.kind !== "take_hosted_credits") ||
        effect.visibility !== "public" ||
        effect.recipient !== "controller"
      )
        continue;

      if (
        effect.kind === "gain_credits" &&
        ability.effects.length === 1 &&
        ability.condition === undefined &&
        Number.isSafeInteger(effect.amount)
      ) {
        repeatable = Math.max(repeatable, effect.amount);
        continue;
      }

      if (
        effect.kind !== "take_hosted_credits" ||
        effect.source !== "source" ||
        ability.condition?.kind !== "source_has_hosted_credits" ||
        ability.effects.length > 2 ||
        (afterPayout !== undefined &&
          (afterPayout.kind !== "trash_source_when_empty" ||
            afterPayout.source !== "source"))
      )
        continue;
      if (effect.mode === "all") {
        maximumFinitePayout = Number.POSITIVE_INFINITY;
      } else if (
        effect.mode === "up_to_amount_if_available" &&
        effect.amount !== undefined &&
        Number.isSafeInteger(effect.amount) &&
        effect.amount > 0
      ) {
        maximumFinitePayout = Math.max(maximumFinitePayout, effect.amount);
      }
    }
    const pool = card.counters?.bit;
    if (
      maximumFinitePayout === 0 ||
      pool === undefined ||
      !Number.isSafeInteger(pool) ||
      pool <= 0
    )
      continue;
    let remaining = pool;
    for (let used = 0; used < creditActions && remaining > 0; used++) {
      const payout = Math.min(remaining, maximumFinitePayout);
      finitePayouts.push(payout);
      remaining -= payout;
    }
  }

  return finitePayouts
    .sort((left, right) => right - left)
    .slice(0, creditActions)
    .reduce(
      (total, payout) => total + Math.max(0, payout - repeatable),
      creditActions * repeatable,
    );
}
