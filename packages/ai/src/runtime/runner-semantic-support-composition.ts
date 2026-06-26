import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  createRunnerBaselineSupportComposition,
  type RunnerBaselineSupportCompositionDependencies,
} from "./runner-baseline-support-composition";
import {
  createRunnerBlinkRiskComposition,
  type RunnerBlinkRiskCompositionDependencies,
} from "./runner-blink-risk-composition";
import {
  createRunnerDevelopmentSupportComposition,
  type RunnerDevelopmentSupportCompositionDependencies,
} from "./runner-development-support-composition";

export type RunnerSemanticSupportCompositionDependencies =
  RunnerBaselineSupportCompositionDependencies &
    Omit<
      RunnerBlinkRiskCompositionDependencies<
        DeckCapabilityProfile,
        RunnerStrategicIntentProfile
      >,
      "deckCapabilitiesForInput" | "strategicIntentForInput"
    > &
    Omit<
      RunnerDevelopmentSupportCompositionDependencies,
      | "deckCapabilitiesForInput"
      | "strategicIntentForInput"
      | "visibleCardPlayOrInstallCost"
      | "cardAddressesVisibleBreakerNeed"
      | "isVisibleIcebreakerProgram"
      | "cardLooksLikeCreditPayout"
      | "badPublicityOrTraceTechCard"
      | "runnerRunTargetEvaluation"
    >;

export function createRunnerSemanticSupportComposition(
  dependencies: RunnerSemanticSupportCompositionDependencies,
) {
  const baseline = createRunnerBaselineSupportComposition(dependencies);

  const blinkRisk = createRunnerBlinkRiskComposition({
    ...dependencies,
    deckCapabilitiesForInput: baseline.deckCapabilitiesForInput,
    strategicIntentForInput: baseline.runnerStrategicIntentForInput,
  });

  const development = createRunnerDevelopmentSupportComposition({
    ...dependencies,
    deckCapabilitiesForInput: baseline.deckCapabilitiesForInput,
    strategicIntentForInput: baseline.runnerStrategicIntentForInput,
    visibleCardPlayOrInstallCost:
      baseline.visibleCardPlayOrInstallCostForAi,
    cardAddressesVisibleBreakerNeed:
      baseline.runnerCardAddressesVisibleBreakerNeed,
    isVisibleIcebreakerProgram: baseline.isVisibleIcebreakerProgram,
    cardLooksLikeCreditPayout: baseline.runnerCardLooksLikeCreditPayout,
    badPublicityOrTraceTechCard: baseline.runnerBadPublicityOrTraceTechCard,
    runnerRunTargetEvaluation: blinkRisk.runnerMultiRunTargetEvaluation,
  });

  return {
    ...baseline,
    ...blinkRisk,
    ...development,
  };
}
