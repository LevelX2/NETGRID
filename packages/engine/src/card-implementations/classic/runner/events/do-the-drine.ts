import type { CardImplementationDefinition } from "../../../types";

// card name: Do the Drine
// text: Suffer any amount of brain damage, but not enough to flatline you or to reduce your hand size to less than 0. Gain [4] for each point of brain damage you suffer in this way. This damage cannot be prevented.
export const classicDoTheDrineImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_036_do-the-drine",
  runnerEventLongtail: {
    kind: "do_the_drine_unpreventable_core_damage_for_credits",
    creditsPerDamage: 4,
    visibility: "public",
  },
};
