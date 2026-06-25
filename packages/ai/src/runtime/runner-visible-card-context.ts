import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  runnerBadPublicityOrTraceTechCard as buildRunnerBadPublicityOrTraceTechCard,
  runnerCardLooksLikeCreditPayout as buildRunnerCardLooksLikeCreditPayout,
  visibleCardPlayOrInstallCost as buildVisibleCardPlayOrInstallCost,
  visibleCardText as buildVisibleCardText,
  type VisibleCardHeuristicDefinition,
} from "./visible-card-heuristics";
import {
  runnerCardAddressesVisibleBreakerNeed as buildRunnerCardAddressesVisibleBreakerNeed,
  visibleBreakerCardCanAddressIce as buildVisibleBreakerCardCanAddressIce,
} from "./runner-visible-breaker-coverage";

type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

type KnownPathAssessment = {
  assessedKnownIceCount: number;
  canReachAccess: boolean;
};

export type RunnerVisibleCardContextDependencies = {
  visibleCardDefinition: (
    card: VisibleCard,
  ) => VisibleCardHeuristicDefinition | undefined;
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
  knownPathAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
  ) => KnownPathAssessment;
  visibleBreakerRoles: (card: VisibleCard) => readonly string[];
};

export type RunnerVisibleCardContext = {
  visibleCardPlayOrInstallCostForAi: (card: VisibleCard) => number;
  runnerCardLooksLikeCreditPayout: (card: VisibleCard) => boolean;
  runnerBadPublicityOrTraceTechCard: (
    card: VisibleCard | undefined,
    roles?: readonly string[],
  ) => boolean;
  runnerCardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  visibleBreakerCardCanAddressIce: (
    breaker: VisibleCard,
    ice: VisibleCard,
  ) => boolean;
};

export function createRunnerVisibleCardContext(
  dependencies: RunnerVisibleCardContextDependencies,
): RunnerVisibleCardContext {
  function visibleCardPlayOrInstallCostForAi(card: VisibleCard): number {
    return buildVisibleCardPlayOrInstallCost(
      card,
      dependencies.visibleCardDefinition(card),
    );
  }

  function runnerCardLooksLikeCreditPayout(card: VisibleCard): boolean {
    return buildRunnerCardLooksLikeCreditPayout(
      card,
      dependencies.visibleCardDefinition(card),
    );
  }

  function runnerBadPublicityOrTraceTechCard(
    card: VisibleCard | undefined,
    roles: readonly string[] = [],
  ): boolean {
    return buildRunnerBadPublicityOrTraceTechCard(
      card,
      roles,
      card ? dependencies.visibleCardDefinition(card) : undefined,
    );
  }

  function runnerCardAddressesVisibleBreakerNeed(
    input: AiDecisionInput,
    card: VisibleCard,
  ): boolean {
    return buildRunnerCardAddressesVisibleBreakerNeed(input, card, {
      isVisibleIcebreakerProgram: dependencies.isVisibleIcebreakerProgram,
      knownPathAssessment: dependencies.knownPathAssessment,
      breakerCanAddressIce: visibleBreakerCardCanAddressIce,
    });
  }

  function visibleBreakerCardCanAddressIce(
    breaker: VisibleCard,
    ice: VisibleCard,
  ): boolean {
    return buildVisibleBreakerCardCanAddressIce(breaker, ice, {
      visibleBreakerRoles: dependencies.visibleBreakerRoles,
      visibleCardText: visibleCardTextForAi,
    });
  }

  function visibleCardTextForAi(card: VisibleCard): string {
    return buildVisibleCardText(card, dependencies.visibleCardDefinition(card));
  }

  return {
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
  };
}
