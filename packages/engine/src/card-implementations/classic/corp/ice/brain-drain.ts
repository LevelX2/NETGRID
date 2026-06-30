import type { CardImplementationDefinition } from "../../../types";

export const classicBrainDrainImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_007_brain-drain",
  printedSubroutines: [
    {
      kind: "random_damage",
      dieFaces: 6,
      damageOnResults: [1],
      damageType: "brain",
      amount: 3,
      preventable: true,
      text: "*Roll a die. On a 1, do 3 brain damage.",
    },
  ],
};
