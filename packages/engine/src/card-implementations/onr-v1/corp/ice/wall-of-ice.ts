import type { CardImplementationDefinition } from "../../../types";

// card name: Wall of Ice
// text: *Do 2 Net damage. *Do 2 Net damage. *End the run. *End the run.
export const wallOfIceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_278_wall-of-ice",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 2,
      preventable: true,
      text: "*Do 2 Net damage.",
      visibility: "public",
    },
    {
      kind: "damage",
      damageType: "net",
      amount: 2,
      preventable: true,
      text: "*Do 2 Net damage.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
