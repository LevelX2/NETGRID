import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import {
  deckDoctrineRoleIsAgenda,
  deckDoctrineRoleIsBreaker,
  deckDoctrineRoleIsIce,
  rolesForDeckDoctrineCard,
} from "./deck-doctrine-card-roles";
import { rolesMatch } from "./runtime/role-match";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type OpeningHandEvaluation = {
  decision: "keep" | "mulligan";
  score: number;
  reasons: string[];
  evidence: string[];
};

export type CorpOpeningHandEvaluation = OpeningHandEvaluation;
export type RunnerOpeningHandEvaluation = OpeningHandEvaluation;

export function evaluateCorpOpeningHand(
  input: AiDecisionInput,
): CorpOpeningHandEvaluation {
  const handCards = input.playerView.own.gripOrHq.map((card) =>
    corpOpeningCard(card),
  );
  const handRoleGroups = handCards.map((card) => card.roles);
  const agendaCount = handCards.filter((card) => card.type === "agenda").length;
  const iceCount = handCards.filter((card) => card.type === "ice").length;
  const economyCount = handCards.filter(corpOpeningCardProvidesLiquidity).length;
  const remoteRootCount = countOpeningCardsWithRole(
    handRoleGroups,
    corpOpeningRoleIsRemoteRoot,
  );
  const semanticContext = openingSemanticContext(input);
  const strategySet = new Set(semanticContext.strategies);
  const hasScorelineStrategy =
    strategySet.has("corp.remote_scoring") ||
    strategySet.has("corp.rush_score") ||
    strategySet.has("corp.fast_advance");
  const hasRemoteProtectionSupport =
    semanticContext.corpRemoteProtectionTools > 0 ||
    strategySet.has("corp.ice_tax_glacier");
  const strategyAssessment = assessCorpOpeningStrategies(
    handCards,
    semanticContext,
    iceCount,
    economyCount,
    input.playerView.own.credits,
  );
  let score = 0;
  const reasons: string[] = [];
  const evidence = [
    `opening_agendas:${agendaCount}`,
    `opening_ice:${iceCount}`,
    `opening_economy:${economyCount}`,
    `opening_conditional_cards:${strategyAssessment.conditionalCardCount}`,
    `opening_executable_strategy_lines:${strategyAssessment.executableLines.join(",") || "none"}`,
    `opening_supported_strategy_lines:${strategyAssessment.supportedLines.join(",") || "none"}`,
    ...semanticOpeningEvidence(semanticContext),
  ];

  score += iceCount >= 2 ? 25 : iceCount === 1 ? 16 : 0;
  if (iceCount === 0) reasons.push("no_opening_ice");
  score += economyCount >= 1 ? 20 : input.playerView.own.credits >= 5 ? 10 : 0;
  if (economyCount === 0) reasons.push("no_opening_economy");
  score +=
    agendaCount === 0
      ? 20
      : agendaCount === 1
        ? 17
        : agendaCount === 2 && iceCount >= 2
          ? 9
          : 0;
  if (agendaCount >= 3) reasons.push("agenda_flood");
  score +=
    iceCount > 0 && agendaCount <= 2
      ? 15
      : remoteRootCount > 0 && hasRemoteProtectionSupport
        ? 10
        : 0;
  score +=
    economyCount > 0 || input.playerView.own.gripOrHq.length >= 4 ? 10 : 0;
  score +=
    hasScorelineStrategy && iceCount > 0 && agendaCount <= 2
      ? 10
      : hasRemoteProtectionSupport && iceCount >= 2
        ? 10
        : 5;
  score += strategyAssessment.score;

  const lacksExecutableOpening =
    iceCount === 0 &&
    economyCount === 0 &&
    strategyAssessment.executableLines.length === 0;
  if (lacksExecutableOpening) {
    score = Math.min(score, 42);
    reasons.push("no_executable_opening_line");
    evidence.push("opening_viability_cap:42");
  }

  if (agendaCount >= 3 && iceCount === 0) score = Math.min(score, 28);
  if (agendaCount >= 3 && economyCount === 0) score = Math.min(score, 38);
  if (iceCount >= 1 && economyCount >= 1) {
    reasons.push("opening_plan_supported");
  }
  const threshold =
    input.difficulty === "hard" ? 50 : input.difficulty === "easy" ? 58 : 54;
  return {
    decision: score >= threshold ? "keep" : "mulligan",
    score,
    reasons: reasons.length > 0 ? reasons : ["opening_hand_acceptable"],
    evidence,
  };
}

