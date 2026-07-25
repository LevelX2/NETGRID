import type { AiDecisionInput } from "@netgrid/shared";
import {
  buildDeckCapabilityProfileFromInput,
  type DeckCapabilityProfile,
} from "../deck-capabilities";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";

type AiDecisionInputWithDeckCapabilities = AiDecisionInput & {
  ownDeckCapabilities?: DeckCapabilityProfile;
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

export type DeckCapabilitiesContext = {
  deckCapabilitiesForInput: (
    input: AiDecisionInput,
  ) => DeckCapabilityProfile;
};

export function createDeckCapabilitiesContext(): DeckCapabilitiesContext {
  function deckCapabilitiesForInput(
    input: AiDecisionInput,
  ): DeckCapabilityProfile {
    const enrichedInput = input as AiDecisionInputWithDeckCapabilities;
    return (
      enrichedInput.ownDeckCapabilities ??
      buildDeckCapabilityProfileFromInput(input, enrichedInput.ownDeckSnapshot)
    );
  }

  return { deckCapabilitiesForInput };
}
