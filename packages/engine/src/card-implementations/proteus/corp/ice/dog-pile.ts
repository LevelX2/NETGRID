import type { CardImplementationDefinition } from "../../../types";

// card name: Dog Pile
// text: *Do 1 Net damage for each rezzed piece of ice installed outside Dog Pile. *End the run. Dog Pile has +1 strength for each rezzed piece of ice installed outside it.
export const proteusDogPileImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_021_dog-pile",
  relativeIce: {
    kind: "rezzed_ice_outside_this_ice",
    strengthBonusPerCount: 1,
    dynamicDamageSubroutine: {
      subroutineId: "onr_proteus_021_dog_pile_net_damage",
      amountPerCount: 1,
      visibility: "public",
    },
  },
};
