import type { CardImplementationDefinition } from "../../../types";

// card name: Schlaghund
// text: A: Roll a die. If you roll less than or equal to the number of tags Runner has, Schlaghund does 10 meat damage and you trash Schlaghund.
export const schlaghundImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_339_schlaghund",
  uniqueDirectLongtail: {
    kind: "tag_threshold_meat_damage_asset",
    damageType: "meat",
    damageAmount: 10,
    trashSourceOnSuccess: true,
    visibility: "public",
  },
};
