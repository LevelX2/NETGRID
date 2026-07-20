import type { VisibleEffectiveSubroutine } from "@netgrid/shared";

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

export function isVisibleSecretSpendEndRunSubroutine(
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

/**
 * Too Many Doors permits bids from zero through two. A Runner can guarantee
 * access only by exceeding the Corp's largest legal visible bid; at two Corp
 * credits that is impossible and the route stays explicitly conditional.
 */
export function secretSpendAccessPaymentForVisibleCorpCredits(
  visibleCorpCredits: number,
): number | undefined {
  const maximumCorpBid = Math.min(
    2,
    Math.max(0, Math.floor(visibleCorpCredits)),
  );
  const requiredRunnerBid = maximumCorpBid + 1;
  return requiredRunnerBid <= 2 ? requiredRunnerBid : undefined;
}
