import type { AiDecisionInput } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import {
  buildRunnerStrategicIntentProfile,
  type RunnerStrategicIntentProfile,
} from "../runner-strategic-intent";

type AiDecisionInputWithRunnerStrategicIntent = AiDecisionInput & {
  ownRunnerStrategicIntent?: RunnerStrategicIntentProfile;
};

export type RunnerStrategicIntentContext = {
  runnerStrategicIntentForInput: (
    input: AiDecisionInput,
    deckCapabilities: DeckCapabilityProfile,
  ) => RunnerStrategicIntentProfile;
};

export function createRunnerStrategicIntentContext(): RunnerStrategicIntentContext {
  function runnerStrategicIntentForInput(
    input: AiDecisionInput,
    deckCapabilities: DeckCapabilityProfile,
  ): RunnerStrategicIntentProfile {
    return (
      (input as AiDecisionInputWithRunnerStrategicIntent)
        .ownRunnerStrategicIntent ??
      buildRunnerStrategicIntentProfile({ deckCapabilities })
    );
  }

  return { runnerStrategicIntentForInput };
}
