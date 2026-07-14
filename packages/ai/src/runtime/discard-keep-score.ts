import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import {
  discardPlanFitBonus,
  discardStrategicFitBonus,
} from "./discard-fit-bonus";
import { discardCurrentPlanKind } from "./discard-plan";
import { sortedUnique } from "./collection";
import { matchingBreakerRoleNeedles } from "./breaker-role-match";
import { rolesMatch } from "./role-match";
import { isRunnerNonAdditiveUtilityRole } from "./runner-role-classification";
import { createAiHintsByCard } from "../ai-hints";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type DiscardCandidateScore = {
  total: number;
  baseValue: number;
  planFit: number;
  strategicFit: number;
  evidence: string[];
};

export type DiscardKeepScoreDependencies = {
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly definitionTypeForCardId: (
    cardId: string | undefined,
  ) => string | undefined;
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
  const type =
    card.type ?? dependencies.definitionTypeForCardId(card.definitionId);
  const cost = dependencies.visibleCardPlayOrInstallCost(card);
  const runnerPlanRelevantBreaker =
    input.side === "runner" &&
    dependencies.runnerCardAddressesVisibleBreakerNeed(input, card);
  const runnerBadPublicityTraceTech =
    input.side === "runner" &&
    dependencies.runnerBadPublicityOrTraceTechCard(card, roles);
  const runnerEconomyOrPayout =
    input.side === "runner" &&
    (roles.some((role) => dependencies.isRunnerEconomyRole(role)) ||
      dependencies.runnerCardLooksLikeCreditPayout(card));
  const runnerFundingEconomyCard =
    input.side === "runner" &&
    cost > input.playerView.own.credits &&
    runnerEconomyOrPayout;
  const runnerMissingBreakerSearchAccess =
    input.side === "runner" &&
    rolesMatch(roles, ["program_search", "breaker_search"]) &&
    runnerHasDeckBreakerCoverageUnavailableOutsideStack(input);
  const duplicateCount = input.playerView.own.gripOrHq.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  const installedSameDefinition =
    input.side === "runner" &&
    (input.playerView.own.rig ?? []).some(
      (candidate) => candidate.definitionId === card.definitionId,
    );
  const breakerRoleNeedles = matchingBreakerRoleNeedles(roles);
  const installedRigRoles =
    input.side === "runner"
      ? (input.playerView.own.rig ?? []).flatMap((rigCard) =>
          dependencies.rolesForCardId(rigCard.definitionId),
        )
      : [];
  const installedSameBreakerRole =
    input.side === "runner" &&
    breakerRoleNeedles.some((needle) =>
      rolesMatch(installedRigRoles, [needle]),
    );
  const runnerRedundantBreakerDuplicate =
    input.side === "runner" &&
    installedSameBreakerRole &&
    (installedSameDefinition || duplicateCount > 1);
  const runnerNonAdditiveDuplicate =
    input.side === "runner" &&
    (duplicateCount > 1 || installedSameDefinition) &&
    roles.some((role) => isRunnerNonAdditiveUtilityRole(role));
  let baseValue = 100;
  const corpAdvancementBurstSupportsVisibleAgenda =
    input.side === "corp" &&
    type === "operation" &&
    corpCardIsReviewedAdvancementBurst(card.definitionId) &&
    corpHasVisibleAgendaDevelopmentTarget(input, dependencies);
  const corpConditionalPayoff =
    input.side === "corp"
      ? corpConditionalPayoffKeepAdjustment(input, card.definitionId)
      : { value: 0, evidence: [] as string[] };

  if (input.side === "corp") {
    if (type === "agenda") baseValue += 330;
    if (type === "ice" || rolesMatch(roles, ["ice", "etr_ice"]))
      baseValue += 320;
    const economyRole = rolesMatch(roles, ["economy"]);
    if (type === "operation") baseValue += economyRole ? 120 : 40;
    if (economyRole) baseValue += input.playerView.own.credits < 5 ? 135 : 55;
    if (rolesMatch(roles, ["score", "remote"])) baseValue += 70;
    if (corpAdvancementBurstSupportsVisibleAgenda) baseValue += 420;
  } else {
    if (breakerRoleNeedles.length > 0) {
      baseValue += installedSameBreakerRole ? 95 : 210;
    }
    if (runnerEconomyOrPayout)
      baseValue += input.playerView.own.credits < 4 ? 230 : 150;
    if (rolesMatch(roles, ["memory", "setup", "build_rig"])) baseValue += 80;
    if (rolesMatch(roles, ["draw"])) baseValue += 55;
    if (rolesMatch(roles, ["run_pressure"]))
      baseValue += input.playerView.own.credits < 4 ? 20 : 90;
    if (runnerPlanRelevantBreaker) baseValue += 360;
    if (runnerMissingBreakerSearchAccess) baseValue += 420;
    if (runnerBadPublicityTraceTech) baseValue += 240;
    if (runnerFundingEconomyCard) baseValue += 260;
    if (
      duplicateCount <= 1 &&
      !installedSameDefinition &&
      (breakerRoleNeedles.length > 0 ||
        runnerEconomyOrPayout ||
        rolesMatch(roles, ["memory", "setup", "build_rig", "draw"]) ||
        rolesMatch(roles, ["run_pressure"]) ||
        runnerPlanRelevantBreaker ||
        runnerMissingBreakerSearchAccess ||
        runnerBadPublicityTraceTech)
    ) {
      baseValue += 110;
    }
  }

  const playableOrInstallableNow = input.legalActions.some(
    (action) =>
      action.source === card.instanceId && action.type !== "resolve_choice",
  );
  if (playableOrInstallableNow)
    baseValue += input.side === "runner" && runnerEconomyOrPayout ? 150 : 90;
  if (duplicateCount > 1 && type !== "agenda")
    baseValue -= (runnerNonAdditiveDuplicate ? 170 : 75) * (duplicateCount - 1);
  if (runnerNonAdditiveDuplicate && installedSameDefinition) baseValue -= 180;
  if (runnerRedundantBreakerDuplicate) {
    baseValue -= 220 + Math.max(0, duplicateCount - 1) * 180;
  }
  if (
    cost > input.playerView.own.credits + 3 &&
    type !== "agenda" &&
    !runnerPlanRelevantBreaker &&
    !runnerBadPublicityTraceTech &&
    !runnerFundingEconomyCard
  )
    baseValue -= 70;
  baseValue += corpConditionalPayoff.value;
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
      ...(corpAdvancementBurstSupportsVisibleAgenda
        ? ["discard_score:corp_visible_agenda_advancement_burst"]
        : []),
      ...(runnerMissingBreakerSearchAccess
        ? ["discard_score:runner_missing_breaker_search_access"]
        : []),
      ...corpConditionalPayoff.evidence,
      ...(planFit > 0 ? ["discard_score:planfit"] : []),
      ...(strategicFit > 0 ? ["discard_score:strategicfit"] : []),
    ]),
  };
}

