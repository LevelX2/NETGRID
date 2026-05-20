import type { CardImplementationDefinition } from "../../../types";

// card name: Liche
// text: *Do 1 brain damage. *Do 1 brain damage. *Do 1 brain damage. *End the run.
export const licheImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_254_liche",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
      visibility: "public",
    },
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
      visibility: "public",
    },
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
      visibility: "public",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
