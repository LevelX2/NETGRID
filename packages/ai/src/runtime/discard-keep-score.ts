import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import {
  discardPlanFitBonus,
  discardStrategicFitBonus,
} from "./discard-fit-bonus";
import { discardCurrentPlanKind } from "./discard-plan";
import { sortedUnique } from "./collection";
import { matchingBreakerRoleNeedles } from "./breaker-role-match";
import { rolesMatch } from "./role-match";
import { createAiHintsByCard } from "../ai-hints";
import {
  runnerHintProvidesExposeInformation,
  runnerHintProvidesNonNoisyBreakerCredits,
  runnerHintProvidesSearch,
  runnerHintProvidesTopTrashRecovery,
} from "../runner-canonical-hint-semantics";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  corpHandDuplicateCount,
  corpHandPressureAssessment,
  type CorpHandPressureAssessment,
} from "./corp-hand-inventory-facts";
import type { ProjectedHandDisposition } from "../plans/turn-projection";
import {
  corpDefinitionHasTagSource,
  corpScoreConversionProfile,
  corpTaggedDamagePayoffProfile,
  corpTaggedMeatDamageOperationProfile,
} from "./corp-canonical-card-facts";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type DiscardCandidateScore = {
  total: number;
  baseValue: number;
  planFit: number;
  strategicFit: number;
  planDisposition?: ProjectedHandDisposition;
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
  readonly runnerPlanHandDisposition?: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => ProjectedHandDisposition | undefined;
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
  const runnerVisiblePathTool =
    input.side === "runner" &&
    runnerCardProvidesVisiblePathUtility(input, card.definitionId);
  const runnerMissingBreakerSearchAccess =
    input.side === "runner" &&
    rolesMatch(roles, ["program_search", "breaker_search"]) &&
    runnerHasDeckBreakerCoverageUnavailableOutsideStack(input);
  const duplicateCount =
    input.side === "corp"
      ? corpHandDuplicateCount(input, card.definitionId)
      : input.playerView.own.gripOrHq.filter(
          (candidate) => candidate.definitionId === card.definitionId,
        ).length;
  const corpHandPressure =
    input.side === "corp" ? corpHandPressureAssessment(input) : undefined;
  const installedSameDefinition =
    input.side === "runner" &&
    (input.playerView.own.rig ?? []).some(
      (candidate) => candidate.definitionId === card.definitionId,
    );
  const runnerConditionalSuccessWindowPathTool =
    input.side === "runner" &&
    duplicateCount <= 1 &&
    !installedSameDefinition &&
    runnerCardProvidesConditionalHqSuccessIceTrash(input, card.definitionId);
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
    (runnerHintProvidesExposeInformation(
      AI_HINTS_BY_CARD.get(card.definitionId),
    ) ||
      runnerHintProvidesSearch(AI_HINTS_BY_CARD.get(card.definitionId)) ||
      runnerHintProvidesTopTrashRecovery(
        AI_HINTS_BY_CARD.get(card.definitionId),
      ));
  const runnerUsableNonNoisyBreakerCreditSupport =
    input.side === "runner" &&
    runnerHintProvidesNonNoisyBreakerCredits(
      AI_HINTS_BY_CARD.get(card.definitionId),
    ) &&
    input.playerView.own.rig?.some((rigCard) => {
      const rigRoles = dependencies.rolesForCardId(rigCard.definitionId);
      const subtypes = new Set(
        (rigCard.subtypes ?? []).map((subtype) => subtype.toLowerCase()),
      );
      const isBreaker =
        subtypes.has("icebreaker") ||
        rolesMatch(rigRoles, [
          "icebreaker",
          "universal_breaker",
          "breaker_fracter",
          "breaker_decoder",
          "breaker_killer",
        ]);
      const isNoisy = subtypes.has("noisy") || rolesMatch(rigRoles, ["noisy"]);
      return isBreaker && !isNoisy;
    }) === true;
  const runnerImmediateLiquidityBonus = runnerImmediateLiquidityKeepBonus(
    input,
    card.definitionId,
    cost,
  );
  const runnerMatchpointCloseoutBonus = runnerMatchpointCloseoutKeepBonus({
    input,
    definitionId: card.definitionId,
    duplicateCount,
    installedSameDefinition,
  });
  const runnerSaturatedFiniteBurstPenalty =
    runnerSaturatedFiniteBurstEconomyPenalty(input, card.definitionId);
  const runnerPlanDisposition =
    input.side === "runner"
      ? dependencies.runnerPlanHandDisposition?.(input, card)
      : undefined;
  let baseValue = 100;
  const corpAdvancementBurstSupportsVisibleAgenda =
    input.side === "corp" &&
    type === "operation" &&
    corpCardIsReviewedAdvancementBurst(card.definitionId) &&
    corpHasVisibleAgendaDevelopmentTarget(input, dependencies);
  const corpConditionalPayoff =
    input.side === "corp"
      ? corpConditionalPayoffKeepAdjustment(
          input,
          card.definitionId,
          duplicateCount,
        )
      : { value: 0, evidence: [] as string[] };
  const corpAgendaOverflowValue = corpAgendaOverflowKeepAdjustment(
    input,
    card.definitionId,
    type,
    duplicateCount,
    corpHandPressure,
  );

  if (input.side === "corp") {
    if (type === "agenda") baseValue += 330 + corpAgendaOverflowValue.value;
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
    if (runnerVisiblePathTool)
      baseValue += input.playerView.own.credits < 2 ? 70 : 150;
    if (runnerConditionalSuccessWindowPathTool) baseValue += 420;
    if (runnerPlanRelevantBreaker) baseValue += 360;
    if (runnerMissingBreakerSearchAccess) baseValue += 420;
    if (runnerBadPublicityTraceTech) baseValue += 240;
    if (runnerUsableNonNoisyBreakerCreditSupport) baseValue += 260;
    if (runnerFundingEconomyCard) baseValue += 260;
    baseValue += runnerImmediateLiquidityBonus;
    baseValue += runnerMatchpointCloseoutBonus;
    if (
      duplicateCount <= 1 &&
      !installedSameDefinition &&
      (breakerRoleNeedles.length > 0 ||
        runnerEconomyOrPayout ||
        rolesMatch(roles, ["memory", "setup", "build_rig", "draw"]) ||
        rolesMatch(roles, ["run_pressure"]) ||
        runnerVisiblePathTool ||
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
  if (
    input.side === "corp" &&
    type === "operation" &&
    rolesMatch(roles, ["economy"])
  ) {
    baseValue += 100;
  }
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
  baseValue -= runnerSaturatedFiniteBurstPenalty;
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
    ...(runnerPlanDisposition
      ? { planDisposition: runnerPlanDisposition }
      : {}),
    evidence: sortedUnique([
      "discard_score:base",
      ...(corpAdvancementBurstSupportsVisibleAgenda
        ? ["discard_score:corp_visible_agenda_advancement_burst"]
        : []),
      ...(input.side === "corp" &&
      type === "operation" &&
      rolesMatch(roles, ["economy"])
        ? ["discard_score:corp_economy_operation"]
        : []),
      ...(corpHandPressure
        ? [`discard_score:corp_hand_pressure:${corpHandPressure.status}`]
        : []),
      ...corpAgendaOverflowValue.evidence,
      ...(input.side === "corp" && duplicateCount > 1
        ? [`discard_score:corp_hand_duplicate_count:${duplicateCount}`]
        : []),
      ...(runnerMissingBreakerSearchAccess
        ? ["discard_score:runner_missing_breaker_search_access"]
        : []),
      ...(runnerVisiblePathTool
        ? ["discard_score:runner_visible_path_tool"]
        : []),
      ...(runnerConditionalSuccessWindowPathTool
        ? ["discard_score:runner_conditional_success_window_path_tool"]
        : []),
      ...(runnerImmediateLiquidityBonus > 0
        ? ["discard_score:runner_immediate_liquidity"]
        : []),
      ...(runnerMatchpointCloseoutBonus > 0
        ? ["discard_score:runner_matchpoint_closeout"]
        : []),
      ...(runnerUsableNonNoisyBreakerCreditSupport
        ? ["discard_score:runner_usable_non_noisy_breaker_credit_support"]
        : []),
      ...(runnerSaturatedFiniteBurstPenalty > 0
        ? ["discard_score:runner_saturated_finite_burst_economy"]
        : []),
      ...(runnerPlanDisposition
        ? [`discard_score:runner_plan_disposition:${runnerPlanDisposition}`]
        : []),
      ...corpConditionalPayoff.evidence,
      ...(planFit > 0 ? ["discard_score:planfit"] : []),
      ...(strategicFit > 0 ? ["discard_score:strategicfit"] : []),
    ]),
  };
}

function runnerSaturatedFiniteBurstEconomyPenalty(
  input: AiDecisionInput,
  definitionId: string,
): number {
  if (input.side !== "runner") return 0;
  const burstAmount = Math.max(
    0,
    ...(AI_HINTS_BY_CARD.get(definitionId)?.effects ?? []).map((effect) =>
      effect.kind === "economy" &&
      effect.timing === "action" &&
      effect.resource === "credits" &&
      effect.target === "economy.burst_credit" &&
      effect.finite === true
        ? (effect.amount ?? 0)
        : 0,
    ),
  );
  if (
    burstAmount <= 0 ||
    input.playerView.own.credits < Math.max(10, burstAmount * 2)
  ) {
    return 0;
  }
  return 220;
}

function runnerImmediateLiquidityKeepBonus(
  input: AiDecisionInput,
  definitionId: string,
  cost: number,
): number {
  if (
    input.side !== "runner" ||
    input.playerView.own.credits >= 4 ||
    cost > input.playerView.own.credits
  ) {
    return 0;
  }
  const payout = runnerCreditPayoutAmount(definitionId);
  const netGain = payout - cost;
  if (netGain <= 0) return 0;
  return 520 + Math.min(160, netGain * 40);
}

function runnerMatchpointCloseoutKeepBonus(params: {
  input: AiDecisionInput;
  definitionId: string;
  duplicateCount: number;
  installedSameDefinition: boolean;
}): number {
  if (
    params.input.side !== "runner" ||
    params.input.playerView.own.agendaPoints <
      Math.max(1, params.input.playerView.agendaPointsToWin - 2) ||
    params.duplicateCount > 1 ||
    params.installedSameDefinition
  ) {
    return 0;
  }
  const hint = AI_HINTS_BY_CARD.get(params.definitionId);
  const multiaccess = (hint?.effects ?? []).some(
    (effect) => effect.kind === "multiaccess" && (effect.amount ?? 0) > 0,
  );
  if (!multiaccess) return 0;
  const strategyIds = runnerDiscardStrategyIds(params.input);
  return (hint?.lineSupport ?? []).some((strategyId) =>
    strategyIds.has(strategyId),
  )
    ? 720
    : 0;
}

function runnerCreditPayoutAmount(definitionId: string): number {
  return Math.max(
    0,
    ...(AI_HINTS_BY_CARD.get(definitionId)?.effects ?? [])
      .filter(
        (effect) =>
          effect.kind === "economy" &&
          effect.resource === "credits" &&
          effect.scope === "runner",
      )
      .map((effect) => effect.amount ?? 0),
  );
}

function runnerDiscardStrategyIds(input: AiDecisionInput): ReadonlySet<string> {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const profile = semanticInput.ownDeckStrategyProfile;
  const intent = semanticInput.ownStrategicIntentState;
  return new Set([
    ...(intent && intent.primaryStrategy.family !== "neutral"
      ? [intent.primaryStrategy.strategyId]
      : []),
    ...(profile?.primaryStrategies ?? []),
    ...(profile?.secondaryStrategies ?? []),
  ]);
}

function runnerCardProvidesVisiblePathUtility(
  input: AiDecisionInput,
  definitionId: string,
): boolean {
  if (!runnerHasVisibleIcedPath(input)) return false;
  const effects = AI_HINTS_BY_CARD.get(definitionId)?.effects ?? [];
  return effects.some(
    (effect) =>
      effect.kind === "ice_trash" ||
      (effect.kind === "future_encounter_effect" &&
        "target" in effect &&
        effect.target === "bypass_first_ice"),
  );
}

function runnerCardProvidesConditionalHqSuccessIceTrash(
  input: AiDecisionInput,
  definitionId: string,
): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const requiresSuccessfulHqRun = (hint?.conditions ?? []).some(
    (condition) => condition.kind === "requires_successful_hq_run",
  );
  const trashesRezzedIce = (hint?.effects ?? []).some(
    (effect) =>
      effect.kind === "ice_trash" &&
      "target" in effect &&
      effect.target === "pay_rez_cost_to_trash_rezzed_ice",
  );
  return (
    requiresSuccessfulHqRun &&
    trashesRezzedIce &&
    input.playerView.servers.some((server) =>
      server.ice.some((card) => card.rezzed === true),
    )
  );
}

function runnerHasVisibleIcedPath(input: AiDecisionInput): boolean {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const targetVector = semanticInput.ownStrategicIntentState?.targetVector;
  const targetId =
    targetVector && "targetId" in targetVector
      ? targetVector.targetId
      : undefined;
  const relevantServers = targetId
    ? input.playerView.servers.filter((server) => server.id === targetId)
    : input.playerView.servers;
  return relevantServers.some((server) => server.ice.length > 0);
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
  duplicateCount: number,
): { value: number; evidence: string[] } {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const signals = cardSemanticSignals(hint);
  const runnerTags = input.playerView.opponent.tags;
  const ownAgendaPoints = input.playerView.own.agendaPoints;
  const reachableTagSource = corpHasReachableTagSource(input);
  const taggedDamagePayoff = corpTaggedDamagePayoffProfile(definitionId);
  const taggedMeatDamageOperation =
    corpTaggedMeatDamageOperationProfile(definitionId);
  if (taggedDamagePayoff) {
    const payoffLive =
      runnerTags >= taggedDamagePayoff.requiredRunnerTags &&
      ownAgendaPoints >= taggedDamagePayoff.agendaPointCost;
    if (payoffLive) {
      return {
        value: 320,
        evidence: ["discard_score:corp_conditional_payoff_live"],
      };
    }
    if (
      ownAgendaPoints >= taggedDamagePayoff.agendaPointCost &&
      reachableTagSource
    ) {
      return {
        value: 300,
        evidence: ["discard_score:corp_conditional_payoff_reachable"],
      };
    }
    return {
      value: -420,
      evidence: ["discard_score:corp_conditional_payoff_blocked"],
    };
  }
  if (taggedMeatDamageOperation) {
    if (runnerTags > 0) {
      return {
        value: 320,
        evidence: ["discard_score:corp_conditional_payoff_live"],
      };
    }
    return reachableTagSource
      ? {
          value: 300,
          evidence: ["discard_score:corp_conditional_payoff_reachable"],
        }
      : {
          value: -180,
          evidence: ["discard_score:corp_tag_payoff_prerequisite_missing"],
        };
  }
  if (signals.has("tag.corp_persistent_source")) {
    const value = diminishedConditionalEnablerValue(
      runnerTags < 2 ? 240 : 120,
      duplicateCount,
    );
    return {
      value,
      evidence: [
        "discard_score:corp_tag_source_enabler",
        ...(duplicateCount > 1
          ? ["discard_score:corp_conditional_enabler_duplicate_diminished"]
          : []),
      ],
    };
  }
  if (
    corpDefinitionHasTagSource(definitionId) &&
    corpHasReachableCardWithAnySignal(input, ["tag.payoff", "damage.payoff"])
  ) {
    const value = diminishedConditionalEnablerValue(320, duplicateCount);
    return {
      value,
      evidence: [
        "discard_score:corp_tag_source_enabler",
        ...(duplicateCount > 1
          ? ["discard_score:corp_conditional_enabler_duplicate_diminished"]
          : []),
      ],
    };
  }
  if (signals.has("risk.requires_tagged_runner") && runnerTags <= 0) {
    if (reachableTagSource) {
      const hardDamagePayoff =
        taggedDamagePayoff !== undefined || signals.has("damage.payoff");
      return hardDamagePayoff
        ? {
            value: 240,
            evidence: ["discard_score:corp_conditional_payoff_reachable"],
          }
        : {
            value: -80,
            evidence: ["discard_score:corp_soft_tag_payoff_not_live"],
          };
    }
    return {
      value: -180,
      evidence: ["discard_score:corp_tag_payoff_prerequisite_missing"],
    };
  }
  return { value: 0, evidence: [] };
}

function diminishedConditionalEnablerValue(
  fullValue: number,
  duplicateCount: number,
): number {
  return Math.ceil(fullValue / Math.max(1, duplicateCount));
}

function corpHasReachableTagSource(input: AiDecisionInput): boolean {
  return corpHasReachableCardMatching(input, corpDefinitionHasTagSource);
}

function corpHasReachableCardMatching(
  input: AiDecisionInput,
  matches: (definitionId: string) => boolean,
): boolean {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const snapshot = semanticInput.ownDeckSnapshot;
  if (input.side !== "corp") return false;
  const activeVisibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers
      .filter((server) => server.id !== "archives")
      .flatMap((server) => [...server.ice, ...server.root]),
  ];
  if (
    activeVisibleCards.some(
      (card) => card.definitionId && matches(card.definitionId),
    )
  ) {
    return true;
  }
  if (!snapshot) return false;
  const allVisibleCards = [
    ...activeVisibleCards,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
  ];
  const visibleCountByDefinitionId = new Map<string, number>();
  for (const card of allVisibleCards) {
    if (!card.definitionId) continue;
    visibleCountByDefinitionId.set(
      card.definitionId,
      (visibleCountByDefinitionId.get(card.definitionId) ?? 0) + 1,
    );
  }
  return snapshot.cards.some(
    (entry) =>
      matches(entry.cardId) &&
      entry.quantity > (visibleCountByDefinitionId.get(entry.cardId) ?? 0),
  );
}

