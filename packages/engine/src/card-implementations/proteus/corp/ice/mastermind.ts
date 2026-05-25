import type { CardImplementationDefinition } from "../../../types";

// card name: Mastermind
// text: *Do 1 brain damage for each rezzed piece of ice installed outside Mastermind. *End the run. Mastermind has +1 strength for each rezzed piece of ice installed outside it.
export const proteusMastermindImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_030_mastermind",
  relativeIce: {
    kind: "rezzed_ice_outside_this_ice",
    strengthBonusPerCount: 1,
    dynamicDamageSubroutine: {
      subroutineId: "onr_proteus_030_mastermind_core_damage",
      amountPerCount: 1,
      visibility: "public",
    },
  },
};
