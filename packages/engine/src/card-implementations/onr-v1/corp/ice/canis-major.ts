import type { CardImplementationDefinition } from "../../../types";

// card name: Canis Major
// text: *For the remainder of the run, all further ice is encountered at +2 strength.
export const canisMajorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_225_canis-major",
  printedSubroutines: [
    {
      kind: "run_duration_ice_strength",
      amount: 2,
      text: "*For the remainder of the run, all further ice is encountered at +2 strength.",
    },
  ],
};
