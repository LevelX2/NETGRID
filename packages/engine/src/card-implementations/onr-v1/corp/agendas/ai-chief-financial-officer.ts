import type { CardImplementationDefinition } from "../../../types";

// card name: AI Chief Financial Officer
// text: A: Shuffle cards stored in HQ and the Archives into R&D; then draw five cards.
export const aiChiefFinancialOfficerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_188_ai-chief-financial-officer",
  scoredAgenda: {
    kind: "ai_cfo_shuffle_hq_archives_into_rd_draw",
    drawCount: 5,
    visibility: "hidden_info_barrier",
  },
};