function corpHasReachableCardWithAnySignal(
  input: AiDecisionInput,
  signals: readonly string[],
): boolean {
  const semanticInput = input as AiDecisionInputWithDeckCapabilities;
  const snapshot = semanticInput.ownDeckSnapshot;
  if (input.side !== "corp") return false;
  const activeVisibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers
      .filter((server) => server.id !== "archives")
      .flatMap((server) => [...server.ice, ...server.root]),
  ];
  if (
    activeVisibleCards.some(
      (card) =>
        card.definitionId &&
        cardHasAnySemanticSignal(card.definitionId, signals),
    )
  ) {
    return true;
  }
  if (!snapshot) return false;
  const allVisibleCards = [
    ...activeVisibleCards,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
  ];
  const visibleCountByDefinitionId = new Map<string, number>();
  for (const card of allVisibleCards) {
    if (!card.definitionId) continue;
    visibleCountByDefinitionId.set(
      card.definitionId,
      (visibleCountByDefinitionId.get(card.definitionId) ?? 0) + 1,
    );
  }
  return snapshot.cards.some(
    (entry) =>
      cardHasAnySemanticSignal(entry.cardId, signals) &&
      entry.quantity > (visibleCountByDefinitionId.get(entry.cardId) ?? 0),
  );
}

