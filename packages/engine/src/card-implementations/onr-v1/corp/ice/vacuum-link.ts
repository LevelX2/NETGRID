import type { CardImplementationDefinition } from "../../../types";

// card name: Vacuum Link
// text: *Roll a die. If you roll a 1, 2, or 3, Runner resumes the run from that many pieces of rezzed ice back, or jacks out. If there are not that many pieces of ice, Runner returns to the first piece of ice.
export const vacuumLinkImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_275_vacuum-link",
  printedSubroutines: [
    {
      kind: "random_resume_from_rezzed_ice_back_or_jack_out",
      text: "*Roll a die. If you roll a 1, 2, or 3, Runner resumes the run from that many pieces of rezzed ice back, or jacks out. If there are not that many pieces of ice, Runner returns to the first piece of ice.",
    },
  ],
};