type CorpOpeningCard = {
  card: VisibleCard;
  type?: string;
  roles: string[];
  hint?: AiCardHint;
};

type CorpOpeningStrategyAssessment = {
  score: number;
  conditionalCardCount: number;
  executableLines: string[];
  supportedLines: string[];
};

function corpOpeningCard(card: VisibleCard): CorpOpeningCard {
  const hint = AI_HINTS_BY_CARD.get(card.definitionId ?? "");
  const roles = rolesForDeckDoctrineCard(card.definitionId ?? "");
  const type = card.type ?? hint?.cardType ?? openingTypeFromExactRoles(roles);
  return {
    card,
    ...(type ? { type } : {}),
    roles,
    ...(hint ? { hint } : {}),
  };
}

function openingTypeFromExactRoles(roles: readonly string[]): string | undefined {
  if (roles.some((role) => role === "agenda" || role === "corp_score_agenda")) {
    return "agenda";
  }
  if (roles.some((role) => role === "ice" || role === "corp_install_ice")) {
    return "ice";
  }
  return undefined;
}

function corpOpeningCardProvidesLiquidity(card: CorpOpeningCard): boolean {
  if (!card.hint) {
    return card.roles.some(openingRoleIsEconomy);
  }
  return (card.hint?.effects ?? []).some(
    (effect) =>
      (effect.kind === "economy" ||
        effect.kind === "action_economy" ||
        effect.kind === "start_of_turn_economy" ||
        effect.kind === "recurring_economy") &&
      effect.scope === "corp" &&
      effect.resource === "credits" &&
      (effect.amount ?? 0) > 0,
  );
}

function assessCorpOpeningStrategies(
  cards: readonly CorpOpeningCard[],
  context: OpeningSemanticContext,
  iceCount: number,
  economyCount: number,
  credits: number,
): CorpOpeningStrategyAssessment {
  const strategySet = new Set(context.strategies);
  const supportedLines: string[] = [];
  const executableLines: string[] = [];
  const supports = (card: CorpOpeningCard, strategyId: string) =>
    card.hint?.lineSupport?.some((line) => line === strategyId) === true ||
    card.hint?.strategySupportPairs?.some(
      (pair) => pair.strategyId === strategyId,
    ) === true;
  const fastAdvanceTools = cards.filter((card) =>
    supports(card, "corp.fast_advance"),
  );
  const agendas = cards.filter((card) => card.type === "agenda");
  if (
    strategySet.has("corp.fast_advance") &&
    fastAdvanceTools.length > 0
  ) {
    supportedLines.push("corp.fast_advance");
    if (
      agendas.length > 0 &&
      (economyCount > 0 || credits >= 5)
    ) {
      executableLines.push("corp.fast_advance");
    }
  }

  const tagEnablers = cards.filter((card) =>
    card.hint?.strategySupportPairs?.some(
      (pair) =>
        pair.strategyId === "corp.tag_trace_punish" && pair.role === "enabler",
    ),
  );
  const openingReadyTagEnablers = tagEnablers.filter(
    (card) =>
      !corpOpeningCardNeedsPriorRunnerActivity(card) &&
      !(card.type === "asset" && iceCount === 0),
  );
  const punishPayoffs = cards.filter((card) =>
    card.hint?.strategySupportPairs?.some(
      (pair) =>
        pair.strategyId === "corp.tag_trace_punish" &&
        (pair.role === "punish_payoff" || pair.role === "win_condition"),
    ),
  );
  if (
    strategySet.has("corp.tag_trace_punish") &&
    (tagEnablers.length > 0 || punishPayoffs.length > 0)
  ) {
    supportedLines.push("corp.tag_trace_punish");
    if (
      openingReadyTagEnablers.length > 0 &&
      punishPayoffs.length > 0 &&
      (economyCount > 0 || credits >= 5)
    ) {
      executableLines.push("corp.tag_trace_punish");
    }
  }

  const damagePayoffs = cards.filter((card) =>
    card.hint?.strategySupportPairs?.some(
      (pair) =>
        pair.strategyId === "corp.damage_kill" &&
        (pair.role === "punish_payoff" || pair.role === "win_condition"),
    ),
  );
  if (strategySet.has("corp.damage_kill") && damagePayoffs.length > 0) {
    supportedLines.push("corp.damage_kill");
    if (
      openingReadyTagEnablers.length > 0 &&
      damagePayoffs.length > 0 &&
      (economyCount > 0 || credits >= 5)
    ) {
      executableLines.push("corp.damage_kill");
    }
  }

  const conditionalCardCount = cards.filter(corpOpeningCardIsConditional).length;
  return {
    score:
      Math.min(18, executableLines.length * 12) +
      Math.min(4, supportedLines.length * 2) -
      Math.max(0, conditionalCardCount - 2) * 3,
    conditionalCardCount,
    executableLines: sortedUnique(executableLines),
    supportedLines: sortedUnique(supportedLines),
  };
}

