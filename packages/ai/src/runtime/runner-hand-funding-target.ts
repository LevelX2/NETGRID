import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

export type RunnerHandFundingTarget = {
  value: number;
  reason: string;
};

export type RunnerHandFundingTargetDependencies = {
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  visibleCardPlayOrInstallCost: (card: VisibleCard) => number;
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  cardLooksLikeCreditPayout: (card: VisibleCard) => boolean;
  badPublicityOrTraceTechCard: (
    card: VisibleCard | undefined,
    roles: readonly string[],
  ) => boolean;
  rolesMatch: (roles: readonly string[], needles: readonly string[]) => boolean;
};

export function runnerHandFundingTarget(
  input: AiDecisionInput,
  dependencies: RunnerHandFundingTargetDependencies,
): RunnerHandFundingTarget | undefined {
  if (input.side !== "runner") return undefined;
  const credits = input.playerView.own.credits;
  const candidates = input.playerView.own.gripOrHq
    .filter((card) => card.known && card.definitionId)
    .map((card) => {
      const roles = dependencies.rolesForCardId(card.definitionId);
      const cost = dependencies.visibleCardPlayOrInstallCost(card);
      if (cost <= credits || cost <= 0) return undefined;
      const reasons: string[] = [];
      let value = 0;
      if (dependencies.cardAddressesVisibleBreakerNeed(input, card)) {
        value += 820;
        reasons.push("breaker_in_hand");
      }
      if (
        roles.some((role) => dependencies.isRunnerEconomyRole(role)) ||
        dependencies.cardLooksLikeCreditPayout(card)
      ) {
        value += 620;
        reasons.push("economy_card_in_hand");
      }
      if (dependencies.badPublicityOrTraceTechCard(card, roles)) {
        value += 430;
        reasons.push("bad_publicity_or_trace_card_in_hand");
      }
      if (
        dependencies.rolesMatch(roles, [
          "setup",
          "build_rig",
          "memory",
          "runner_program",
        ])
      ) {
        value += 260;
        reasons.push("setup_card_in_hand");
      }
      if (value <= 0) return undefined;
      const missingCredits = cost - credits;
      const nearTermBonus = Math.max(0, 160 - missingCredits * 25);
      const strategicCreditThresholdBonus = cost >= 5 ? 130 : 0;
      return {
        value: Math.min(
          900,
          value + nearTermBonus + strategicCreditThresholdBonus,
        ),
        reason: sortedUnique([
          ...reasons,
          `missing_credits:${missingCredits}`,
          `card_cost:${cost}`,
        ]).join(","),
      };
    })
    .filter((candidate): candidate is RunnerHandFundingTarget =>
      Boolean(candidate),
    )
    .sort(
      (left, right) =>
        right.value - left.value || left.reason.localeCompare(right.reason),
    );
  return candidates[0];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
