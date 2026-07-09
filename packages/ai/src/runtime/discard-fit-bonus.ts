import { type AiDecisionInput } from "@netgrid/shared";

import { rolesMatch } from "./role-match";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export function discardPlanFitBonus(
  input: AiDecisionInput,
  roles: readonly string[],
  type: string | undefined,
  plan: string | undefined,
): number {
  let bonus = 0;

  if (input.side === "runner") {
    if (
      plan === "build_rig" &&
      rolesMatch(roles, [
        "breaker_",
        "memory",
        "setup",
        "build_rig",
        "runner_program",
      ])
    )
      bonus += 42;
    if (plan === "recover_economy" && rolesMatch(roles, ["economy", "tempo"]))
      bonus += 42;
    if (
      (plan === "pressure_hq" ||
        plan === "pressure_rnd") &&
      rolesMatch(roles, ["run_pressure", plan, "multiaccess", "breaker_"])
    )
      bonus += 36;
    if (
      plan === "contest_remote" &&
      rolesMatch(roles, [
        "run_pressure",
        plan,
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 36;
    if (
      plan === "draw_for_answers" &&
      rolesMatch(roles, ["draw", "setup", "breaker_"])
    )
      bonus += 30;
  } else {
    if (
      (plan === "score_now" ||
        plan === "score_next_turn" ||
        plan === "build_scoring_remote") &&
      (type === "agenda" ||
        rolesMatch(roles, ["score", "remote", "advance", "economy", "ice"]))
    )
      bonus += 42;
    if (
      (plan === "protect_hq" || plan === "protect_rnd") &&
      rolesMatch(roles, [
        "ice",
        "etr_ice",
        "taxing_ice",
        "corp_rez_ice",
        "corp_install_ice",
      ])
    )
      bonus += 38;
    if (plan === "recover_economy" && rolesMatch(roles, ["economy"]))
      bonus += 42;
    if (
      plan === "bait_runner" &&
      rolesMatch(roles, ["asset", "upgrade", "remote_support"])
    )
      bonus += 24;
  }

  return Math.max(0, Math.min(55, bonus));
}

export function discardStrategicFitBonus(
  input: AiDecisionInput,
  roles: readonly string[],
  type: string | undefined,
  cost: number,
): number {
  const strategies = discardStrategyIds(input);
  const strategySet = new Set(strategies);
  let bonus = 0;
  if (input.side === "runner") {
    if (
      (strategySet.has("runner.rig_first") ||
        strategySet.has("runner.search.breaker")) &&
      rolesMatch(roles, [
        "breaker_",
        "memory",
        "setup",
        "build_rig",
        "runner_program",
      ])
    )
      bonus += 30;
    if (
      strategySet.has("runner.hq_pressure") &&
      rolesMatch(roles, ["pressure_hq", "run_pressure", "multiaccess", "breaker_"])
    )
      bonus += 26;
    if (
      strategySet.has("runner.rnd_pressure") &&
      rolesMatch(roles, ["pressure_rnd", "run_pressure", "multiaccess", "breaker_"])
    )
      bonus += 26;
    if (
      strategySet.has("runner.economy_first") &&
      rolesMatch(roles, ["economy", "tempo"])
    )
      bonus += 24;
  } else {
    if (
      strategySet.has("corp.ice_tax_glacier") &&
      (type === "ice" ||
        rolesMatch(roles, ["ice", "etr_ice", "taxing_ice", "remote", "economy"]))
    )
      bonus += 30;
    if (
      (strategySet.has("corp.rush_score") ||
        strategySet.has("corp.remote_scoring") ||
        strategySet.has("corp.fast_advance")) &&
      (type === "agenda" ||
        cost <= 3 ||
        rolesMatch(roles, ["score", "ice", "tempo", "advance"]))
    )
      bonus += 24;
    if (
      strategySet.has("corp.asset_economy") &&
      (type === "asset" ||
        type === "upgrade" ||
        rolesMatch(roles, ["asset", "upgrade", "remote", "economy"]))
    )
      bonus += 26;
  }
  return Math.max(0, Math.min(35, bonus));
}

function discardStrategyIds(input: AiDecisionInput): string[] {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const profile = semanticInput.ownDeckStrategyProfile;
  const intent = semanticInput.ownStrategicIntentState;
  const committedStrategy =
    intent && intent.primaryStrategy.family !== "neutral"
      ? [intent.primaryStrategy.strategyId]
      : [];
  return [
    ...committedStrategy,
    ...(profile?.primaryStrategies ?? []),
    ...(profile?.secondaryStrategies ?? []),
  ].filter((strategyId, index, all) => all.indexOf(strategyId) === index);
}
