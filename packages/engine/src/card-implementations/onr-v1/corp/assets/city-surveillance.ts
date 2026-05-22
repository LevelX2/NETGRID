import type { CardImplementationDefinition } from "../../../types";

// card name: City Surveillance
// text: For each card Runner draws, give Runner a tag unless Runner pays [1], in addition to any other costs, to avoid receiving that tag. You may rez City Surveillance just before the card is drawn.
export const citySurveillanceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_313_city-surveillance",
  remainingReplacementLongtail: {
    kind: "city_surveillance_draw_tag",
    avoidTagCost: 1,
    visibility: "public",
  },
};
