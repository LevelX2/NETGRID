import type { CardImplementationDefinition } from "../../../types";

// card name: I Got a Rock
// text: A, 3 agenda points, Do 15 meat damage to Runner. Use this ability only if Runner has two or more tags.
export const iGotARockImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_327_i-got-a-rock",
  uniqueDirectLongtail: {
    kind: "i_got_a_rock_tagged_meat_damage",
    requiredRunnerTags: 2,
    agendaPointCost: 3,
    damageType: "meat",
    damageAmount: 15,
    visibility: "public",
  },
};