function runnerHasDeckBreakerCoverageUnavailableOutsideStack(
  input: AiDecisionInput,
): boolean {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const matrix =
    semanticInput.ownDeckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return false;
  return (["wall", "code_gate", "sentry"] as const).some((coverage) => {
    const status = matrix[coverage];
    return (
      status.inDeckKnown === true &&
      status.installed !== true &&
      status.inHand !== true
    );
  });
}

function corpConditionalPayoffKeepAdjustment(
  input: AiDecisionInput,
  definitionId: string,
): { value: number; evidence: string[] } {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const signals = new Set(
    (hint as { tacticSignals?: readonly string[] } | undefined)
      ?.tacticSignals ?? [],
  );
  const runnerTags = input.playerView.opponent.tags;
  const ownAgendaPoints = input.playerView.own.agendaPoints;
  if (
    signals.has("condition.runner_has_two_or_more_tags") ||
    signals.has("risk.agenda_point_cost")
  ) {
    const payoffLive = runnerTags >= 2 && ownAgendaPoints >= 3;
    return payoffLive
      ? {
          value: 320,
          evidence: ["discard_score:corp_conditional_payoff_live"],
        }
      : {
          value: -420,
          evidence: ["discard_score:corp_conditional_payoff_blocked"],
        };
  }
  if (signals.has("tag.corp_persistent_source")) {
    return {
      value: runnerTags < 2 ? 240 : 120,
      evidence: ["discard_score:corp_tag_source_enabler"],
    };
  }
  if (signals.has("risk.requires_tagged_runner") && runnerTags <= 0) {
    return {
      value: -180,
      evidence: ["discard_score:corp_tag_payoff_prerequisite_missing"],
    };
  }
  return { value: 0, evidence: [] };
}

function corpCardIsReviewedAdvancementBurst(definitionId: string): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.aiSupportStatus === "ai_supported" &&
    hint.quality?.hintReviewed === true &&
    (hint.effects ?? []).some(
      (effect) =>
        effect.timing === "action" &&
        effect.resource === "advancement_counters" &&
        (effect.amount ?? 0) > 0 &&
        (effect.kind === "advance_burst" ||
          effect.kind === "score_acceleration"),
    )
  );
}

function corpHasVisibleAgendaDevelopmentTarget(
  input: AiDecisionInput,
  dependencies: DiscardKeepScoreDependencies,
): boolean {
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => server.root),
  ].some(
    (candidate) =>
      candidate.known !== false &&
      (candidate.type === "agenda" ||
        dependencies.definitionTypeForCardId(candidate.definitionId) ===
          "agenda"),
  );
}

export function createDiscardKeepScore(
  dependencies: DiscardKeepScoreDependencies,
): (
  input: AiDecisionInput,
  card: VisibleCard | undefined,
) => DiscardCandidateScore {
  return (input, card) => discardKeepScore(input, card, dependencies);
}
