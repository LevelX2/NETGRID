import type { CardImplementationDefinition } from "../../../types";

// card name: Fatal Attractor
// text: *The next time Runner encounters a piece of ice during the run, do 3 Net damage unless Runner breaks all subroutines of that piece of ice.
export const fatalAttractorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_242_fatal-attractor",
  printedSubroutines: [
    {
      kind: "next_encounter_unless_fully_break_damage",
      damageType: "net",
      amount: 3,
      text: "*The next time Runner encounters a piece of ice during the run, do 3 Net damage unless Runner breaks all subroutines of that piece of ice.",
    },
  ],
};
