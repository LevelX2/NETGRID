import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createDiscardKeepScore } from "./discard-keep-score";
import { createRunnerVisibleCardContext } from "./runner-visible-card-context";
import type { VisibleCardHeuristicDefinition } from "./visible-card-heuristics";

export type RunnerVisibleCardDiscardCompositionDependencies = {
  visibleCardDefinition: (
    card: VisibleCard,
  ) => VisibleCardHeuristicDefinition | undefined;
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  visibleBreakerRolesForAi: (card: VisibleCard) => readonly string[];
  rolesForCardId: (cardId: string | undefined) => readonly string[];
  cardDefinitionTypeForAi: (cardId: string | undefined) => string | undefined;
  isRunnerEconomyRole: (role: string) => boolean;
};

export function createRunnerVisibleCardDiscardComposition(
  dependencies: RunnerVisibleCardDiscardCompositionDependencies,
) {
  const {
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
  } = createRunnerVisibleCardContext({
    visibleCardDefinition: dependencies.visibleCardDefinition,
    isVisibleIcebreakerProgram: dependencies.isVisibleIcebreakerProgram,
    knownPathAssessment: (runtimeInput: AiDecisionInput, server) =>
      dependencies.assessKnownRezzedIcePath(
        server.ice,
        runtimeInput.playerView.own.rig ?? [],
        runtimeInput.playerView.own.credits,
        server.root,
      ),
    visibleBreakerRoles: dependencies.visibleBreakerRolesForAi,
  });

  const discardKeepScore = createDiscardKeepScore({
    rolesForCardId: dependencies.rolesForCardId,
    definitionTypeForCardId: dependencies.cardDefinitionTypeForAi,
    visibleCardPlayOrInstallCost: visibleCardPlayOrInstallCostForAi,
    runnerCardAddressesVisibleBreakerNeed,
    runnerBadPublicityOrTraceTechCard,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    runnerCardLooksLikeCreditPayout,
  });

  return {
    visibleCardPlayOrInstallCostForAi,
    runnerCardLooksLikeCreditPayout,
    runnerBadPublicityOrTraceTechCard,
    runnerCardAddressesVisibleBreakerNeed,
    visibleBreakerCardCanAddressIce,
    discardKeepScore,
  };
}
