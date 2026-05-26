import type { CardImplementationDefinition } from "../../../types";

// card name: Brain Wash
// text: *Do 1 brain damage.
export const proteusBrainWashImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_011_brain-wash",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
    },
  ],
};
