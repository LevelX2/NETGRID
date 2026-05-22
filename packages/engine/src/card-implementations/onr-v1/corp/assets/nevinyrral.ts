import type { CardImplementationDefinition } from "../../../types";

// card name: Nevinyrral
// text: Gain an action during each of your turns. If Nevinyrral leaves play while rezzed, you lose the game. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const nevinyrralImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_331_nevinyrral",
  unique: {
    kind: "unique_by_title",
    controller: "corp",
  },
  lifecycle: {
    start_of_corp_turn: [
      {
        effects: [
          {
            kind: "gain_actions",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
  uniqueDirectLongtail: {
    kind: "nevinyrral_action_and_lose_on_rezzed_leave",
    actionGain: 1,
    visibility: "public",
  },
};
