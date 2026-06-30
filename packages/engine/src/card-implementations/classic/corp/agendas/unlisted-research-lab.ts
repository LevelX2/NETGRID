import type { CardImplementationDefinition } from "../../../types";

// card name: Unlisted Research Lab
// text: Draw an additional card at the start of each of your turns.
export const classicUnlistedResearchLabImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_003_unlisted-research-lab",
  scoredAgenda: {
    kind: "corp_start_turn_optional_draw",
    drawCount: 1,
    visibility: "public",
  },
};
