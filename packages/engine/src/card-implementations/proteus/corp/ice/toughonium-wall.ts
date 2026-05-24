import type { CardImplementationDefinition } from "../../../types";

// card name: Toughonium Wall
// text: *End the run. *End the run. *End the run. *End the run.
export const proteusToughoniumWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_041_toughoniumtm-wall",
  printedSubroutines: [
    { kind: "end_the_run", text: "*End the run." },
    { kind: "end_the_run", text: "*End the run." },
    { kind: "end_the_run", text: "*End the run." },
    { kind: "end_the_run", text: "*End the run." },
  ],
};
