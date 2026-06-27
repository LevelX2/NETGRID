import type { AiDecisionInput } from "@netgrid/shared";
import {
  deckDoctrineRoleIsAgenda,
  deckDoctrineRoleIsBreaker,
  deckDoctrineRoleIsIce,
  rolesForDeckDoctrineCard,
} from "./deck-doctrine-card-roles";

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
  const handRoles = input.playerView.own.gripOrHq.flatMap((card) =>
    rolesForDeckDoctrineCard(card.definitionId ?? ""),
  );
  const agendaCount = handRoles.filter(deckDoctrineRoleIsAgenda).length;
  const iceCount = handRoles.filter(deckDoctrineRoleIsIce).length;
  const economyCount = handRoles.filter(
    (role) => role.includes("economy") || role.includes("draw"),
  ).length;
  const remoteRootCount = handRoles.filter(
    (role) =>
      role.includes("asset") ||
      role.includes("upgrade") ||
      role.includes("remote_support"),
  ).length;
  const semanticContext = openingSemanticContext(input);
  const hasScorelineStrategy = semanticContext.strategies.some(
    (strategy) =>
      strategy === "corp.remote_scoring" ||
      strategy === "corp.rush_score" ||
      strategy === "corp.fast_advance",
  );
  const hasRemoteProtectionSupport =
    semanticContext.corpRemoteProtectionTools > 0 ||
    semanticContext.strategies.includes("corp.ice_tax_glacier");
  let score = 0;
  const reasons: string[] = [];
  const evidence = [
    `opening_agendas:${agendaCount}`,
    `opening_ice:${iceCount}`,
    `opening_economy:${economyCount}`,
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

export function evaluateRunnerOpeningHand(
  input: AiDecisionInput,
): RunnerOpeningHandEvaluation {
  const handRoles = input.playerView.own.gripOrHq.flatMap((card) =>
    rolesForDeckDoctrineCard(card.definitionId ?? ""),
  );
  const breakerCount = handRoles.filter(deckDoctrineRoleIsBreaker).length;
  const economyCount = handRoles.filter(
    (role) => role.includes("economy") || role.includes("draw"),
  ).length;
  const setupCount = handRoles.filter(
    (role) =>
      role === "runner_program" ||
      role === "setup_runner" ||
      role === "setup_hardware" ||
      role === "runner_resource" ||
      role === "memory",
  ).length;
  const pressureCount = handRoles.filter(
    (role) =>
      role === "run_pressure" ||
      role === "pressure_rnd" ||
      role === "pressure_hq" ||
      role === "remote_contest" ||
      role === "multiaccess",
  ).length;
  const handSize = input.playerView.own.gripOrHq.length;
  const semanticContext = openingSemanticContext(input);
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
    semanticContext.strategies.some(
      (strategy) =>
        strategy === "runner.rig_first" ||
        strategy === "runner.search.breaker",
    )
  ) {
    score += breakerCount > 0 && setupCount > 0 ? 12 : setupCount > 0 ? 6 : 0;
  } else if (
    semanticContext.runnerEconomyTools > 0 &&
    semanticContext.strategies.includes("runner.economy_first")
  ) {
    score += economyCount > 0 ? 12 : 4;
  } else if (
    semanticContext.strategies.some(
      (strategy) =>
        strategy === "runner.rnd_pressure" ||
        strategy === "runner.hq_pressure" ||
        strategy === "runner.remote_contest",
    )
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
  const neutral =
    strategyProfile?.warnings.includes("strategy_profile:neutral_missing_snapshot") ===
      true || strategies.length === 0;
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

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
