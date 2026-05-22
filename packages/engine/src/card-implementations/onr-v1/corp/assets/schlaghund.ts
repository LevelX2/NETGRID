import type { CardImplementationDefinition } from "../../../types";

// card name: Schlaghund
// text: A: Roll a die. If you roll less than or equal to the number of tags Runner has, Schlaghund does 10 meat damage and you trash Schlaghund.
export const schlaghundImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_339_schlaghund",
  uniqueDirectLongtail: {
    kind: "schlaghund_tag_die_meat_damage",
    damageType: "meat",
    damageAmount: 10,
    trashSourceOnSuccess: true,
    visibility: "public",
  },
};
