import type { CardImplementationDefinition } from "../../../types";

// card name: Zombie
// text: *Do 1 brain damage. *Do 1 brain damage. *End the run.
export const zombieImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_280_zombie",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
    },
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
