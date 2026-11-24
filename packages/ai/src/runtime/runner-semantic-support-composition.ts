import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  createRunnerBaselineSupportComposition,
  type RunnerBaselineSupportCompositionDependencies,
} from "./runner-baseline-support-composition";
import {
  createRunnerRandomBreakOrDamageRiskComposition,
  type RunnerRandomBreakOrDamageRiskCompositionDependencies,
} from "./runner-blink-risk-composition";
export type RunnerSemanticSupportCompositionDependencies =
  RunnerBaselineSupportCompositionDependencies &
    Omit<
      RunnerRandomBreakOrDamageRiskCompositionDependencies<
        DeckCapabilityProfile,
        RunnerStrategicIntentProfile
      >,
      "deckCapabilitiesForInput" | "strategicIntentForInput"
    >;

export function createRunnerSemanticSupportComposition(
  dependencies: RunnerSemanticSupportCompositionDependencies,
) {
  const baseline = createRunnerBaselineSupportComposition(dependencies);

  const randomBreakOrDamageRisk =
    createRunnerRandomBreakOrDamageRiskComposition({
      ...dependencies,
      deckCapabilitiesForInput: baseline.deckCapabilitiesForInput,
      strategicIntentForInput: baseline.runnerStrategicIntentForInput,
    });

  return {
    ...baseline,
    ...randomBreakOrDamageRisk,
  };
}
