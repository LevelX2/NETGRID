import type { CardImplementationDefinition } from "../../../types";

// card name: Bioweapons Engineering
// text: Each source of meat damage inflicts +1 meat damage.
export const bioweaponsEngineeringImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_190_bioweapons-engineering",
  scoredAgenda: {
    kind: "meat_damage_bonus",
    amount: 1,
    visibility: "public",
  },
};
