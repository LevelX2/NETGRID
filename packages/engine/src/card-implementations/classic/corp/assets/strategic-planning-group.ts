import type { CardImplementationDefinition } from "../../../types";

// card name: Strategic Planning Group
// text: Whenever you draw one or more cards, draw an extra card. Then place one of the drawn cards on the bottom of R&D. Only one unique card of a particular name can be in play at a time.
export const classicStrategicPlanningGroupImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_025_strategic-planning-group",
    unique: {
      kind: "unique_by_title",
      controller: "corp",
    },
    corpUtility: {
      kind: "corp_draw_extra_then_bottom_one",
      extraDraw: 1,
      bottom: "one_drawn_card",
      visibility: "hidden_info_barrier",
    },
  };
