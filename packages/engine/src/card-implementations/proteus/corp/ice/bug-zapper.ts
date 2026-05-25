import type { CardImplementationDefinition } from "../../../types";

// card name: Bug Zapper
// text: *Do 2 Net damage for each rezzed piece of ice installed outside Bug Zapper. *End the run.
export const proteusBugZapperImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_012_bug-zapper",
  relativeIce: {
    kind: "rezzed_ice_outside_this_ice",
    dynamicDamageSubroutine: {
      subroutineId: "onr_proteus_012_bug_zapper_net_damage",
      amountPerCount: 2,
      visibility: "public",
    },
  },
};
