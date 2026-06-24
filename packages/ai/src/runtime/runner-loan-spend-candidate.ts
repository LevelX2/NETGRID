import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { RunnerLoanSpendCandidateKind } from "./runner-loan-projected-spend";

export type RunnerLoanSpendCandidateKindDependencies = {
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  isRunnerPressureRole: (role: string) => boolean;
};

export function runnerLoanSpendCandidateKind(
  input: AiDecisionInput,
  card: VisibleCard,
  roles: readonly string[],
  dependencies: RunnerLoanSpendCandidateKindDependencies,
): RunnerLoanSpendCandidateKind {
  if (roles.some((role) => role.startsWith("breaker_"))) {
    return dependencies.cardAddressesVisibleBreakerNeed(input, card)
      ? "critical_breaker"
      : "direct_plan";
  }
  if (roles.some((role) => dependencies.isRunnerPressureRole(role))) {
    return "direct_plan";
  }
  if (
    roles.some(
      (role) =>
        role === "memory" ||
        role === "memory_support" ||
        role === "setup" ||
        role === "build_rig" ||
        dependencies.isRunnerEconomyRole(role) ||
        role.includes("draw") ||
        role.includes("search"),
    )
  ) {
    return "generic_setup";
  }
  if (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource"
  ) {
    return "generic_setup";
  }
  return "ignore";
}

export function runnerLoanSpendKindRank(
  kind: RunnerLoanSpendCandidateKind,
): number {
  switch (kind) {
    case "critical_breaker":
      return 4;
    case "direct_plan":
      return 3;
    case "generic_setup":
      return 2;
    case "ignore":
      return 0;
  }
}