function cardHasAnySemanticSignal(
  definitionId: string,
  signals: readonly string[],
): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const cardSignals = cardSemanticSignals(hint);
  return signals.some((signal) => cardSignals.has(signal));
}

function cardSemanticSignals(hint: unknown): ReadonlySet<string> {
  const structured = hint as
    | {
        tacticSignals?: readonly string[];
        actionTacticSignals?: readonly string[];
        functionSignals?: readonly string[];
      }
    | undefined;
  return new Set([
    ...(structured?.tacticSignals ?? []),
    ...(structured?.actionTacticSignals ?? []),
    ...(structured?.functionSignals ?? []),
  ]);
}

function corpCardIsReviewedAdvancementBurst(definitionId: string): boolean {
  return corpScoreConversionProfile(definitionId) !== undefined;
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

function corpAgendaOverflowKeepAdjustment(
  input: AiDecisionInput,
  definitionId: string,
  type: string | undefined,
  duplicateCount: number,
  handPressure: CorpHandPressureAssessment | undefined,
): { value: number; evidence: string[] } {
  if (
    input.side !== "corp" ||
    type !== "agenda" ||
    handPressure?.status !== "overflow" ||
    handPressure.agendaCount < 2
  ) {
    return { value: 0, evidence: [] };
  }
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  const agendaPoints = definition?.agendaPoints;
  const advancementRequirement = definition?.advancementRequirement;
  if (
    typeof agendaPoints !== "number" ||
    typeof advancementRequirement !== "number"
  ) {
    return {
      value: 0,
      evidence: ["discard_score:corp_agenda_value_unknown"],
    };
  }
  const scoreEfficiencyValue = agendaPoints * 70 - advancementRequirement * 25;
  const redundantCopyPenalty = Math.max(0, duplicateCount - 1) * 260;
  return {
    value: scoreEfficiencyValue - redundantCopyPenalty,
    evidence: [
      "discard_score:corp_agenda_overflow_value",
      ...(redundantCopyPenalty > 0
        ? ["discard_score:corp_redundant_agenda_under_overflow"]
        : []),
    ],
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
