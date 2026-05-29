import type { CardImplementationDefinition } from "../../../types";

// card name: Obfuscated Fortress
// text: At the start of a run on this fort, Runner announces a run spend cap.
export const proteusObfuscatedFortressImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_066_obfuscated-fortress",
  corpUtility: {
    kind: "fort_start_runner_spend_cap",
    timing: "start_of_run",
    target: "source_fort",
    mayRezAtWindow: true,
    visibility: "public",
  },
};
