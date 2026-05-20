import type { CardImplementationDefinition } from "../../../types";

// card name: Code Corpse
// text: *Do 1 brain damage. *Do 1 brain damage. *End the run.
export const codeCorpseImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_229_code-corpse",
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
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
};
