import type { CardImplementationDefinition } from "../../../types";

// card name: Shock.r
// text: *Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.
export const shockRImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_268_shock-r",
  printedSubroutines: [
    {
      kind: "prohibit_break_and_jack_out_next_ice",
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.",
      visibility: "public",
      breakTags: ["stun"],
    },
  ],
};
