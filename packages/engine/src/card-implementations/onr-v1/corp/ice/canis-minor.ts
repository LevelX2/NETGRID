import type { CardImplementationDefinition } from "../../../types";

// card name: Canis Minor
// text: *For the remainder of the run, all further ice is encountered at +1 strength.
export const canisMinorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_226_canis-minor",
  printedSubroutines: [
    {
      kind: "run_duration_ice_strength",
      amount: 1,
      text: "*For the remainder of the run, all further ice is encountered at +1 strength.",
    },
  ],
};
