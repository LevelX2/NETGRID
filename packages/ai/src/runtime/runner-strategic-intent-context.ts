import type { AiDecisionInput } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import {
  buildRunnerStrategicIntentProfile,
  type RunnerStrategicIntentProfile,
} from "../runner-strategic-intent";

type AiDecisionInputWithRunnerStrategicIntent = AiDecisionInput & {
  ownRunnerStrategicIntent?: RunnerStrategicIntentProfile;
};

export function runnerStrategicIntentForInput(
  input: AiDecisionInput,
  deckCapabilities: DeckCapabilityProfile,
): RunnerStrategicIntentProfile {
  return (
    (input as AiDecisionInputWithRunnerStrategicIntent)
      .ownRunnerStrategicIntent ??
    buildRunnerStrategicIntentProfile({ deckCapabilities })
  );
}
