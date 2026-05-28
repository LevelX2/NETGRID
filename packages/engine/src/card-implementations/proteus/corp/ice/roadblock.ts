import type { CardImplementationDefinition } from "../../../types";

// card name: Roadblock
// text: *End the run. When Runner encounters Roadblock, roll a die. On a 6, derez Roadblock, and Runner automatically passes it; otherwise, add the result to Roadblock's strength for that encounter.
export const proteusRoadblockImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_035_roadblock",
  printedSubroutines: [
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
  iceEncounter: {
    kind: "roll_die_strength_or_derez_auto_pass",
    dieFaces: 6,
    successValue: 6,
    strengthDuration: "current_encounter",
    visibility: "public",
  },
};
