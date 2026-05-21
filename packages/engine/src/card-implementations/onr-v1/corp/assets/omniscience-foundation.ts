import type { CardImplementationDefinition } from "../../../types";

// card name: Omniscience Foundation
// text: Give Runner a tag at the end of each turn during which Runner received a tag.
export const omniscienceFoundationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_333_omniscience-foundation",
  corpUtility: {
    kind: "omniscience_foundation_end_turn_tag",
    visibility: "public",
  },
};
