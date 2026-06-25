import type { AiDecisionInput } from "@netgrid/shared";
import {
  buildDeckCapabilityProfileFromInput,
  type DeckCapabilityProfile,
} from "../deck-capabilities";

type AiDecisionInputWithDeckCapabilities = AiDecisionInput & {
  ownDeckCapabilities?: DeckCapabilityProfile;
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
    return (
      (input as AiDecisionInputWithDeckCapabilities).ownDeckCapabilities ??
      buildDeckCapabilityProfileFromInput(input)
    );
  }

  return { deckCapabilitiesForInput };
}