function corpOpeningCardNeedsPriorRunnerActivity(card: CorpOpeningCard): boolean {
  return (card.hint?.conditions ?? []).some((condition) =>
    [
      "requires_runner_attempted_run_last_turn",
      "requires_runner_attempted_multiple_runs_last_turn",
      "requires_runner_trashed_node_last_turn",
    ].includes(condition.kind),
  );
}

function corpOpeningCardIsConditional(card: CorpOpeningCard): boolean {
  return (card.hint?.conditions ?? []).some((condition) =>
    [
      "requires_runner_tagged",
      "requires_runner_attempted_run_last_turn",
      "requires_runner_attempted_multiple_runs_last_turn",
      "requires_installed_advanceable_card",
      "requires_score_window",
      "requires_trace_success",
    ].includes(condition.kind),
  );
}

export function evaluateRunnerOpeningHand(
  input: AiDecisionInput,
): RunnerOpeningHandEvaluation {
  const handRoleGroups = input.playerView.own.gripOrHq.map((card) =>
    rolesForDeckDoctrineCard(card.definitionId ?? ""),
  );
  const breakerCount = countOpeningCardsWithRole(
    handRoleGroups,
    deckDoctrineRoleIsBreaker,
  );
  const economyCount = countOpeningCardsWithRole(
    handRoleGroups,
    openingRoleIsEconomy,
  );
  const setupCount = countOpeningCardsWithRole(
    handRoleGroups,
    (role) =>
      role === "runner_program" ||
      role === "setup_runner" ||
      role === "setup_hardware" ||
      role === "runner_resource" ||
      role === "memory",
  );
  const pressureCount = countOpeningCardsWithRole(
    handRoleGroups,
    (role) =>
      role === "run_pressure" ||
      role === "pressure_rnd" ||
      role === "pressure_hq" ||
      role === "remote_contest" ||
      role === "multiaccess",
  );
  const handSize = input.playerView.own.gripOrHq.length;
  const semanticContext = openingSemanticContext(input);
  const strategySet = new Set(semanticContext.strategies);
  let score = 0;
  const reasons: string[] = [];
  const evidence = [
    `opening_breakers:${breakerCount}`,
    `opening_economy:${economyCount}`,
    `opening_setup:${setupCount}`,
    `opening_pressure:${pressureCount}`,
    ...semanticOpeningEvidence(semanticContext),
  ];

  score += breakerCount >= 2 ? 24 : breakerCount === 1 ? 18 : 0;
  if (breakerCount === 0) reasons.push("no_opening_breaker");
  score +=
    economyCount >= 2
      ? 22
      : economyCount === 1
        ? 18
        : input.playerView.own.credits >= 5
          ? 8
          : 0;
  if (economyCount === 0) reasons.push("no_opening_economy");
  score += setupCount >= 3 ? 16 : setupCount >= 1 ? 10 : 0;
  score +=
    pressureCount > 0 && (breakerCount > 0 || economyCount > 0)
      ? 12
      : pressureCount > 0
        ? 4
        : 0;
  score += handSize >= 4 && handSize <= 6 ? 14 : handSize >= 3 ? 8 : 0;

  if (
    strategySet.has("runner.rig_first") ||
    strategySet.has("runner.search.breaker")
  ) {
    score += breakerCount > 0 && setupCount > 0 ? 12 : setupCount > 0 ? 6 : 0;
  } else if (
    semanticContext.runnerEconomyTools > 0 &&
    strategySet.has("runner.economy_first")
  ) {
    score += economyCount > 0 ? 12 : 4;
  } else if (
    strategySet.has("runner.rnd_pressure") ||
    strategySet.has("runner.hq_pressure") ||
    strategySet.has("runner.remote_contest")
  ) {
    score +=
      pressureCount > 0 && (breakerCount > 0 || economyCount > 0) ? 12 : 4;
  } else {
    score += 6;
  }

  if (breakerCount === 0 && economyCount === 0) score = Math.min(score, 30);
  if (pressureCount >= 3 && breakerCount === 0) {
    score = Math.min(score, economyCount > 0 ? 44 : 32);
  }
  if (breakerCount >= 1 && economyCount >= 1) {
    reasons.push("opening_runner_plan_supported");
  }
  const threshold =
    input.difficulty === "hard" ? 50 : input.difficulty === "easy" ? 58 : 54;
  return {
    decision: score >= threshold ? "keep" : "mulligan",
    score,
    reasons: reasons.length > 0 ? reasons : ["opening_hand_acceptable"],
    evidence,
  };
}

