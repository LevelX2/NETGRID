import type { CardImplementationDefinition } from "../../../types";

// card name: Arasaka Owns You
// text: Do not play Arasaka Owns You as a normal action; instead, play it when you would suffer enough damage to flatline you. Prevent all of that damage, trash Arasaka Owns You, remove any brain damage you have suffered, and then refresh your hand to its maximum size. Gain [10] and remove all tags, at no cost. You forgo your next four actions, and you forfeit the next 3 agenda points you score.
export const arasakaOwnsYouImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_078_arasaka-owns-you",
  flatlineReplacementSources: [
    {
      kind: "flatline_replacement_from_grip",
      replacement: "flatline_tag_replacement",
      visibility: "public",
    },
  ],
};
