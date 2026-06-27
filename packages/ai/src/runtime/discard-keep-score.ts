import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import {
  discardPlanFitBonus,
  discardStrategicFitBonus,
} from "./discard-fit-bonus";
import { discardCurrentPlanKind } from "./discard-plan";
import { sortedUnique } from "./collection";
import { rolesMatch } from "./role-match";

export type DiscardCandidateScore = {
  total: number;
  baseValue: number;
  planFit: number;
  strategicFit: number;
  evidence: string[];
};

export type DiscardKeepScoreDependencies = {
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly definitionTypeForCardId: (cardId: string | undefined) => string | undefined;
  readonly visibleCardPlayOrInstallCost: (card: VisibleCard) => number;
  readonly runnerCardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  readonly runnerBadPublicityOrTraceTechCard: (
    card: VisibleCard | undefined,
    roles?: readonly string[],
  ) => boolean;
  readonly isRunnerEconomyRole: (role: string) => boolean;
  readonly runnerCardLooksLikeCreditPayout: (card: VisibleCard) => boolean;
};

export function discardKeepScore(
  input: AiDecisionInput,
  card: VisibleCard | undefined,
  dependencies: DiscardKeepScoreDependencies,
): DiscardCandidateScore {
  if (!card?.definitionId) {
    return {
      total: 0,
      baseValue: 0,
      planFit: 0,
      strategicFit: 0,
      evidence: ["discard_score:base"],
    };
  }
  const roles = dependencies.rolesForCardId(card.definitionId);
  const type = card.type ?? dependencies.definitionTypeForCardId(card.definitionId);
  const cost = dependencies.visibleCardPlayOrInstallCost(card);
  const runnerPlanRelevantBreaker =
    input.side === "runner" &&
    dependencies.runnerCardAddressesVisibleBreakerNeed(input, card);
  const runnerBadPublicityTraceTech =
    input.side === "runner" &&
    dependencies.runnerBadPublicityOrTraceTechCard(card, roles);
  const runnerFundingEconomyCard =
    input.side === "runner" &&
    cost > input.playerView.own.credits &&
    (roles.some((role) => dependencies.isRunnerEconomyRole(role)) ||
      dependencies.runnerCardLooksLikeCreditPayout(card));
  const duplicateCount = input.playerView.own.gripOrHq.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  let baseValue = 100;

  if (input.side === "corp") {
    if (type === "agenda") baseValue += 330;
    if (
      type === "ice" ||
      roles.some((role) => role.endsWith("_ice") || role === "etr_ice")
    )
      baseValue += 320;
    const economyRole = rolesMatch(roles, ["economy"]);
    if (type === "operation") baseValue += economyRole ? 120 : 40;
    if (economyRole) baseValue += input.playerView.own.credits < 5 ? 135 : 55;
    if (rolesMatch(roles, ["score", "remote"]))
      baseValue += 70;
  } else {
    if (rolesMatch(roles, ["breaker_"])) {
      const installedSameBreakerRole = roles.some(
        (role) =>
          role.startsWith("breaker_") &&
          (input.playerView.own.rig ?? []).some((rigCard) =>
            dependencies.rolesForCardId(rigCard.definitionId).includes(role),
          ),
      );
      baseValue += installedSameBreakerRole ? 95 : 210;
    }
    if (rolesMatch(roles, ["economy", "tempo"]))
      baseValue += input.playerView.own.credits < 4 ? 170 : 65;
    if (
      roles.includes("memory") ||
      roles.includes("setup") ||
      roles.includes("build_rig")
    )
      baseValue += 80;
    if (roles.includes("draw")) baseValue += 55;
    if (roles.includes("run_pressure"))
      baseValue += input.playerView.own.credits < 4 ? 20 : 90;
    if (runnerPlanRelevantBreaker) baseValue += 360;
    if (runnerBadPublicityTraceTech) baseValue += 240;
    if (runnerFundingEconomyCard) baseValue += 190;
  }

  if (
    input.legalActions.some(
      (action) =>
        action.source === card.instanceId && action.type !== "resolve_choice",
    )
  )
    baseValue += 90;
  if (duplicateCount > 1 && type !== "agenda")
    baseValue -= 75 * (duplicateCount - 1);
  if (
    cost > input.playerView.own.credits + 3 &&
    type !== "agenda" &&
    !runnerPlanRelevantBreaker &&
    !runnerBadPublicityTraceTech &&
    !runnerFundingEconomyCard
  )
    baseValue -= 70;
  if (roles.length === 0 && type !== "agenda" && !runnerBadPublicityTraceTech)
    baseValue -= 60;

  const currentPlan = discardCurrentPlanKind(input, {
    rolesForCardId: dependencies.rolesForCardId,
    definitionTypeForCardId: dependencies.definitionTypeForCardId,
  });
  const planFit = discardPlanFitBonus(input, roles, type, currentPlan);
  const strategicFit = discardStrategicFitBonus(input, roles, type, cost);
  return {
    total: baseValue + planFit + strategicFit,
    baseValue,
    planFit,
    strategicFit,
    evidence: sortedUnique([
      "discard_score:base",
      ...(planFit > 0 ? ["discard_score:planfit"] : []),
      ...(strategicFit > 0 ? ["discard_score:strategicfit"] : []),
    ]),
  };
}

export function createDiscardKeepScore(
  dependencies: DiscardKeepScoreDependencies,
): (
  input: AiDecisionInput,
  card: VisibleCard | undefined,
) => DiscardCandidateScore {
  return (input, card) => discardKeepScore(input, card, dependencies);
}