type OpeningSemanticContext = {
  strategies: string[];
  strategyProfileStatus: "present" | "neutral" | "missing";
  runnerEconomyTools: number;
  corpRemoteProtectionTools: number;
  capabilityConfidence?: string;
};

function openingSemanticContext(input: AiDecisionInput): OpeningSemanticContext {
  const semanticInput = input as AiDecisionInput & {
    ownDeckStrategyProfile?: {
      primaryStrategies: string[];
      secondaryStrategies: string[];
      warnings: string[];
    };
    ownDeckCapabilities?: {
      confidence?: string;
      runner?: {
        economyBankTools?: readonly unknown[];
      };
      corp?: {
        remotePlanProfile?: {
          remoteProtectionToolsKnown?: number;
        };
      };
    };
  };
  const strategyProfile = semanticInput.ownDeckStrategyProfile;
  const strategies = sortedUnique([
    ...(strategyProfile?.primaryStrategies ?? []),
    ...(strategyProfile?.secondaryStrategies ?? []),
  ]);
  const warningSet = new Set(strategyProfile?.warnings ?? []);
  const neutral =
    warningSet.has("strategy_profile:neutral_missing_snapshot") ||
    strategies.length === 0;
  return {
    strategies,
    strategyProfileStatus: strategyProfile
      ? neutral
        ? "neutral"
        : "present"
      : "missing",
    runnerEconomyTools:
      semanticInput.ownDeckCapabilities?.runner?.economyBankTools?.length ?? 0,
    corpRemoteProtectionTools:
      semanticInput.ownDeckCapabilities?.corp?.remotePlanProfile
        ?.remoteProtectionToolsKnown ?? 0,
    ...(semanticInput.ownDeckCapabilities?.confidence
      ? { capabilityConfidence: semanticInput.ownDeckCapabilities.confidence }
      : {}),
  };
}

function semanticOpeningEvidence(context: OpeningSemanticContext): string[] {
  return [
    `strategy_profile:${context.strategyProfileStatus}`,
    `strategy_lines:${context.strategies.slice(0, 3).join(",") || "none"}`,
    `runner_economy_tools:${context.runnerEconomyTools}`,
    `corp_remote_protection_tools:${context.corpRemoteProtectionTools}`,
    ...(context.capabilityConfidence
      ? [`deck_capability_confidence:${context.capabilityConfidence}`]
      : []),
  ];
}

function openingRoleIsEconomy(role: string): boolean {
  return rolesMatch([role], ["economy", "draw"]);
}

function corpOpeningRoleIsRemoteRoot(role: string): boolean {
  return rolesMatch([role], ["asset", "upgrade", "remote_support"]);
}

function countOpeningCardsWithRole(
  roleGroups: readonly (readonly string[])[],
  predicate: (role: string) => boolean,
): number {
  return roleGroups.filter((roles) => roles.some(predicate)).length;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
