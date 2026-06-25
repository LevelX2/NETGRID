import { type AiDecisionInput } from "@netgrid/shared";

import { rolesMatch } from "./role-match";

export function discardPlanFitBonus(
  input: AiDecisionInput,
  roles: readonly string[],
  type: string | undefined,
  plan: string | undefined,
): number {
  const doctrineWeight = plan
    ? Math.max(
        0,
        Math.min(
          15,
          Math.round((input.ownDeckDoctrine?.planWeights[plan] ?? 0) / 2),
        ),
      )
    : 0;
  let bonus = doctrineWeight;

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
        plan === "pressure_rnd" ||
        plan === "contest_remote") &&
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

export function discardDoctrineFitBonus(
  input: AiDecisionInput,
  roles: readonly string[],
  type: string | undefined,
  cost: number,
): number {
  const tags = input.ownDeckDoctrine?.archetypeTags ?? [];
  let bonus = 0;
  if (input.side === "runner") {
    if (
      tags.includes("rig_builder") &&
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
      tags.includes("hq_pressure") &&
      rolesMatch(roles, [
        "pressure_hq",
        "run_pressure",
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 26;
    if (
      tags.includes("rnd_pressure") &&
      rolesMatch(roles, [
        "pressure_rnd",
        "run_pressure",
        "multiaccess",
        "breaker_",
        "economy",
      ])
    )
      bonus += 26;
    if (
      tags.includes("economy_dense") &&
      rolesMatch(roles, ["economy", "tempo"])
    )
      bonus += 24;
  } else {
    if (
      tags.includes("glacier") &&
      (type === "ice" ||
        rolesMatch(roles, ["ice", "etr_ice", "taxing_ice", "remote", "economy"]))
    )
      bonus += 30;
    if (
      tags.includes("rush") &&
      (type === "agenda" ||
        cost <= 3 ||
        rolesMatch(roles, ["score", "ice", "tempo", "advance"]))
    )
      bonus += 24;
    if (
      tags.includes("asset_remote") &&
      (type === "asset" ||
        type === "upgrade" ||
        rolesMatch(roles, ["asset", "upgrade", "remote", "economy"]))
    )
      bonus += 26;
  }
  return Math.max(0, Math.min(35, bonus));
}
