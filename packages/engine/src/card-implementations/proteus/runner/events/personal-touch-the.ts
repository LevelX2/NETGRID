import type { CardImplementationDefinition } from "../../../types";

// card name: Personal Touch, The
// text: Choose one of your installed icebreakers. Put a +1 strength counter on that icebreaker.
export const proteusPersonalTouchTheImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_115_personal-touch-the",
    runnerEventTargetedEffect: {
      kind: "add_strength_counter_to_installed_icebreaker",
      counterType: "power",
      amount: 1,
      visibility: "public",
    },
  };
