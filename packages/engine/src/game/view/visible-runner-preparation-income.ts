import type { VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { activatedAbilityBindingsForDefinition } from "../../ability-engine/card-capability-binding";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** Guaranteed initial program-install pool from the canonical on-install
 * lifecycle. Conditional or mixed lifecycle effects do not certify this line. */
export function visibleRunnerInitialProgramInstallCredits(
  card: VisibleCard,
): number {
  if (!card.known || !card.definitionId || card.controller !== "runner")
    return 0;
  const implementation = cardImplementationForDefinitionId(card.definitionId);
  const pool = implementation?.restrictedHostedCreditSource;
  const effects = implementation?.lifecycle?.on_install;
  if (
    pool?.counterType !== "bit" ||
    !pool.usableFor.includes("install_programs") ||
    !effects?.length ||
    effects.some(
      (effect) =>
        effect.kind !== "add_hosted_credits" ||
        effect.target !== "source" ||
        !Number.isSafeInteger(effect.amount) ||
        effect.amount < 0,
    )
  )
    return 0;
  return effects.reduce(
    (sum, effect) =>
      sum + (effect.kind === "add_hosted_credits" ? effect.amount : 0),
    0,
  );
}

/** Guaranteed repeatable liquid income from public installed sources. Hidden
 * events, limited payouts and conditional abilities are outside this quote. */
export function visibleRunnerPreparationIncomePerClick(
  rig: readonly VisibleCard[],
): number {
  let income = 1;
  for (const card of rig) {
    if (!card.known || !card.definitionId || card.controller !== "runner")
      continue;
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    if (!definition) continue;
    for (const { ability } of activatedAbilityBindingsForDefinition(
      definition,
    )) {
      if (
        ability.timing !== "runner_main" ||
        ability.condition ||
        ability.limit ||
        ability.costs.length !== 1 ||
        ability.costs[0]?.kind !== "action" ||
        ability.costs[0].amount !== 1 ||
        ability.effects.length !== 1
      )
        continue;
      const effect = ability.effects[0];
      if (
        effect?.kind === "gain_credits" &&
        (effect.recipient === "runner" || effect.recipient === "controller") &&
        Number.isSafeInteger(effect.amount) &&
        effect.amount > income
      )
        income = effect.amount;
    }
  }
  return income;
}

/** Next-turn preparation from basic income and public, currently stored pools.
 * Every cashout replaces one income action. Per-source limits reset before
 * that future Runner turn; this quote never spends a bank during a live run.
 */
export function visibleRunnerNextTurnPreparationCreditGain(
  rig: readonly VisibleCard[],
  preparationClicks: number,
  incomePerClick = 1,
): number {
  if (
    !Number.isSafeInteger(preparationClicks) ||
    preparationClicks < 0 ||
    !Number.isSafeInteger(incomePerClick) ||
    incomePerClick < 1
  )
    throw new Error("invalid_visible_runner_preparation_budget");
  const sources = new Set<string>();
  const improvements: number[] = [];
  for (const card of rig) {
    if (
      !card.known ||
      !card.definitionId ||
      card.controller !== "runner" ||
      card.rezzed !== true
    )
      continue;
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    if (!definition || definition.side !== "runner") continue;
    const cashout = activatedAbilityBindingsForDefinition(definition).some(
      ({ ability }) =>
        ability.timing === "runner_main" &&
        ability.limit?.kind === "once_per_turn_per_source" &&
        ability.limit.scope === "any_ability_on_source" &&
        (!ability.condition ||
          ability.condition.kind === "source_has_hosted_credits") &&
        ability.costs.length === 1 &&
        ability.costs[0]?.kind === "action" &&
        ability.costs[0].amount === 1 &&
        ability.effects.length === 1 &&
        ability.effects[0]?.kind === "take_hosted_credits" &&
        ability.effects[0].source === "source" &&
        ability.effects[0].recipient === "controller" &&
        ability.effects[0].mode === "all",
    );
    if (!cashout) continue;
    if (sources.has(card.instanceId))
      throw new Error("duplicate_visible_runner_preparation_bank");
    sources.add(card.instanceId);
    const stored = card.counters?.bit ?? 0;
    if (!Number.isSafeInteger(stored) || stored < 0)
      throw new Error("invalid_visible_runner_preparation_bank_counter");
    if (stored > incomePerClick) improvements.push(stored - incomePerClick);
  }
  const gain =
    preparationClicks * incomePerClick +
    improvements
      .sort((a, b) => b - a)
      .slice(0, preparationClicks)
      .reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(gain))
    throw new Error("unsafe_visible_runner_preparation_gain");
  return gain;
}
