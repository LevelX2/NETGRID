import type { VisibleEffectiveSubroutine } from "@netgrid/shared";

export function isVisibleDirectDamageSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  const type = subroutine.type.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  return (
    type === "brain_damage" ||
    type === "core_damage" ||
    type === "do_brain_damage" ||
    type === "do_core_damage" ||
    type === "do_damage" ||
    typeof damageTypeValue === "string"
  );
}

export function isVisibleHardEndRunSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  return (
    subroutine.type === "end_the_run" ||
    subroutine.type === "end_the_run_and_trash_source_at_end_of_turn"
  );
}

export function isVisiblePayEndRunSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  return subroutine.type === "end_the_run_unless_runner_pays";
}

export function isVisibleSecretSpendCompareSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  return (
    subroutine.type ===
    "secret_spend_compare_end_run_unless_corp_spent_at_least_runner"
  );
}

export function isVisibleRunnerCreditLossSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  return subroutine.type === "runner_lose_credits";
}

export function isVisibleTrashUnlessRunnerPaysSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): boolean {
  return subroutine.type === "trash_installed_program_unless_runner_pays";
}

/** Every legal Corp bid is at least zero, so a Runner bid of zero preserves access. */
export const ACCESS_PRESERVING_SECRET_COMPARE_BID = 0;
